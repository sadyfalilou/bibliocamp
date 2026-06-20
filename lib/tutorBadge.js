// Calcule le badge de réactivité d'un tuteur à partir de l'historique de messages.
// "Très réactif" : au moins 5 conversations reçues, taux de réponse >= 80%, délai moyen <= 2h.
// "Nouveau" : moins de 5 conversations reçues (pas assez de données pour juger).

const MIN_CONVERSATIONS = 5
const MIN_RESPONSE_RATE = 0.8
const MAX_AVG_RESPONSE_MINUTES = 120

export async function computeTutorBadges(supabase, tutorUserIds) {
  const ids = [...new Set(tutorUserIds.filter(Boolean))]
  const badges = {}
  if (ids.length === 0) return badges

  const { data: conversations } = await supabase
    .from('conversations')
    .select('id, user1_id, user2_id')
    .or(ids.map(id => `user1_id.eq.${id},user2_id.eq.${id}`).join(','))

  if (!conversations || conversations.length === 0) {
    ids.forEach(id => { badges[id] = 'nouveau' })
    return badges
  }

  const convIds = conversations.map(c => c.id)
  const { data: messages } = await supabase
    .from('messages')
    .select('conversation_id, sender_id, created_at')
    .in('conversation_id', convIds)
    .order('created_at', { ascending: true })

  const messagesByConv = {}
  ;(messages || []).forEach(m => {
    if (!messagesByConv[m.conversation_id]) messagesByConv[m.conversation_id] = []
    messagesByConv[m.conversation_id].push(m)
  })

  // Pour chaque tuteur : conversations où il a été contacté en premier par l'autre partie
  const statsByTutor = {}
  ids.forEach(id => { statsByTutor[id] = { received: 0, replied: 0, totalResponseMinutes: 0 } })

  conversations.forEach(conv => {
    const msgs = messagesByConv[conv.id]
    if (!msgs || msgs.length === 0) return
    const firstMsg = msgs[0]

    for (const tutorId of ids) {
      if (conv.user1_id !== tutorId && conv.user2_id !== tutorId) continue
      if (firstMsg.sender_id === tutorId) continue // le tuteur a initié, ne compte pas

      statsByTutor[tutorId].received++
      const reply = msgs.find(m => m.sender_id === tutorId && new Date(m.created_at) > new Date(firstMsg.created_at))
      if (reply) {
        statsByTutor[tutorId].replied++
        const minutes = (new Date(reply.created_at) - new Date(firstMsg.created_at)) / 60000
        statsByTutor[tutorId].totalResponseMinutes += minutes
      }
    }
  })

  ids.forEach(id => {
    const s = statsByTutor[id]
    if (s.received < MIN_CONVERSATIONS) {
      badges[id] = 'nouveau'
      return
    }
    const responseRate = s.replied / s.received
    const avgMinutes = s.replied > 0 ? s.totalResponseMinutes / s.replied : Infinity
    badges[id] = (responseRate >= MIN_RESPONSE_RATE && avgMinutes <= MAX_AVG_RESPONSE_MINUTES)
      ? 'tres_reactif'
      : null
  })

  return badges
}

export const BADGE_LABELS = {
  tres_reactif: { label: 'Très réactif', bg: '#f1f5f9', color: '#475569' },
  nouveau: { label: 'Nouveau', bg: '#e0f2fe', color: '#0369a1' },
}
