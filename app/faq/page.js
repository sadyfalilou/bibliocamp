'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Footer from '../../components/Footer'
import { supabase } from '../../lib/supabase'

const FAQ = [
  {
    section: 'Compte et sécurité',
    items: [
      {
        q: 'Pourquoi dois-je vérifier mon numéro de téléphone ?',
        a: 'La vérification par SMS aide à garder une communauté d\'étudiants réels et limite les faux comptes. Elle est requise avant de publier une annonce ou de contacter quelqu\'un.'
      },
      {
        q: 'Comment supprimer mon compte ?',
        a: 'Va dans "Mon profil" puis la zone de gestion de compte. La suppression efface définitivement ton profil, tes annonces et tes conversations.'
      },
      {
        q: 'Mes informations sont-elles partagées ?',
        a: 'Non. Consulte notre page Confidentialité pour le détail de ce qui est collecté et comment c\'est utilisé.'
      },
    ]
  },
  {
    section: 'Colocs',
    items: [
      {
        q: 'Comment publier une annonce de colocation ?',
        a: 'Depuis ton tableau de bord, ouvre la section "Colocs" puis "Publier une annonce". Tu peux ajouter plusieurs photos de la chambre, le prix, la ville et le type de logement.'
      },
      {
        q: 'Puis-je modifier ou supprimer mon annonce de coloc ?',
        a: 'Oui. Dans "Mes annonces colocs", clique sur ton annonce pour la modifier (texte, prix, photos) ou la retirer à tout moment.'
      },
      {
        q: 'Comment signaler une annonce de colocation suspecte ?',
        a: 'Ouvre l\'annonce concernée et utilise le bouton de signalement. Notre équipe examine chaque signalement et peut retirer l\'annonce si elle ne respecte pas nos conditions.'
      },
    ]
  },
  {
    section: 'Avis sur les vendeurs',
    items: [
      {
        q: 'Comment laisser un avis sur un vendeur de manuels ?',
        a: 'Visite la page du vendeur (depuis une de ses annonces) et utilise le formulaire de notation pour lui donner une note de 1 à 5 étoiles et un commentaire.'
      },
      {
        q: 'Puis-je modifier mon avis ?',
        a: 'Oui, tant que tu es connecté avec le même compte. Tu peux modifier ou supprimer ton avis depuis la page du vendeur. Un seul avis par vendeur est autorisé par personne.'
      },
    ]
  },
]

function AccordionItem({ question, answer }) {
  const [isOpen, setIsOpen] = useState(false)
  return (
    <div style={{ borderBottom: '1px solid #f1f5f9' }}>
      <button
        onClick={() => setIsOpen(v => !v)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', gap: 12 }}
      >
        <span style={{ fontSize: 14, fontWeight: 600, color: '#1a2e4a', lineHeight: 1.4 }}>{question}</span>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5" style={{ flexShrink: 0, transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
      {isOpen && (
        <div style={{ padding: '0 0 16px', fontSize: 14, color: '#4a5568', lineHeight: 1.7 }}>{answer}</div>
      )}
    </div>
  )
}

export default function FaqPage() {
  const [user, setUser] = useState(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data?.user ?? null))
  }, [])

  return (
    <div style={{ fontFamily: "'Segoe UI', sans-serif", minHeight: '100vh', background: '#f5f7fa', colorScheme: 'light' }}>

      {/* Navbar */}
      <div style={{ background: 'white', borderBottom: '1px solid #e2e8f0', padding: '0 20px', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', alignItems: 'center', height: 56, gap: 16 }}>
          <Link href="/" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#64748b', padding: 4, textDecoration: 'none' }}>←</Link>
          <span style={{ flex: 1, fontSize: 15, fontWeight: 700, color: '#1a2e4a', textAlign: 'center' }}>Foire aux questions</span>
          <div style={{ width: 24 }} />
        </div>
      </div>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 16px' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📚</div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: '#1a2e4a', margin: '0 0 10px' }}>FAQ</h1>
          <p style={{ fontSize: 15, color: '#64748b', margin: 0 }}>Toutes les réponses à tes questions sur BiblioCamp.</p>
        </div>

        {/* Sections FAQ */}
        {FAQ.map(section => (
          <div key={section.section} style={{ background: 'white', borderRadius: 14, border: '1px solid #e2e8f0', padding: '20px 24px', marginBottom: 16 }}>
            <h2 style={{ fontSize: 13, fontWeight: 700, color: '#00c9a7', textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 4px' }}>{section.section}</h2>
            <div>
              {section.items.map((item, i) => (
                <AccordionItem key={i} question={item.q} answer={item.a} />
              ))}
            </div>
          </div>
        ))}

        {/* Pointeur vers FAQ manuels */}
        <div style={{ background: 'white', borderRadius: 14, border: '1px solid #e2e8f0', padding: '20px 24px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontSize: 28 }}>📚</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#1a2e4a' }}>Des questions sur les manuels ?</div>
            <div style={{ fontSize: 13, color: '#64748b' }}>Consulte la FAQ dédiée à l'achat et la vente de manuels.</div>
          </div>
          <Link href="/manuels/faq" style={{ fontSize: 13, fontWeight: 700, color: '#00c9a7', textDecoration: 'none', whiteSpace: 'nowrap' }}>
            Voir →
          </Link>
        </div>

        {/* Pointeur vers FAQ tuteurs */}
        <div style={{ background: 'white', borderRadius: 14, border: '1px solid #e2e8f0', padding: '20px 24px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontSize: 28 }}>🎓</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#1a2e4a' }}>Des questions sur les tuteurs ?</div>
            <div style={{ fontSize: 13, color: '#64748b' }}>Consulte la FAQ dédiée au tutorat entre étudiants.</div>
          </div>
          <Link href="/tuteurs/faq" style={{ fontSize: 13, fontWeight: 700, color: '#00c9a7', textDecoration: 'none', whiteSpace: 'nowrap' }}>
            Voir →
          </Link>
        </div>

        {/* Pointeur vers FAQ colocs */}
        <div style={{ background: 'white', borderRadius: 14, border: '1px solid #e2e8f0', padding: '20px 24px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontSize: 28 }}>🏠</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#1a2e4a' }}>Des questions sur les colocs ?</div>
            <div style={{ fontSize: 13, color: '#64748b' }}>Consulte la FAQ dédiée à la colocation entre étudiants.</div>
          </div>
          <Link href={user ? '/app?view=faq-colocs' : '/login?redirect=/app&view=faq-colocs'} style={{ fontSize: 13, fontWeight: 700, color: '#00c9a7', textDecoration: 'none', whiteSpace: 'nowrap' }}>
            Voir →
          </Link>
        </div>

        {/* Contact */}
        <div style={{ background: 'linear-gradient(135deg,#1a2e4a,#2d4a6b)', borderRadius: 14, padding: '24px', textAlign: 'center' }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'white', marginBottom: 8 }}>Tu as une autre question ?</div>
          <p style={{ fontSize: 13, color: '#a0c4d8', margin: '0 0 16px' }}>
            Écris-nous à{' '}
            <a href="mailto:info@bibliocamp.ca" style={{ color: 'white', fontWeight: 600 }}>info@bibliocamp.ca</a>.
          </p>
          {!user && (
            <Link href="/login" style={{ padding: '10px 20px', background: '#00c9a7', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, textDecoration: 'none', display: 'inline-block' }}>
              Se connecter →
            </Link>
          )}
        </div>

      </div>

      <Footer />
    </div>
  )
}
