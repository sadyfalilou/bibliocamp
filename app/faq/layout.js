import { FAQ_GENERAL, faqJsonLd } from '../../lib/faqData'

const BASE_URL = 'https://www.bibliocamp.ca'

export const metadata = {
  title: 'FAQ — questions fréquentes | BiblioCamp',
  description: "Toutes les réponses sur BiblioCamp : compte et sécurité, colocations, avis sur les vendeurs. La marketplace étudiante québécoise (manuels, tuteurs, colocs).",
  alternates: { canonical: `${BASE_URL}/faq` },
  openGraph: {
    type: 'website',
    title: 'FAQ — questions fréquentes | BiblioCamp',
    description: "Toutes les réponses à tes questions sur BiblioCamp.",
    url: `${BASE_URL}/faq`,
  },
}

export default function FaqLayout({ children }) {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(FAQ_GENERAL)) }} />
      {children}
    </>
  )
}
