import Link from 'next/link'
import Footer from '../../../components/Footer'
import Logo from '../../../components/Logo'
import AuthAwareLoginButton from '../../../components/AuthAwareLoginButton'

export const metadata = {
  title: "Pourquoi j'ai créé BiblioCamp — étudiants internationaux",
  description: "Le récit personnel derrière le module BiblioCamp International : logement, compte bancaire, crédit, intégration — les difficultés vécues à l'arrivée au Québec et pourquoi elles ont mené à la création de BiblioCamp.",
}

export default function MonHistoirePage() {
  return (
    <div style={{ fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif", background: '#fff', color: '#222' }}>

      <header style={{ borderBottom: '1px solid #e5e7eb', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <Logo variant="dark" size="md" />
        </Link>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <Link href="/international" style={{ fontSize: 13, color: '#6b7280', textDecoration: 'none' }}>International</Link>
          <AuthAwareLoginButton />
        </div>
      </header>

      <main style={{ maxWidth: 680, margin: '0 auto', padding: '48px 24px 96px' }}>

        <p style={{ fontSize: 13, color: '#9ca3af', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 700 }}>
          Mon histoire
        </p>
        <h1 style={{ fontSize: 'clamp(26px, 5vw, 36px)', fontWeight: 800, margin: '0 0 28px', color: '#111', lineHeight: 1.25 }}>
          Pourquoi j'ai créé BiblioCamp
        </h1>

        <div style={{ fontSize: 15, lineHeight: 1.85, color: '#374151' }}>
          <p style={{ margin: '0 0 20px', textAlign: 'justify' }}>Je me souviens encore de mon arrivée au Québec.</p>

          <p style={{ margin: '0 0 20px', textAlign: 'justify' }}>
            Comme des milliers d'étudiants internationaux, j'étais rempli d'espoir, d'ambition et de rêves. J'avais été accepté dans une université, j'avais préparé mes valises, et je croyais être prêt.
          </p>

          <p style={{ margin: '0 0 20px', textAlign: 'justify' }}>Je ne l'étais pas.</p>

          <p style={{ margin: '0 0 20px', textAlign: 'justify' }}>
            Dès les premiers jours, j'ai découvert une réalité dont personne ne parle vraiment.
          </p>

          <p style={{ margin: '0 0 20px', textAlign: 'justify' }}>
            Trouver un logement est devenu mon premier combat. L'appartement que j'avais réservé avant mon arrivée ne correspondait pas du tout à ce qu'on m'avait promis. Je me suis retrouvé dans une ville que je ne connaissais pas, avec mes valises, sans savoir où aller.
          </p>

          <p style={{ margin: '0 0 20px', textAlign: 'justify' }}>
            Puis sont venues les questions auxquelles personne ne m'avait préparé.
          </p>

          <p style={{ margin: '0 0 20px', textAlign: 'justify' }}>
            Comment ouvrir un compte bancaire ? Comment obtenir une carte de crédit ? Comment bâtir un historique de crédit quand on vient juste d'arriver ? Comment trouver un colocataire fiable ? Comment comprendre les assurances, les forfaits cellulaires, les transports, les impôts, les bourses, ou simplement les habitudes de vie d'ici ?
          </p>

          <p style={{ margin: '0 0 20px', textAlign: 'justify' }}>Chaque jour apportait son lot de défis.</p>

          <p style={{ margin: '0 0 20px', textAlign: 'justify' }}>
            Ce n'était pas une seule grande difficulté. C'était des dizaines de petites difficultés qui, mises ensemble, rendaient chaque étape plus compliquée qu'elle ne devrait l'être. Pendant que les autres semblaient déjà connaître les règles du jeu, moi, je devais les découvrir une par une.
          </p>

          <p style={{ margin: '0 0 20px', textAlign: 'justify' }}>
            J'ai commis des erreurs. J'ai perdu du temps. J'ai dépensé de l'argent inutilement.
          </p>

          <p style={{ margin: '0 0 20px', textAlign: 'justify' }}>
            Et surtout, j'aurais aimé avoir quelqu'un pour me dire :
          </p>

          <p style={{ margin: '0 0 28px', textAlign: 'center', fontWeight: 700, color: '#1a2e4a', fontSize: 17, fontStyle: 'italic' }}>
            « Voici ce qui t'attend. Voici les pièges à éviter. Voici comment réussir ton arrivée. »
          </p>

          <p style={{ margin: '0 0 20px', textAlign: 'justify' }}>
            Avec le temps, j'ai appris. J'ai compris le système. J'ai bâti mon réseau. J'ai trouvé mes repères.
          </p>

          <p style={{ margin: '0 0 20px', textAlign: 'justify' }}>
            Aujourd'hui, le Québec est devenu chez moi. Mais je n'ai jamais oublié à quel point les premiers mois ont été difficiles.
          </p>

          <p style={{ margin: '0 0 20px', textAlign: 'justify' }}>
            C'est pour cette raison que j'ai créé <strong>BiblioCamp</strong>.
          </p>

          <p style={{ margin: '0 0 20px', textAlign: 'justify' }}>
            Au départ, l'idée était simple : permettre aux étudiants d'acheter et de vendre leurs manuels scolaires facilement. Mais la vision est devenue beaucoup plus grande.
          </p>

          <p style={{ margin: '0 0 20px', textAlign: 'justify' }}>
            Je veux que BiblioCamp devienne la plateforme de référence pour les étudiants internationaux et les nouveaux arrivants — un endroit où trouver un logement, un colocataire, un tuteur, des conseils, des ressources, et surtout une communauté qui comprend réellement ce que vous vivez.
          </p>

          <p style={{ margin: '0 0 20px', textAlign: 'justify' }}>
            Parce qu'arriver dans un nouveau pays est déjà un défi immense. Vous ne devriez pas avoir à le relever seul.
          </p>

          <p style={{ margin: 0, textAlign: 'justify' }}>
            BiblioCamp, c'est l'aide que j'aurais aimé avoir à mon arrivée. Et maintenant, c'est celle que je veux offrir aux autres.
          </p>
        </div>

        <div style={{ marginTop: 48, textAlign: 'center' }}>
          <Link href="/international" style={{ display: 'inline-block', background: '#00c9a7', color: '#073e35', padding: '13px 26px', borderRadius: 10, fontSize: 15, fontWeight: 700, textDecoration: 'none' }}>
            Découvrir le programme international →
          </Link>
        </div>

      </main>

      <Footer />
    </div>
  )
}
