import { createClient } from '@supabase/supabase-js'
import * as Sentry from '@sentry/nextjs'

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

// POST { conversation_id } — marque comme lus les messages reçus dans la
// conversation et horodate la lecture. L'horodatage sert à la notification
// courriel : on n'écrit pas à quelqu'un qui a la conversation ouverte.
export async function POST(request) {
  const user = await getUser(request)
  if (!user) return Response.json({ error: 'Non autorisé.' }, { status: 401 })

  const { conversation_id } = await request.json()
  if (!conversation_id) return Response.json({ error: 'conversation_id requis.' }, { status: 400 })

  const supabase = adminClient()

  const { data: conversation } = await supabase
    .from('conversations')
    .select('id, user1_id, user2_id')
    .eq('id', conversation_id)
    .single()
  if (!conversation) return Response.json({ error: 'Conversation introuvable.' }, { status: 404 })

  if (user.id !== conversation.user1_id && user.id !== conversation.user2_id) {
    return Response.json({ error: 'Accès refusé.' }, { status: 403 })
  }

  const { error } = await supabase
    .from('messages')
    .update({ read: true })
    .eq('conversation_id', conversation_id)
    .neq('sender_id', user.id)

  if (error) {
    Sentry.captureException(error, { extra: { route: 'POST /api/messages/read', action: 'mark-read', userId: user.id, conversationId: conversation_id } })
    return Response.json({ error: 'Erreur lors du marquage.' }, { status: 500 })
  }

  const field = conversation.user1_id === user.id ? 'last_read_at_user1' : 'last_read_at_user2'
  await supabase
    .from('conversations')
    .update({ [field]: new Date().toISOString() })
    .eq('id', conversation_id)

  return Response.json({ ok: true })
}
