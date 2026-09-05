import { createClient } from '@supabase/supabase-js'
import { after } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { sendEmail } from '../../../lib/sendEmail'
import { validateMessage } from '../../../lib/validation'
import { ACTIVE_WINDOW_MS, NOTIF_COOLDOWN_MS, buildMessageEmail, buildPreview } from '../../../lib/messageNotifications'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
}

async function getUser(request) {
  const auth = request.headers.get('authorization')
  if (!auth?.startsWith('Bearer ')) return null
  const { data: { user } } = await adminClient().auth.getUser(auth.slice(7))
  return user
}

// Réserve le droit d'envoyer une notification pour cette conversation.
// Retourne false si une notification a déjà été envoyée dans la fenêtre.
// Contrairement aux autres rate limits du projet, on échoue ici en mode FERMÉ :
// si la table est indisponible, mieux vaut ne pas notifier que risquer d'inonder
// la boîte de réception.
async function claimNotificationSlot(supabase, key) {
  const windowStart = new Date(Date.now() - NOTIF_COOLDOWN_MS).toISOString()
  const { count, error } = await supabase
    .from('rate_limits')
    .select('*', { count: 'exact', head: true })
    .eq('key', key)
    .gte('created_at', windowStart)

  if (error) return false
  if (count >= 1) return false

  await supabase.from('rate_limits').insert({ key })
  return true
}

// Libère le verrou quand l'envoi a échoué : sans ça, une panne passagère de
// Resend interdirait toute nouvelle tentative pendant une heure.
async function releaseNotificationSlot(supabase, key) {
  await supabase.from('rate_limits').delete().eq('key', key)
}

// Envoie le courriel au destinataire, sauf s'il est déjà devant sa conversation,
// s'il s'est désabonné, ou s'il a déjà été notifié récemment.
// Retourne la raison de la décision (utile aux tests et au débogage).
async function notifyRecipient(supabase, { conversation, senderId, recipientId, content }) {
  const lastRead = conversation.user1_id === recipientId
    ? conversation.last_read_at_user1
    : conversation.last_read_at_user2
  if (lastRead && Date.now() - new Date(lastRead).getTime() < ACTIVE_WINDOW_MS) return 'active'

  const { data: recipient } = await supabase
    .from('profiles')
    .select('message_emails_opt_in, newsletter_unsub_token')
    .eq('id', recipientId)
    .single()
  if (recipient?.message_emails_opt_in === false) return 'opted-out'

  const slotKey = `msg-notif:${conversation.id}:${recipientId}`
  const claimed = await claimNotificationSlot(supabase, slotKey)
  if (!claimed) return 'cooldown'

  const { data: authData } = await supabase.auth.admin.getUserById(recipientId)
  const to = authData?.user?.email
  if (!to) {
    await releaseNotificationSlot(supabase, slotKey)
    return 'no-email'
  }

  // Conversation initiée par un admin : on affiche "Support BiblioCamp" plutôt
  // que l'identité personnelle de l'admin, comme dans l'inbox.
  let senderName = 'Un étudiant'
  if (conversation.context_type === 'admin' && conversation.user1_id === senderId) {
    senderName = 'Support BiblioCamp'
  } else {
    const { data: sender } = await supabase
      .from('profiles')
      .select('first_name')
      .eq('id', senderId)
      .single()
    if (sender?.first_name) senderName = sender.first_name
  }
  // Le prénom vient de l'utilisateur : on interdit les sauts de ligne dans le
  // sujet, et on échappe le HTML dans le corps.
  senderName = senderName.replace(/[\r\n]+/g, ' ').trim().slice(0, 60)

  const { subject, html } = buildMessageEmail({
    senderName,
    preview: buildPreview(content),
    conversationId: conversation.id,
    unsubToken: recipient?.newsletter_unsub_token,
  })

  try {
    await sendEmail({ to, subject, html })
  } catch (err) {
    await releaseNotificationSlot(supabase, slotKey)
    throw err
  }
  return 'sent'
}

// POST { conversation_id, content } — envoie un message et notifie le destinataire.
// L'auteur est TOUJOURS dérivé du jeton côté serveur, jamais d'un champ client.
export async function POST(request) {
  const user = await getUser(request)
  if (!user) return Response.json({ error: 'Non autorisé.' }, { status: 401 })

  const { conversation_id, content } = await request.json()
  if (!conversation_id) return Response.json({ error: 'conversation_id requis.' }, { status: 400 })

  const err = validateMessage(content)
  if (err) return Response.json({ error: err }, { status: 400 })

  const supabase = adminClient()

  const { data: conversation } = await supabase
    .from('conversations')
    .select('id, user1_id, user2_id, context_type, last_read_at_user1, last_read_at_user2')
    .eq('id', conversation_id)
    .single()
  if (!conversation) return Response.json({ error: 'Conversation introuvable.' }, { status: 404 })

  if (user.id !== conversation.user1_id && user.id !== conversation.user2_id) {
    return Response.json({ error: 'Accès refusé.' }, { status: 403 })
  }

  const { data: message, error } = await supabase
    .from('messages')
    .insert({ conversation_id, sender_id: user.id, content: content.trim() })
    .select()
    .single()

  if (error) {
    Sentry.captureException(error, { extra: { route: 'POST /api/messages', action: 'insert', userId: user.id, conversationId: conversation_id } })
    return Response.json({ error: "Erreur lors de l'envoi du message." }, { status: 500 })
  }

  // Remonte la conversation et annule la suppression douce des deux côtés :
  // une conversation masquée réapparaît dès qu'un nouveau message arrive.
  await supabase
    .from('conversations')
    .update({
      last_message_at: new Date().toISOString(),
      deleted_by_user1: false,
      deleted_by_user2: false,
    })
    .eq('id', conversation_id)

  // La notification part APRÈS la réponse (`after` garde la fonction en vie sur
  // Vercel) : l'envoi du message ne doit jamais attendre Resend, ni échouer
  // avec lui. Tant que la réponse attendait le courriel, elle arrivait après
  // l'événement Realtime et le client affichait le message en double.
  const recipientId = conversation.user1_id === user.id ? conversation.user2_id : conversation.user1_id
  after(async () => {
    try {
      await notifyRecipient(supabase, { conversation, senderId: user.id, recipientId, content: content.trim() })
    } catch (notifyErr) {
      Sentry.captureException(notifyErr, { extra: { route: 'POST /api/messages', action: 'notify', conversationId: conversation_id, recipientId } })
    }
  })

  return Response.json({ message })
}
