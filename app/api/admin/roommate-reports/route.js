import { createClient } from '@supabase/supabase-js'

async function getAdminUser(request) {
  const auth = request.headers.get('authorization')
  if (!auth?.startsWith('Bearer ')) return null

  const anon = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
  const token = auth.replace('Bearer ', '')
  const { data: { user } } = await anon.auth.getUser(token)
  if (!user) return null

  // Source de vérité unique des droits admin : la colonne profiles.is_admin
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
  const { data: profile } = await admin.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) return null

  return user
}

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
}

// GET /api/admin/roommate-reports — signalements groupés par annonce, du plus signalé au moins signalé
export async function GET(request) {
  const admin = await getAdminUser(request)
  if (!admin) return Response.json({ error: 'Accès refusé.' }, { status: 403 })

  const supabase = adminClient()

  const { data: reports, error } = await supabase
    .from('roommate_reports')
    .select('id, roommate_listing_id, reporter_id, reason, created_at')
    .order('created_at', { ascending: false })

  if (error) return Response.json({ error: 'Erreur lors de la récupération des signalements.' }, { status: 500 })
  if (!reports || reports.length === 0) return Response.json({ listings: [] })

  const listingIds = [...new Set(reports.map(r => r.roommate_listing_id))]
  const { data: listings } = await supabase
    .from('roommate_listings')
    .select('id, title, image_url, user_id, rent_price')
    .in('id', listingIds)

  const listingsById = Object.fromEntries((listings || []).map(l => [l.id, l]))

  const grouped = new Map()
  for (const r of reports) {
    if (!grouped.has(r.roommate_listing_id)) {
      grouped.set(r.roommate_listing_id, {
        listing_id: r.roommate_listing_id,
        listing: listingsById[r.roommate_listing_id] || null,
        reports: [],
      })
    }
    grouped.get(r.roommate_listing_id).reports.push(r)
  }

  const result = [...grouped.values()]
    .map(g => ({ ...g, reportCount: g.reports.length }))
    .sort((a, b) => b.reportCount - a.reportCount || new Date(b.reports[0].created_at) - new Date(a.reports[0].created_at))

  return Response.json({ listings: result })
}

// DELETE /api/admin/roommate-reports?listingId=xxx&action=dismiss|remove-listing
// Agit sur TOUS les signalements de cette annonce d'un coup.
export async function DELETE(request) {
  const admin = await getAdminUser(request)
  if (!admin) return Response.json({ error: 'Accès refusé.' }, { status: 403 })

  const url = new URL(request.url)
  const listingId = url.searchParams.get('listingId')
  const action = url.searchParams.get('action') || 'dismiss'
  if (!listingId) return Response.json({ error: "ID de l'annonce manquant." }, { status: 400 })

  const supabase = adminClient()

  const { data: pendingReports } = await supabase
    .from('roommate_reports')
    .select('id')
    .eq('roommate_listing_id', listingId)

  if (!pendingReports || pendingReports.length === 0) {
    return Response.json({ error: 'Aucun signalement pour cette annonce.' }, { status: 404 })
  }

  if (action === 'remove-listing') {
    const { data: listing } = await supabase
      .from('roommate_listings')
      .select('id, image_url, image_urls')
      .eq('id', listingId)
      .single()

    if (listing) {
      const urls = listing.image_urls?.length ? listing.image_urls : (listing.image_url ? [listing.image_url] : [])
      const fileNames = urls.map(u => u.split('/').pop()).filter(Boolean)
      if (fileNames.length) await supabase.storage.from('images').remove(fileNames)
      await supabase.from('roommate_listings').delete().eq('id', listingId)
    }
  }

  // Dans tous les cas, on retire les signalements traités pour cette annonce
  const { error: deleteErr } = await supabase.from('roommate_reports').delete().eq('roommate_listing_id', listingId)
  if (deleteErr) return Response.json({ error: 'Erreur lors du traitement des signalements.' }, { status: 500 })

  return Response.json({ ok: true })
}
