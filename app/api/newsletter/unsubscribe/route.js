import { createClient } from '@supabase/supabase-js'
import * as Sentry from '@sentry/nextjs'

function htmlPage(message) {
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"/><title>BiblioCamp</title>
<style>body{font-family:'Segoe UI',sans-serif;background:#f8fafc;color:#1a2e4a;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;text-align:center;padding:24px}
.card{background:white;border-radius:16px;padding:40px 32px;border:1px solid #e2e8f0;max-width:420px}
a{color:#00c9a7;font-weight:700;text-decoration:none}</style></head>
<body><div class="card"><div style="font-size:40px;margin-bottom:12px">📚</div><p style="font-size:16px;font-weight:600">${message}</p><a href="https://www.bibliocamp.ca">Retour à BiblioCamp →</a></div></body></html>`
}

export async function GET(request) {
  const token = new URL(request.url).searchParams.get('token')
  if (!token) return new Response(htmlPage('Lien de désabonnement invalide.'), { status: 400, headers: { 'Content-Type': 'text/html; charset=utf-8' } })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const { data, error } = await supabase
    .from('profiles')
    .update({ newsletter_opt_in: false })
    .eq('newsletter_unsub_token', token)
    .select('id')
    .maybeSingle()

  if (error) {
    Sentry.captureException(error, { extra: { route: 'GET /api/newsletter/unsubscribe' } })
    return new Response(htmlPage('Erreur lors du désabonnement. Réessaie plus tard.'), { status: 500, headers: { 'Content-Type': 'text/html; charset=utf-8' } })
  }

  if (!data) return new Response(htmlPage('Lien de désabonnement invalide ou déjà utilisé.'), { status: 404, headers: { 'Content-Type': 'text/html; charset=utf-8' } })

  return new Response(htmlPage("Tu as été désabonné de l'infolettre BiblioCamp."), { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
}
