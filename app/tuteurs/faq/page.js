'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const FAQ = [
  {
    section: 'Pour les étudiants',
    items: [
      {
        q: 'Est-ce gratuit de trouver un tuteur ?',
        a: 'Oui, BiblioCamp est gratuit pour trouver un tuteur. Tu paies uniquement le tuteur directement pour ses sessions — le tarif est affiché sur son profil.'
      },
      {
        q: 'Comment choisir un bon tuteur ?',
        a: 'Consulte les avis laissés par d\'autres étudiants, vérifie les matières enseignées et le tarif. N\'hésite pas à envoyer un message pour poser tes questions avant de réserver une session.'
      },
      {
        q: 'Comment contacter un tuteur ?',
        a: 'Clique sur le profil d\'un tuteur puis sur "Contacter". Un message s\'ouvre dans ta messagerie BiblioCamp. Tu peux discuter de tes besoins, de la disponibilité et du tarif avant de vous rencontrer.'
      },
      {
        q: 'Que faire si le tuteur n\'est pas satisfaisant ?',
        a: 'Laisse un avis honnête sur son profil pour aider les autres étudiants. Si tu rencontres un problème grave, contacte-nous via la page de signalement.'
      },
      {
        q: 'Comment payer le tuteur ?',
        a: 'Le paiement se fait directement entre toi et le tuteur — en personne ou par virement. BiblioCamp ne prend aucune commission et ne gère pas les paiements pour l\'instant.'
      },
    ]
  },
  {
    section: 'Pour les tuteurs',
    items: [
      {
        q: 'Comment devenir tuteur ?',
        a: 'Clique sur "Devenir tuteur" et remplis le formulaire en 4 étapes : ton profil de base, tes matières, tes disponibilités et ta présentation. Ton profil est en ligne immédiatement.'
      },
      {
        q: 'Dois-je être étudiant pour être tuteur ?',
        a: 'Tu dois être étudiant actif ou diplômé récent. Ton institution est liée à ton profil BiblioCamp, ce qui aide les étudiants à te trouver.'
      },
      {
        q: 'Comment fixer mon tarif ?',
        a: 'Tu es libre de fixer ton tarif entre 10 $ et 150 $/heure. La moyenne sur la plateforme se situe entre 20 $ et 40 $/h. Un tarif compétitif pour tes premières sessions t\'aidera à accumuler des avis.'
      },
      {
        q: 'Puis-je masquer mon profil temporairement ?',
        a: 'Oui. Dans "Mon profil tuteur", un simple toggle te permet de masquer ton profil pendant les examens ou les vacances, sans perdre tes informations.'
      },
      {
        q: 'Comment modifier mon profil ?',
        a: 'Va dans "Mon profil tuteur" depuis la sidebar ou depuis la page Tuteurs. Tu peux modifier toutes tes informations à tout moment et sauvegarder en un clic.'
      },
    ]
  },
  {
    section: 'Sécurité et bon comportement',
    items: [
      {
        q: 'Où se rencontrer pour les sessions ?',
        a: 'Nous recommandons fortement les lieux publics : bibliothèque universitaire, café, salle d\'étude sur campus. Évite les domiciles privés lors des premières rencontres.'
      },
      {
        q: 'Que faire si quelqu\'un me demande de faire ses devoirs ?',
        a: 'Refuse catégoriquement. BiblioCamp est une plateforme d\'entraide académique, pas de plagiat. Les tuteurs qui offrent ce service sont bannis. Si tu reçois une telle demande, signale-la.'
      },
      {
        q: 'Comment fonctionne le système d\'avis ?',
        a: 'Après une conversation avec un tuteur, tu peux laisser un avis avec une note de 1 à 5 étoiles et un commentaire. Chaque utilisateur ne peut laisser qu\'un seul avis par tuteur.'
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

export default function TuteursFaqPage() {
  const router = useRouter()

  return (
    <div style={{ fontFamily: "'Segoe UI', sans-serif", minHeight: '100vh', background: '#f5f7fa', colorScheme: 'light' }}>

      {/* Navbar */}
      <div style={{ background: 'white', borderBottom: '1px solid #e2e8f0', padding: '0 20px', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', alignItems: 'center', height: 56, gap: 16 }}>
          <button onClick={() => router.push('/tuteurs')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#64748b', padding: 4 }}>← Tuteurs</button>
          <span style={{ flex: 1, fontSize: 15, fontWeight: 700, color: '#1a2e4a', textAlign: 'center' }}>Foire aux questions</span>
          <div style={{ width: 80 }} />
        </div>
      </div>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 16px' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🎓</div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: '#1a2e4a', margin: '0 0 10px' }}>FAQ Tuteurs</h1>
          <p style={{ fontSize: 15, color: '#64748b', margin: 0 }}>Toutes les réponses à tes questions sur le tutorat entre étudiants.</p>
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
            <button onClick={() => router.push('/tuteurs')} style={{ padding: '10px 20px', background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              Voir les tuteurs
            </button>
            <button onClick={() => router.push('/tuteurs/devenir-tuteur')} style={{ padding: '10px 20px', background: '#00c9a7', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              Devenir tuteur →
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
