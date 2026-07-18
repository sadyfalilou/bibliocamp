import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

const PUBLIC_ROUTES = ['/', '/login', '/reset-password', '/confidentialite', '/cgu', '/faq', '/manuels/faq', '/a-propos', '/international', '/international/mon-histoire', '/tuteurs', '/robots.txt', '/sitemap.xml']
// Note : '/tuteurs/' couvre aussi /tuteurs/modifier et /tuteurs/devenir-tuteur,
// mais ces pages d'edition se protegent elles-memes (redirection vers /login
// si pas de session).
const PUBLIC_PREFIXES = ['/book/', '/invite/', '/seller/', '/tuteurs/']

export async function proxy(req) {
  let supabaseResponse = NextResponse.next({ request: req })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            req.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request: req })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Rafraîchit le token de session si expiré (requis pour PKCE OAuth)
  const { data: { user } } = await supabase.auth.getUser()

  const path = req.nextUrl.pathname
  const isPublic = PUBLIC_ROUTES.includes(path) || PUBLIC_PREFIXES.some(p => path.startsWith(p))

  if (!user && !isPublic) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next|favicon.ico|api|auth).*)'],
}
