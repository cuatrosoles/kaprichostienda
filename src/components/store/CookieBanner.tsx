'use client'

import { useEffect, useState } from 'react'

export default function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem('kaprichos-cookies')) setVisible(true)
  }, [])

  if (!visible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 flex flex-col items-start justify-between gap-3 border-t bg-white px-4 py-3 text-sm md:flex-row md:items-center">
      <p>
        Al navegar por este sitio <strong>aceptás el uso de cookies</strong> para agilizar tu experiencia de compra.
      </p>
      <button
        type="button"
        className="store-btn-outline"
        onClick={() => {
          localStorage.setItem('kaprichos-cookies', '1')
          setVisible(false)
        }}
      >
        Entendido
      </button>
    </div>
  )
}
