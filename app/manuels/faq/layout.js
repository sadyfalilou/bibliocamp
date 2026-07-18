import { FAQ_MANUELS, faqJsonLd } from '../../../lib/faqData'

const BASE_URL = 'https://www.bibliocamp.ca'

export const metadata = {
  title: 'FAQ Manuels — acheter et vendre ses livres scolaires | BiblioCamp',
  description: "Comment acheter, vendre et échanger des manuels scolaires d'occasion entre étudiants : contacter un vendeur, publier une annonce avec l'ISBN, prix, paiement et sécurité.",
  alternates: { canonical: `${BASE_URL}/manuels/faq` },
  openGraph: {
    type: 'website',
    title: 'FAQ Manuels — acheter et vendre ses livres scolaires | BiblioCamp',
    description: "Acheter, vendre et échanger des manuels scolaires d'occasion entre étudiants.",
    url: `${BASE_URL}/manuels/faq`,
  },
}

export default function ManuelsFaqLayout({ children }) {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(FAQ_MANUELS)) }} />
      {children}
    </>
  )
}
