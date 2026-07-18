const { withSentryConfig } = require('@sentry/nextjs')

// 'unsafe-eval' n'est requis que par le HMR de Next.js en dev ; on le retire en
// production. 'unsafe-inline' reste nécessaire (scripts inline des pages
// statiquement pré-rendues + app stylée 100% en inline) : une CSP à nonce est
// incompatible avec le rendu statique, qui domine ici.
const scriptSrc = process.env.NODE_ENV === 'production'
  ? "script-src 'self' 'unsafe-inline'"
  : "script-src 'self' 'unsafe-eval' 'unsafe-inline'"

const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      scriptSrc,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' blob: data: https://*.supabase.co https://books.google.com https://*.google.com https://*.gstatic.com https://*.googleusercontent.com https://covers.openlibrary.org",
      "media-src 'self' https://*.supabase.co",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.sentry.io",
      "font-src 'self'",
      "frame-ancestors 'none'",
    ].join('; '),
  },
]

/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }]
  },
}

module.exports = withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: true,
  widenClientFileUpload: true,
  hideSourceMaps: true,
  webpack: {
    treeshake: { removeDebugLogging: true },
  },
})
