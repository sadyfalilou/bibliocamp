import { createClient } from '@supabase/supabase-js'
import * as Sentry from '@sentry/nextjs'

export async function DELETE(request) {
  // 1. Authentifier l'utilisateur
  const auth = request.headers.get('authorization')
  if (!auth?.startsWith('Bearer ')) {
    return Response.json({ error: 'Non authentifié.' }, { status: 401 })
  }
  const token = auth.replace('Bearer ', '')

  const anonClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
  const { data: { user }, error: userErr } = await anonClient.auth.getUser(token)
  if (userErr || !user) {
    return Response.json({ error: 'Session invalide.' }, { status: 401 })
  }

  // 2. Vérifier que l'email fourni correspond bien à l'utilisateur
  const { email_confirm } = await request.json()
  if (!email_confirm || email_confirm.toLowerCase().trim() !== user.email.toLowerCase().trim()) {
    return Response.json({ error: "L'adresse courriel ne correspond pas." }, { status: 400 })
  }

  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  try {
    // 3. Supprimer les données de l'utilisateur
    await adminClient.from('messages').delete().eq('sender_id', user.id)
    await adminClient.from('listings').delete().eq('user_id', user.id)
    await adminClient.from('conversations').delete().or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
    await adminClient.from('profiles').delete().eq('id', user.id)

    // 4. Supprimer le compte auth (irréversible)
    const { error: deleteErr } = await adminClient.auth.admin.deleteUser(user.id)
    if (deleteErr) {
      Sentry.captureException(deleteErr, { extra: { route: 'DELETE /api/delete-account', userId: user.id } })
      return Response.json({ error: 'Erreur lors de la suppression du compte.' }, { status: 500 })
    }

    return Response.json({ ok: true })
  } catch (err) {
    Sentry.captureException(err, { extra: { route: 'DELETE /api/delete-account', userId: user.id } })
    return Response.json({ error: 'Erreur inattendue.' }, { status: 500 })
  }
}
