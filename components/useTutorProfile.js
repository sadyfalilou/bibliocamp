'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

// Logique partagée entre la fiche tuteur publique (app/tuteurs/[id]/page.js) et
// le panneau in-app (components/TutorDetailPanel.js) : chargement du tuteur, de
// ses avis, du badge de réactivité, de l'état "déjà contacté", et gestion CRUD
// de l'avis de l'utilisateur. La PRÉSENTATION et le bouton "Contacter" restent
// propres à chaque vue (ils diffèrent légitimement).
//
// onNotFound() est appelé si le tuteur est introuvable ou inactif (la page
// redirige vers /tuteurs, le panneau se ferme).
export function useTutorProfile({ tutorId, onNotFound }) {
  const [user, setUser]           = useState(null)
  const [tutor, setTutor]         = useState(null)
  const [reviews, setReviews]     = useState([])
  const [loading, setLoading]     = useState(true)
  const [isOwn, setIsOwn]         = useState(false)
  const [showAllReviews, setShowAllReviews] = useState(false)

  const [myReview, setMyReview]                 = useState(null)
  const [hasContacted, setHasContacted]         = useState(false)
  const [showReviewForm, setShowReviewForm]     = useState(false)
  const [reviewRating, setReviewRating]         = useState(0)
  const [reviewComment, setReviewComment]       = useState('')
  const [reviewError, setReviewError]           = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)
  const [reviewSuccess, setReviewSuccess]       = useState(false)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      if (cancelled) return
      setUser(currentUser)

      const { data: tutorData, error } = await supabase
        .from('tutors_with_rating').select('*').eq('id', tutorId).single()
      if (error || !tutorData) { if (!cancelled) onNotFound?.(); return }
      if (!tutorData.is_active && currentUser?.id !== tutorData.user_id) { if (!cancelled) onNotFound?.(); return }
      if (cancelled) return
      setTutor(tutorData)
      setIsOwn(currentUser?.id === tutorData.user_id)

      // Badge de réactivité (asynchrone, non bloquant)
      fetch(`/api/tutors/badges?ids=${tutorData.user_id}`)
        .then(res => res.ok ? res.json() : null)
        .then(json => { if (json) setTutor(prev => prev ? { ...prev, response_badge: json.badges[tutorData.user_id] ?? null } : prev) })
        .catch(() => {})

      // Incrémenter les vues (atomique) — sauf sur son propre profil
      if (currentUser?.id !== tutorData.user_id) {
        supabase.rpc('increment_tutor_views', { tutor_id: tutorId }).then(() => {})
      }

      const { data: reviewsData } = await supabase
        .from('tutor_reviews')
        .select('*, profiles(first_name, last_name, avatar_url)')
        .eq('tutor_id', tutorId)
        .order('created_at', { ascending: false })
      if (cancelled) return
      setReviews(reviewsData || [])

      if (currentUser) {
        const existing = (reviewsData || []).find(r => r.reviewer_id === currentUser.id)
        if (existing) setMyReview(existing)
        // Un avis n'est possible qu'après avoir contacté le tuteur (aligné sur
        // la politique RLS) : on vérifie l'existence d'une conversation.
        if (currentUser.id !== tutorData.user_id) {
          const { data: conv } = await supabase
            .from('conversations').select('id')
            .eq('tutor_id', tutorId)
            .or(`user1_id.eq.${currentUser.id},user2_id.eq.${currentUser.id}`)
            .maybeSingle()
          if (conv && !cancelled) setHasContacted(true)
        }
      }

      if (!cancelled) setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [tutorId])

  const submitReview = async () => {
    setReviewError('')
    if (reviewRating === 0) { setReviewError('Choisis une note.'); return }
    if (reviewComment.trim().length > 0 && reviewComment.trim().length < 10) {
      setReviewError('Le commentaire doit faire au moins 10 caractères.')
      return
    }
    setSubmittingReview(true)
    try {
      if (myReview) {
        const { error } = await supabase.from('tutor_reviews')
          .update({ rating: reviewRating, comment: reviewComment.trim() || null })
          .eq('id', myReview.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('tutor_reviews').insert({
          tutor_id: tutorId,
          reviewer_id: user.id,
          rating: reviewRating,
          comment: reviewComment.trim() || null,
        })
        if (error) throw error
      }

      const { data: refreshed } = await supabase
        .from('tutor_reviews')
        .select('*, profiles(first_name, last_name, avatar_url)')
        .eq('tutor_id', tutorId)
        .order('created_at', { ascending: false })
      setReviews(refreshed || [])
      const newMine = (refreshed || []).find(r => r.reviewer_id === user.id)
      setMyReview(newMine || null)

      const { data: refreshedTutor } = await supabase
        .from('tutors_with_rating').select('avg_rating, review_count').eq('id', tutorId).single()
      if (refreshedTutor) setTutor(prev => ({ ...prev, ...refreshedTutor }))

      setReviewSuccess(true)
      setShowReviewForm(false)
      setReviewComment('')
    } catch {
      setReviewError('Erreur lors de l\'envoi. Réessaie.')
    } finally {
      setSubmittingReview(false)
    }
  }

  const openEditReview = () => {
    setReviewRating(myReview.rating)
    setReviewComment(myReview.comment || '')
    setReviewSuccess(false)
    setShowReviewForm(true)
  }

  const deleteReview = async () => {
    if (!myReview) return
    await supabase.from('tutor_reviews').delete().eq('id', myReview.id)
    setMyReview(null)
    setReviews(prev => prev.filter(r => r.id !== myReview.id))
    setReviewRating(0)
    setReviewComment('')
  }

  return {
    user, tutor, setTutor, reviews, loading, isOwn,
    showAllReviews, setShowAllReviews,
    myReview, hasContacted,
    showReviewForm, setShowReviewForm,
    reviewRating, setReviewRating,
    reviewComment, setReviewComment,
    reviewError, setReviewError,
    submittingReview, reviewSuccess, setReviewSuccess,
    submitReview, openEditReview, deleteReview,
  }
}
