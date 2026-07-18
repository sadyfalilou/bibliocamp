'use client'

import { useEffect, useState, useMemo } from 'react'
import { supabase } from '../lib/supabase'

// Jour courant, calculé à l'appel (pas au chargement du module) pour rester
// juste même si l'onglet reste ouvert après minuit. Exporté pour les cartes.
export const todayKey = () => ['dimanche','lundi','mardi','mercredi','jeudi','vendredi','samedi'][new Date().getDay()]

// Logique partagée entre la liste tuteurs publique (app/tuteurs/page.js) et la
// vue in-app (components/TuteursView.js) : chargement des tuteurs actifs + de
// leurs badges de réactivité, état des filtres et liste filtrée/triée.
// La PRÉSENTATION (hero, cartes, grille) reste propre à chaque vue.
export function useTutorList({ initialSearch = '' } = {}) {
  const [user, setUser]       = useState(null)
  const [tutors, setTutors]   = useState([])
  const [loading, setLoading] = useState(true)
  const [isTutor, setIsTutor] = useState(false)

  const [search, setSearch]             = useState(initialSearch)
  const [filterDomain, setFilterDomain] = useState('')
  const [filterMode, setFilterMode]     = useState('')
  const [filterPrice, setFilterPrice]   = useState('')
  const [filterDispoToday, setFilterDispoToday] = useState(false)
  const [filterLang, setFilterLang]     = useState('')
  const [sortBy, setSortBy]             = useState('recommended')

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      if (cancelled) return
      setUser(currentUser)
      if (currentUser) {
        const { data: t } = await supabase.from('tutors').select('id').eq('user_id', currentUser.id).single()
        if (!cancelled) setIsTutor(!!t)
      }

      const { data } = await supabase.from('tutors_with_rating').select('*').eq('is_active', true)
      if (cancelled) return
      const list = data || []
      setTutors(list)
      setLoading(false)

      if (list.length > 0) {
        const ids = list.map(t => t.user_id).join(',')
        const res = await fetch(`/api/tutors/badges?ids=${ids}`)
        if (res.ok && !cancelled) {
          const { badges } = await res.json()
          setTutors(prev => prev.map(t => ({ ...t, response_badge: badges[t.user_id] ?? null })))
        }
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  const filtered = useMemo(() => {
    let list = [...tutors]

    if (search) {
      const q = search.toLowerCase()
      list = list.filter(t =>
        `${t.first_name} ${t.last_name}`.toLowerCase().includes(q) ||
        t.subjects?.some(s => s.toLowerCase().includes(q)) ||
        t.domains?.some(d => d.toLowerCase().includes(q)) ||
        t.bio?.toLowerCase().includes(q) ||
        t.institution?.toLowerCase().includes(q)
      )
    }
    if (filterDomain) list = list.filter(t => t.domains?.includes(filterDomain))
    if (filterMode === 'campus') list = list.filter(t => t.meet_campus)
    if (filterMode === 'online') list = list.filter(t => t.meet_online)
    if (filterMode === 'city')   list = list.filter(t => t.meet_city)
    if (filterPrice) {
      const [min, max] = filterPrice.split('-').map(Number)
      list = list.filter(t => t.rate_per_hour >= min && t.rate_per_hour <= max)
    }
    if (filterDispoToday) list = list.filter(t => (t.availabilities?.[todayKey()] || []).length > 0)
    if (filterLang) list = list.filter(t => t.languages?.includes(filterLang))

    if (sortBy === 'recommended') {
      list.sort((a, b) => {
        if (b.is_pro !== a.is_pro) return b.is_pro ? 1 : -1
        return (b.avg_rating || 0) - (a.avg_rating || 0)
      })
    } else if (sortBy === 'price_asc')  list.sort((a, b) => a.rate_per_hour - b.rate_per_hour)
    else if (sortBy === 'price_desc')   list.sort((a, b) => b.rate_per_hour - a.rate_per_hour)
    else if (sortBy === 'rating')       list.sort((a, b) => (b.avg_rating || 0) - (a.avg_rating || 0))
    else if (sortBy === 'recent')       list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

    return list
  }, [tutors, search, filterDomain, filterMode, filterPrice, filterDispoToday, filterLang, sortBy])

  const hasFilters = !!(search || filterDomain || filterMode || filterPrice || filterDispoToday || filterLang)
  const resetFilters = () => {
    setSearch(''); setFilterDomain(''); setFilterMode(''); setFilterPrice('')
    setFilterDispoToday(false); setFilterLang('')
  }

  return {
    user, tutors, filtered, loading, isTutor, hasFilters, resetFilters,
    search, setSearch,
    filterDomain, setFilterDomain,
    filterMode, setFilterMode,
    filterPrice, setFilterPrice,
    filterDispoToday, setFilterDispoToday,
    filterLang, setFilterLang,
    sortBy, setSortBy,
  }
}
