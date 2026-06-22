'use client'

import { useEffect, useRef } from 'react'
import Chart from 'chart.js/auto'

function useChart(canvasRef, config) {
  useEffect(() => {
    if (!canvasRef.current) return
    const chart = new Chart(canvasRef.current, config)
    return () => chart.destroy()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(config.data)])
}

function Legend({ items }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 10, fontSize: 12, color: '#64748b' }}>
      {items.map(it => (
        <span key={it.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 10, height: 10, borderRadius: 2, background: it.color, display: 'inline-block' }} />
          {it.label}
        </span>
      ))}
    </div>
  )
}

export function GrowthLineChart({ growth }) {
  const canvasRef = useRef(null)
  const labels = growth.map((_, i) => i === growth.length - 1 ? 'Cette sem.' : `S-${growth.length - 1 - i}`)
  useChart(canvasRef, {
    type: 'line',
    data: {
      labels,
      datasets: [
        { label: 'Étudiants', data: growth.map(w => w.new_users), borderColor: '#00c9a7', backgroundColor: '#00c9a7', tension: 0.35, borderWidth: 2, pointRadius: 3 },
        { label: 'Annonces', data: growth.map(w => w.new_listings), borderColor: '#6c63ff', backgroundColor: '#6c63ff', tension: 0.35, borderWidth: 2, pointRadius: 3, borderDash: [5, 3] },
        { label: 'Conversations', data: growth.map(w => w.new_conv), borderColor: '#f59e0b', backgroundColor: '#f59e0b', tension: 0.35, borderWidth: 2, pointRadius: 3, borderDash: [2, 2] },
      ],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, ticks: { font: { size: 11 } } },
        x: { ticks: { font: { size: 11 } } },
      },
    },
  })
  return (
    <div>
      <Legend items={[
        { label: 'Nouveaux étudiants', color: '#00c9a7' },
        { label: 'Nouvelles annonces', color: '#6c63ff' },
        { label: 'Nouvelles conversations', color: '#f59e0b' },
      ]} />
      <div style={{ position: 'relative', width: '100%', height: 220 }}>
        <canvas ref={canvasRef} role="img" aria-label="Courbe de croissance hebdomadaire sur 8 semaines pour les nouveaux étudiants, nouvelles annonces et nouvelles conversations" />
      </div>
    </div>
  )
}

export function DomainsBarChart({ domains }) {
  const canvasRef = useRef(null)
  useChart(canvasRef, {
    type: 'bar',
    data: {
      labels: domains.map(d => d.name),
      datasets: [{ data: domains.map(d => d.count), backgroundColor: '#00c9a7', borderRadius: 4 }],
    },
    options: {
      indexAxis: 'y', responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { beginAtZero: true, ticks: { font: { size: 11 }, precision: 0 } },
        y: { ticks: { font: { size: 11 } } },
      },
    },
  })
  const height = Math.max(domains.length * 32 + 40, 160)
  return (
    <div style={{ position: 'relative', width: '100%', height }}>
      <canvas ref={canvasRef} role="img" aria-label="Diagramme à barres horizontales du nombre de tuteurs par matière enseignée" />
    </div>
  )
}

const RATE_COLORS = ['#00c9a7', '#6c63ff', '#f59e0b', '#fb923c', '#cbd5e0']

export function RateDonutChart({ rateRanges }) {
  const canvasRef = useRef(null)
  const entries = Object.entries(rateRanges)
  const total = entries.reduce((s, [, v]) => s + v, 0)
  useChart(canvasRef, {
    type: 'doughnut',
    data: {
      labels: entries.map(([range]) => range),
      datasets: [{ data: entries.map(([, v]) => v), backgroundColor: RATE_COLORS, borderWidth: 0 }],
    },
    options: {
      responsive: true, maintainAspectRatio: false, cutout: '65%',
      plugins: { legend: { display: false } },
    },
  })
  return (
    <div>
      <Legend items={entries.map(([range, v], i) => ({
        label: `${range} ${total ? Math.round((v / total) * 100) : 0}%`,
        color: RATE_COLORS[i % RATE_COLORS.length],
      }))} />
      <div style={{ position: 'relative', width: '100%', height: 180 }}>
        <canvas ref={canvasRef} role="img" aria-label="Diagramme en donut de la répartition des tarifs horaires des tuteurs par fourchette de prix" />
      </div>
    </div>
  )
}
