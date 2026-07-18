import { FAQ_TUTEURS, faqJsonLd } from '../../../lib/faqData'

const BASE_URL = 'https://www.bibliocamp.ca'

export const metadata = {
  title: 'FAQ Tuteurs — cours particuliers entre étudiants | BiblioCamp',
  description: "Trouver ou devenir tuteur au Québec : comment contacter un tuteur, fixer son tarif, le système d'avis, le paiement et les règles de sécurité pour les sessions.",
  alternates: { canonical: `${BASE_URL}/tuteurs/faq` },
  openGraph: {
    type: 'website',
    title: 'FAQ Tuteurs — cours particuliers entre étudiants | BiblioCamp',
    description: "Trouver ou devenir tuteur étudiant au Québec : contact, tarifs, avis et sécurité.",
    url: `${BASE_URL}/tuteurs/faq`,
  },
}

export default function TuteursFaqLayout({ children }) {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(FAQ_TUTEURS)) }} />
      {children}
    </>
  )
}
