'use client'

import { useRef, useState, useEffect } from 'react'

export default function Carousel({ children }) {
  const trackRef = useRef(null)
  const [canLeft, setCanLeft] = useState(false)
  const [canRight, setCanRight] = useState(false)

  const updateArrows = () => {
    const el = trackRef.current
    if (!el) return
    setCanLeft(el.scrollLeft > 4)
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
  }

  useEffect(() => {
    updateArrows()
    const el = trackRef.current
    if (!el) return
    el.addEventListener('scroll', updateArrows)
    window.addEventListener('resize', updateArrows)
    return () => {
      el.removeEventListener('scroll', updateArrows)
      window.removeEventListener('resize', updateArrows)
    }
  }, [children])

  const scrollBy = (dir) => {
    const el = trackRef.current
    if (!el) return
    el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: 'smooth' })
  }

  const arrowStyle = (visible) => ({
    width: 32, height: 32, borderRadius: '50%', border: '1px solid #e8edf2',
    background: 'white', display: visible ? 'flex' : 'none',
    alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)', flexShrink: 0,
    transition: 'transform 0.15s',
  })

  return (
    <div style={{ position: 'relative' }}>
      <div className="carousel-arrows" style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginBottom: 10 }}>
        <button type="button" onClick={() => scrollBy(-1)} style={arrowStyle(canLeft)} disabled={!canLeft}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#1a2e4a" strokeWidth="2.5"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <button type="button" onClick={() => scrollBy(1)} style={arrowStyle(canRight)} disabled={!canRight}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#1a2e4a" strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg>
        </button>
      </div>
      <div
        ref={trackRef}
        className="carousel-track"
        style={{
          display: 'flex', gap: 14, overflowX: 'auto', scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch', paddingBottom: 4,
        }}
      >
        {children}
      </div>
    </div>
  )
}
