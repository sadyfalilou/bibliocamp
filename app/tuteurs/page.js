import TuteursPageClient from '../../components/TuteursPageClient'

const BASE_URL = 'https://www.bibliocamp.ca'

export const metadata = {
  title: 'Tuteurs étudiants au Québec — cours particuliers | BiblioCamp',
  description: "Trouve un tuteur étudiant pour des cours particuliers au Québec : sciences, santé, droit, génie, commerce et plus. Sur campus, en ligne ou en ville, à petit prix.",
  alternates: { canonical: `${BASE_URL}/tuteurs` },
  openGraph: {
    type: 'website',
    title: 'Tuteurs étudiants au Québec — cours particuliers | BiblioCamp',
    description: "Trouve un tuteur étudiant pour des cours particuliers au Québec, sur campus, en ligne ou en ville.",
    url: `${BASE_URL}/tuteurs`,
  },
}

export default function TuteursPage() {
  return <TuteursPageClient />
}
