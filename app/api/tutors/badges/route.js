import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { computeTutorBadges } from '../../../../lib/tutorBadge'

// GET ?ids=uuid1,uuid2,... — retourne { badges: { uuid1: 'tres_reactif'|'nouveau'|null, ... } }
export async function GET(request) {
  const idsParam = new URL(request.url).searchParams.get('ids')
  if (!idsParam) return NextResponse.json({ badges: {} })

  const ids = idsParam.split(',').filter(Boolean)
  if (ids.length === 0) return NextResponse.json({ badges: {} })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const badges = await computeTutorBadges(supabase, ids)
  return NextResponse.json({ badges })
}
