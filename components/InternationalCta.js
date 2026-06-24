'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'

export default function InternationalCta() {
  const [user, setUser] = useState(null)
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data?.user ?? null))
  }, [])

  const goToDiagnostic = () => {
    if (user) router.push('/international/diagnostic')
    else router.push('/login?redirect=/international/diagnostic')
  }

  return (
    <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
      <button
        onClick={goToDiagnostic}
        style={{ background: '#00c9a7', color: '#073e35', border: 'none', padding: '13px 26px', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}
      >
        Commencer mon diagnostic
      </button>
      <a
        href="#services"
        style={{ background: 'transparent', color: 'white', border: '1px solid rgba(255,255,255,0.4)', padding: '13px 26px', borderRadius: 10, fontSize: 15, fontWeight: 700, textDecoration: 'none', display: 'inline-block' }}
      >
        Découvrir les services
      </a>
    </div>
  )
}
