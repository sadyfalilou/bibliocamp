'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html>
      <body>
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <h2>Une erreur inattendue s&apos;est produite.</h2>
          <button onClick={() => reset()}>Réessayer</button>
        </div>
      </body>
    </html>
  )
}
