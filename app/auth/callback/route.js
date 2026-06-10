import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    // Créer la réponse de redirection d'abord
    const response = NextResponse.redirect(`${origin}${next}`)

    // Créer le client Supabase en lisant les cookies de la requête
    // et en écrivant les cookies sur la réponse
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return response // Les cookies de session sont dans la réponse
    }
  }

  // En cas d'erreur, rediriger vers login
  return NextResponse.redirect(`${origin}/login?error=oauth`)
}
