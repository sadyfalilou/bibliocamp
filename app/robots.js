export default function robots() {
  const base = 'https://www.bibliocamp.ca'
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/app', '/admin', '/inbox', '/api'],
    },
    sitemap: `${base}/sitemap.xml`,
  }
}
