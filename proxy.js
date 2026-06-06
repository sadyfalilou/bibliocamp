import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function proxy(req) {
  const res = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get: (name) => req.cookies.get(name)?.value,
        set: (name, value, options) => {
          res.cookies.set({ name, value, ...options })
        },
        remove: (name, options) => {
          res.cookies.set({ name, value: '', ...options })
        }
      }
    }
  )

  const {
    data: { user }
  } = await supabase.auth.getUser()

  // 🔥 routes publiques
  const publicRoutes = ['/login', '/reset-password']

  if (!user && !publicRoutes.includes(req.nextUrl.pathname)) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  return res
}

// 🔥 appliquer partout sauf assets
export const config = {
  matcher: ['/((?!_next|favicon.ico|api).*)']
}