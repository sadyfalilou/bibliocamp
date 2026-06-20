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

// GET /api/admin/reports — liste des signalements avec les annonces concernées
export async function GET(request) {
  const admin = await getAdminUser(request)
  if (!admin) return Response.json({ error: 'Accès refusé.' }, { status: 403 })

  const supabase = adminClient()

  const { data: reports, error } = await supabase
    .from('reports')
    .select('id, listing_id, reporter_id, reason, created_at')
    .order('created_at', { ascending: false })

  if (error) return Response.json({ error: 'Erreur lors de la récupération des signalements.' }, { status: 500 })
  if (!reports || reports.length === 0) return Response.json({ reports: [] })

  const listingIds = [...new Set(reports.map(r => r.listing_id))]
  const { data: listings } = await supabase
    .from('listings')
    .select('id, title, image_url, user_id, price')
    .in('id', listingIds)

  const listingsById = Object.fromEntries((listings || []).map(l => [l.id, l]))

  const enriched = reports.map(r => ({
    ...r,
    listing: listingsById[r.listing_id] || null
  }))

  return Response.json({ reports: enriched })
}

// DELETE /api/admin/reports?id=xxx&action=dismiss|remove-listing
export async function DELETE(request) {
  const admin = await getAdminUser(request)
  if (!admin) return Response.json({ error: 'Accès refusé.' }, { status: 403 })

  const url = new URL(request.url)
  const reportId = url.searchParams.get('id')
  const action = url.searchParams.get('action') || 'dismiss'
  if (!reportId) return Response.json({ error: 'ID du signalement manquant.' }, { status: 400 })

  const supabase = adminClient()

  const { data: report, error: fetchErr } = await supabase
    .from('reports')
    .select('id, listing_id, reason')
    .eq('id', reportId)
    .single()

  if (fetchErr || !report) return Response.json({ error: 'Signalement introuvable.' }, { status: 404 })

  if (action === 'remove-listing' && report.listing_id) {
    const { data: listing } = await supabase
      .from('listings')
      .select('id, image_url, title, user_id')
      .eq('id', report.listing_id)
      .single()

    if (listing?.image_url) {
      const fileName = listing.image_url.split('/').pop()
      if (fileName) await supabase.storage.from('images').remove([fileName])
    }

    if (listing?.user_id) {
      await supabase.from('removed_listings_notices').insert({
        user_id: listing.user_id,
        listing_title: listing.title || 'Annonce',
        reason: report.reason,
      })
    }

    await supabase.from('listings').delete().eq('id', report.listing_id)
  }

  // Dans tous les cas, on retire le signalement traité
  const { error: deleteErr } = await supabase.from('reports').delete().eq('id', reportId)
  if (deleteErr) return Response.json({ error: 'Erreur lors du traitement du signalement.' }, { status: 500 })

  return Response.json({ ok: true })
}
