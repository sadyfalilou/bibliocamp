import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { computeTutorBadges } from '../../../../lib/tutorBadge'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// GET ?ids=uuid1,uuid2,... — retourne { badges: { uuid1: 'tres_reactif'|'nouveau'|null, ... } }
export async function GET(request) {
  const idsParam = new URL(request.url).searchParams.get('ids')
  if (!idsParam) return NextResponse.json({ badges: {} })

  // On ne garde que des UUID valides : ces ids sont interpoles dans un filtre
  // PostgREST .or() (voir computeTutorBadges), donc on refuse tout le reste.
  const ids = [...new Set(idsParam.split(',').map(s => s.trim()).filter(id => UUID_RE.test(id)))]
  if (ids.length === 0) return NextResponse.json({ badges: {} })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const badges = await computeTutorBadges(supabase, ids)
  return NextResponse.json({ badges })
}
