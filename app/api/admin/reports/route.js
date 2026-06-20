import { createClient } from '@supabase/supabase-js'

// Liste des courriels administrateurs, séparés par des virgules dans .env.local
// ex: ADMIN_EMAILS=toi@example.com,associe@example.com
function getAdminEmails() {
  return (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean)
}

async function getAdminUser(request) {
  const auth = request.headers.get('authorization')
  if (!auth?.startsWith('Bearer ')) return null

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
  const token = auth.replace('Bearer ', '')
  const { data: { user } } = await supabase.auth.getUser(token)
  if (!user?.email) return null

  const adminEmails = getAdminEmails()
  if (!adminEmails.includes(user.email.toLowerCase())) return null

  return user
}

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
}

// GET /api/admin/reports — signalements groupés par annonce, du plus signalé au moins signalé
export async function GET(request) {
  const admin = await getAdminUser(request)
  if (!admin) return Response.json({ error: 'Accès refusé.' }, { status: 403 })

  const supabase = adminClient()

  const { data: reports, error } = await supabase
    .from('reports')
    .select('id, listing_id, reporter_id, reason, created_at')
    .order('created_at', { ascending: false })

  if (error) return Response.json({ error: 'Erreur lors de la récupération des signalements.' }, { status: 500 })
  if (!reports || reports.length === 0) return Response.json({ listings: [] })

  const listingIds = [...new Set(reports.map(r => r.listing_id))]
  const { data: listings } = await supabase
    .from('listings')
    .select('id, title, image_url, user_id, price')
    .in('id', listingIds)

  const listingsById = Object.fromEntries((listings || []).map(l => [l.id, l]))

  // Historique : combien de fois chaque vendeur concerné a déjà été averti
  const sellerIds = [...new Set((listings || []).map(l => l.user_id).filter(Boolean))]
  const warningsBySeller = {}
  if (sellerIds.length > 0) {
    const { data: pastWarnings } = await supabase
      .from('removed_listings_notices')
      .select('user_id')
      .eq('type', 'warning')
      .in('user_id', sellerIds)
    for (const w of pastWarnings || []) {
      warningsBySeller[w.user_id] = (warningsBySeller[w.user_id] || 0) + 1
    }
  }

  const grouped = new Map()
  for (const r of reports) {
    if (!grouped.has(r.listing_id)) {
      const listing = listingsById[r.listing_id] || null
      grouped.set(r.listing_id, {
        listing_id: r.listing_id,
        listing,
        priorWarnings: listing?.user_id ? (warningsBySeller[listing.user_id] || 0) : 0,
        reports: [],
      })
    }
    grouped.get(r.listing_id).reports.push(r)
  }

  const result = [...grouped.values()]
    .map(g => ({ ...g, reportCount: g.reports.length }))
    .sort((a, b) => b.reportCount - a.reportCount || new Date(b.reports[0].created_at) - new Date(a.reports[0].created_at))

  return Response.json({ listings: result })
}

// DELETE /api/admin/reports?listingId=xxx&action=dismiss|warn|remove-listing
// Agit sur TOUS les signalements de cette annonce d'un coup.
export async function DELETE(request) {
  const admin = await getAdminUser(request)
  if (!admin) return Response.json({ error: 'Accès refusé.' }, { status: 403 })

  const url = new URL(request.url)
  const listingId = url.searchParams.get('listingId')
  const action = url.searchParams.get('action') || 'dismiss'
  if (!listingId) return Response.json({ error: 'ID de l\'annonce manquant.' }, { status: 400 })

  const supabase = adminClient()

  const { data: pendingReports } = await supabase
    .from('reports')
    .select('id, reason')
    .eq('listing_id', listingId)

  if (!pendingReports || pendingReports.length === 0) {
    return Response.json({ error: 'Aucun signalement pour cette annonce.' }, { status: 404 })
  }

  if (action === 'warn' || action === 'remove-listing') {
    const { data: listing } = await supabase
      .from('listings')
      .select('id, image_url, title, user_id')
      .eq('id', listingId)
      .single()

    if (listing?.user_id) {
      const reasons = [...new Set(pendingReports.map(r => r.reason))].join(' · ')
      await supabase.from('removed_listings_notices').insert({
        user_id: listing.user_id,
        listing_title: listing.title || 'Annonce',
        reason: reasons,
        type: action === 'remove-listing' ? 'removed' : 'warning',
        // Pour 'remove-listing', l'annonce sera supprimée juste après —
        // la colonne repassera à NULL automatiquement (ON DELETE SET NULL),
        // ce qui est correct puisqu'il n'y a plus de carte à laquelle l'attacher.
        listing_id: listingId,
      })
    }

    if (action === 'remove-listing') {
      if (listing?.image_url) {
        const fileName = listing.image_url.split('/').pop()
        if (fileName) await supabase.storage.from('images').remove([fileName])
      }
      await supabase.from('listings').delete().eq('id', listingId)
    }
  }

  // Dans tous les cas, on retire les signalements traités pour cette annonce
  const { error: deleteErr } = await supabase.from('reports').delete().eq('listing_id', listingId)
  if (deleteErr) return Response.json({ error: 'Erreur lors du traitement des signalements.' }, { status: 500 })

  return Response.json({ ok: true })
}
