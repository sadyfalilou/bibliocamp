'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'

function useDiagnosticNav() {
  const [user, setUser] = useState(null)
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data?.user ?? null))
  }, [])

  return () => {
    if (user) router.push('/international/diagnostic')
    else router.push('/login?redirect=/international/diagnostic')
  }
}

export default function InternationalCta({ align = 'center' }) {
  const goToDiagnostic = useDiagnosticNav()

  return (
    <div style={{ display: 'flex', gap: 12, justifyContent: align === 'left' ? 'flex-start' : 'center', flexWrap: 'wrap' }}>
      <button
        onClick={goToDiagnostic}
        style={{ background: '#00c9a7', color: '#073e35', border: 'none', padding: '13px 26px', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}
      >
        Faire mon diagnostic gratuit
      </button>
      <a
        href="#forfaits"
        style={{ background: 'transparent', color: 'white', border: '1px solid rgba(255,255,255,0.4)', padding: '13px 26px', borderRadius: 10, fontSize: 15, fontWeight: 700, textDecoration: 'none', display: 'inline-block' }}
      >
        Voir les forfaits
      </a>
    </div>
  )
}

export function DiagnosticCardLink({ children, style }) {
  const goToDiagnostic = useDiagnosticNav()
  return (
    <div onClick={goToDiagnostic} style={{ cursor: 'pointer', ...style }}>
      {children}
    </div>
  )
}

export function DiagnosticButton({ label = 'Commencer mon diagnostic gratuit', style }) {
  const goToDiagnostic = useDiagnosticNav()
  return (
    <button onClick={goToDiagnostic} style={{ background: '#00c9a7', color: '#073e35', border: 'none', padding: '14px 28px', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer', ...style }}>
      {label}
    </button>
  )
}
