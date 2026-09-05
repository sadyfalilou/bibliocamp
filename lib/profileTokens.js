// Jetons de desabonnement, sortis de `profiles` a la suite de l'audit RLS :
// la table `profile_tokens` n'est accessible qu'a la service_role, donc a
// aucun client. Le jeton est cree a la demande — un profil cree a
// l'inscription n'en a pas encore, et le navigateur ne peut pas en creer.

/**
 * Retourne les jetons des utilisateurs demandes, en creant ceux qui manquent.
 * { [userId]: unsub_token }
 */
export async function getUnsubTokens(supabase, userIds) {
  const ids = [...new Set(userIds.filter(Boolean))]
  const tokens = {}
  if (ids.length === 0) return tokens

  const { data } = await supabase
    .from('profile_tokens')
    .select('user_id, unsub_token')
    .in('user_id', ids)
  ;(data ?? []).forEach(r => { tokens[r.user_id] = r.unsub_token })

  const missing = ids.filter(id => !tokens[id])
  if (missing.length === 0) return tokens

  // ignoreDuplicates : deux requetes simultanees peuvent creer le meme jeton,
  // on relit ensuite plutot que d'echouer sur la contrainte d'unicite.
  await supabase
    .from('profile_tokens')
    .upsert(missing.map(user_id => ({ user_id })), { onConflict: 'user_id', ignoreDuplicates: true })

  const { data: created } = await supabase
    .from('profile_tokens')
    .select('user_id, unsub_token')
    .in('user_id', missing)
  ;(created ?? []).forEach(r => { tokens[r.user_id] = r.unsub_token })

  return tokens
}

export async function getUnsubToken(supabase, userId) {
  const tokens = await getUnsubTokens(supabase, [userId])
  return tokens[userId] ?? null
}

/** Retourne l'utilisateur proprietaire d'un jeton, ou null. */
export async function findUserByUnsubToken(supabase, token) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(token || '')) return null
  const { data } = await supabase
    .from('profile_tokens')
    .select('user_id')
    .eq('unsub_token', token)
    .maybeSingle()
  return data?.user_id ?? null
}
