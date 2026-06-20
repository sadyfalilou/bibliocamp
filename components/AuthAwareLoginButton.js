'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '../lib/supabase'

export default function AuthAwareLoginButton() {
  const [user, setUser] = useState(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data?.user ?? null)
      setLoaded(true)
    })
  }, [])

  if (!loaded || user) return null

  return (
    <Link href="/login" style={{ fontSize: 13, fontWeight: 600, color: '#1a2e4a', textDecoration: 'none', border: '1px solid #d1d5db', borderRadius: 6, padding: '6px 14px' }}>
      Se connecter
    </Link>
  )
}
