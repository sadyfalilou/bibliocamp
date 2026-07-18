// Données FAQ partagées entre la page client (rendu de l'accordéon) et le
// layout serveur (métadonnées + JSON-LD FAQPage pour les rich results Google).
// Une seule source de vérité pour éviter que le contenu visible et le JSON-LD
// divergent (Google pénalise les données structurées non visibles).

export const FAQ_GENERAL = [
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

export const FAQ_MANUELS = [
  {
    section: 'Pour les acheteurs',
    items: [
      {
        q: 'Comment trouver un manuel ?',
        a: 'Cherche par titre, ISBN ou code de cours depuis la page d\'accueil ou la section "Acheter un manuel". Tu verras tous les vendeurs disponibles avec leur prix, triés du moins cher au plus cher.'
      },
      {
        q: 'Comment contacter un vendeur ?',
        a: 'Clique sur une annonce puis sur "Contacter le vendeur". Un message s\'ouvre dans ta messagerie BiblioCamp pour discuter du prix, du lieu de rencontre et de la disponibilité.'
      },
      {
        q: 'Puis-je négocier le prix ?',
        a: 'Oui, rien n\'empêche de négocier directement avec le vendeur dans la conversation. BiblioCamp affiche le prix demandé, mais l\'entente finale se fait entre vous.'
      },
      {
        q: 'Comment savoir si le prix est correct ?',
        a: 'Compare les annonces pour un même manuel (plusieurs vendeurs apparaissent souvent pour le même titre) et regarde le prix neuf affiché en référence quand disponible.'
      },
      {
        q: 'Que faire si le vendeur ne répond pas ?',
        a: 'Patiente quelques jours, puis essaie un autre vendeur du même manuel si disponible. Si le comportement te semble abusif, utilise le bouton "Signaler cette annonce".'
      },
    ]
  },
  {
    section: 'Pour les vendeurs',
    items: [
      {
        q: 'Comment publier une annonce ?',
        a: 'Connecte-toi, clique sur "Vendre", entre l\'ISBN au dos du livre pour auto-remplir titre et auteur, ajoute une photo, fixe ton prix et publie. C\'est en ligne immédiatement.'
      },
      {
        q: 'Dois-je connaître l\'ISBN ?',
        a: 'Ce n\'est pas obligatoire, mais ça facilite la recherche pour les acheteurs et pré-remplit automatiquement les informations du livre. Tu peux publier sans ISBN en remplissant les champs manuellement.'
      },
      {
        q: 'Comment fixer mon prix ?',
        a: 'Tu es libre de fixer le prix que tu veux. Regarde les annonces existantes pour le même manuel afin de rester compétitif, surtout si plusieurs vendeurs proposent le même titre.'
      },
      {
        q: 'Puis-je modifier ou retirer mon annonce ?',
        a: 'Oui, à tout moment depuis "Mes annonces". Tu peux changer le prix, les photos, marquer le manuel comme vendu, ou supprimer l\'annonce.'
      },
      {
        q: 'Est-ce gratuit de vendre ?',
        a: 'Oui, 100% gratuit, sans aucune commission. Le paiement se fait directement entre toi et l\'acheteur.'
      },
    ]
  },
  {
    section: 'Sécurité et transactions',
    items: [
      {
        q: 'Comment se passe le paiement ?',
        a: 'BiblioCamp ne traite aucun paiement — l\'acheteur et le vendeur s\'entendent directement, en personne ou par virement. Nous recommandons le paiement en personne au moment de l\'échange.'
      },
      {
        q: 'Où se rencontrer pour l\'échange ?',
        a: 'Privilégie les lieux publics : bibliothèque, café étudiant, hall de pavillon sur le campus. Évite les domiciles privés pour une première rencontre.'
      },
      {
        q: 'Que faire si une annonce semble suspecte ?',
        a: 'Utilise le bouton "Signaler cette annonce" visible sur chaque annonce une fois connecté. Notre équipe examine chaque signalement rapidement.'
      },
      {
        q: 'Que faire si la personne ne se présente pas au rendez-vous ?',
        a: 'Laisse un délai raisonnable puis recontacte la personne via la messagerie. Si ça se reproduit ou que le comportement est abusif, signale l\'annonce ou le profil.'
      },
    ]
  },
]

export const FAQ_TUTEURS = [
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

// Construit le JSON-LD FAQPage à partir d'un tableau FAQ sectionné.
export function faqJsonLd(faq) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.flatMap(s => s.items).map(it => ({
      '@type': 'Question',
      name: it.q,
      acceptedAnswer: { '@type': 'Answer', text: it.a },
    })),
  }
}
