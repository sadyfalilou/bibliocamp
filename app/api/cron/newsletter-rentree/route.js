import { createClient } from '@supabase/supabase-js'
import * as Sentry from '@sentry/nextjs'
import { sendBatchEmails } from '../../../../lib/sendEmail'

const BASE_URL = 'https://www.bibliocamp.ca'

const CAMPAIGNS = {
  'rentree-automne': {
    subject: "📚 C'est la rentrée — vends tes manuels de la session passée !",
    intro: 'La session d\'automne commence — c\'est le meilleur moment pour vendre les manuels que tu n\'utilises plus et pour trouver ceux dont tu as besoin.',
  },
  'rentree-hiver': {
    subject: "📚 C'est la rentrée d'hiver — vends tes manuels de la session passée !",
    intro: 'La session d\'hiver commence — c\'est le meilleur moment pour vendre les manuels que tu n\'utilises plus et pour trouver ceux dont tu as besoin.',
  },
}

function getCampaignKey(now) {
  const month = now.getMonth() + 1
  const day = now.getDate()
  if (month === 8 && day === 25) return 'rentree-automne'
  if (month === 1 && day === 5) return 'rentree-hiver'
  return null
}

function emailHtml(intro, unsubToken) {
  const unsubUrl = `${BASE_URL}/api/newsletter/unsubscribe?token=${unsubToken}`
  return `
    <p>Salut !</p>
    <p>${intro}</p>
    <p style="margin: 24px 0;">
      <a href="${BASE_URL}/login?redirect=/app&view=vendre" style="background:#00c9a7;color:white;padding:12px 24px;border-radius:8px;font-weight:700;text-decoration:none;">Vendre mes manuels →</a>
    </p>
    <p>Tu peux aussi trouver un tuteur ou un coloc pour la session sur BiblioCamp.</p>
    <p style="color:#888;font-size:12px;margin-top:32px;">
      BiblioCamp — Québec, Canada · <a href="${unsubUrl}" style="color:#888;">Se désabonner de l'infolettre</a>
    </p>
  `
}

async function getAllEmails(supabase) {
  const emailById = {}
  let page = 1
  for (;;) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 })
    if (error) throw error
    for (const u of data.users) emailById[u.id] = u.email
    if (data.users.length < 1000) break
    page++
  }
  return emailById
}

function chunk(arr, size) {
  const out = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

export async function GET(request) {
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const now = new Date()
  const campaignKey = getCampaignKey(now)
  if (!campaignKey) return Response.json({ skipped: true, reason: 'pas une date de campagne' })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const startOfDay = new Date(now); startOfDay.setHours(0, 0, 0, 0)
  const { data: already } = await supabase
    .from('newsletter_campaigns_log')
    .select('id')
    .eq('campaign_key', campaignKey)
    .gte('sent_at', startOfDay.toISOString())
    .maybeSingle()
  if (already) return Response.json({ skipped: true, reason: 'déjà envoyée aujourd\'hui' })

  const { data: subscribers, error: subErr } = await supabase
    .from('profiles')
    .select('id, newsletter_unsub_token')
    .eq('newsletter_opt_in', true)
  if (subErr) {
    Sentry.captureException(subErr, { extra: { route: 'GET /api/cron/newsletter-rentree', step: 'fetch-subscribers' } })
    return Response.json({ error: 'Erreur récupération abonnés' }, { status: 500 })
  }
  if (!subscribers || subscribers.length === 0) return Response.json({ ok: true, sent: 0 })

  const emailById = await getAllEmails(supabase)
  const { intro, subject } = CAMPAIGNS[campaignKey]

  const emails = subscribers
    .map(s => emailById[s.id] && ({
      to: emailById[s.id],
      subject,
      html: emailHtml(intro, s.newsletter_unsub_token),
    }))
    .filter(Boolean)

  let sent = 0
  for (const batch of chunk(emails, 100)) {
    try {
      await sendBatchEmails(batch)
      sent += batch.length
    } catch (err) {
      Sentry.captureException(err, { extra: { route: 'GET /api/cron/newsletter-rentree', step: 'send-batch', campaignKey } })
    }
  }

  await supabase.from('newsletter_campaigns_log').insert({ campaign_key: campaignKey, recipients_count: sent })

  return Response.json({ ok: true, sent })
}
