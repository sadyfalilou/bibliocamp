'use client'

import { useState } from 'react'

const FAQ = [
  {
    section: 'Trouver un coloc',
    items: [
      {
        q: 'Est-ce gratuit de chercher une chambre ou un coloc ?',
        a: 'Oui, BiblioCamp est entièrement gratuit pour consulter les annonces de colocation et contacter les annonceurs. Aucune commission n\'est prélevée.'
      },
      {
        q: 'Comment filtrer les annonces selon mes critères ?',
        a: 'Utilise les filtres de ville, de prix maximum et de type de logement dans la section "Trouver un coloc". Les résultats se mettent à jour automatiquement.'
      },
      {
        q: 'Comment contacter quelqu\'un pour une annonce de coloc ?',
        a: 'Clique sur l\'annonce qui t\'intéresse puis sur "Contacter". Un message s\'ouvre dans ta messagerie BiblioCamp pour discuter directement avec l\'annonceur.'
      },
      {
        q: 'Comment signaler une annonce suspecte ?',
        a: 'Ouvre l\'annonce et utilise le bouton de signalement. Notre équipe examine chaque signalement et peut retirer l\'annonce si elle ne respecte pas nos conditions.'
      },
    ]
  },
  {
    section: 'Publier une annonce',
    items: [
      {
        q: 'Comment publier une annonce de colocation ?',
        a: 'Clique sur "Publier une annonce" dans la section Colocs et remplis le formulaire : ville, prix, type de logement, description et photos. Ton annonce est en ligne immédiatement.'
      },
      {
        q: 'Combien de photos puis-je ajouter ?',
        a: 'Tu peux ajouter plusieurs photos de la chambre ou du logement pour donner une meilleure idée aux personnes intéressées.'
      },
      {
        q: 'Puis-je modifier ou supprimer mon annonce ?',
        a: 'Oui. Dans "Mes annonces", clique sur ton annonce pour la modifier (texte, prix, photos) ou la retirer à tout moment.'
      },
    ]
  },
  {
    section: 'Sécurité et bon comportement',
    items: [
      {
        q: 'Où rencontrer une personne avant de t\'engager ?',
        a: 'Nous recommandons fortement de visiter le logement en personne avant de t\'engager, et de privilégier les premières rencontres en lieu public.'
      },
      {
        q: 'BiblioCamp gère-t-il les paiements ou les dépôts ?',
        a: 'Non. BiblioCamp n\'est pas partie aux ententes de colocation et ne traite aucun paiement. Les arrangements (loyer, dépôt) se concluent directement entre les utilisateurs.'
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

export default function ColocsFaqView({ setView }) {
  return (
    <div style={{ maxWidth: 720 }}>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{ fontSize: 36, marginBottom: 10 }}>🏠</div>
        <h1 style={{ fontSize: 23, fontWeight: 900, color: '#1a2e4a', margin: '0 0 8px' }}>FAQ Colocs</h1>
        <p style={{ fontSize: 14, color: '#64748b', margin: 0 }}>Toutes les réponses à tes questions sur la colocation entre étudiants.</p>
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

      {/* Contact */}
      <div style={{ background: 'linear-gradient(135deg,#1a2e4a,#2d4a6b)', borderRadius: 14, padding: '24px', textAlign: 'center' }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: 'white', marginBottom: 8 }}>Tu as une autre question ?</div>
        <p style={{ fontSize: 13, color: '#a0c4d8', margin: '0 0 16px' }}>Contacte-nous et on te répondra dans les plus brefs délais.</p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => setView('colocs')} style={{ padding: '10px 20px', background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            Voir les annonces
          </button>
          <button onClick={() => setView('publier-coloc')} style={{ padding: '10px 20px', background: '#00c9a7', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            Publier une annonce →
          </button>
        </div>
      </div>

    </div>
  )
}
