import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// GET /api/sellers?ids=uuid1,uuid2 — profils publics minimaux (nom, avatar,
// campus) pour un lot de vendeurs, en une seule requete. Evite le N+1 cote
// client. Le nom de famille est reduit a son initiale, comme /api/seller,
// puisqu'il s'agit d'un profil public accessible sans authentification.
export async function GET(request) {
  const idsParam = new URL(request.url).searchParams.get('ids')
  if (!idsParam) return NextResponse.json({ profiles: {} })

  const ids = [...new Set(idsParam.split(',').map(s => s.trim()).filter(Boolean))].slice(0, 50)
  if (ids.length === 0) return NextResponse.json({ profiles: {} })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const { data, error } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, avatar_url, campus, institution')
    .in('id', ids)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const profiles = {}
  for (const p of data || []) {
    profiles[p.id] = { ...p, last_name: p.last_name ? p.last_name[0].toUpperCase() : null }
  }
  return NextResponse.json({ profiles })
}
