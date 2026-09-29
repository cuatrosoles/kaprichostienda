'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useCommerce } from '@/context/CommerceContext'

export default function AnnouncementBar() {
  const commerce = useCommerce()
  const [index, setIndex] = useState(0)
  const messages = commerce.announcements.filter(
    (text) => commerce.transferEnabled || !text.toLowerCase().includes('transferencia'),
  )
  const safeIndex = messages.length ? index % messages.length : 0

  useEffect(() => {
    if (messages.length < 2) return
    const id = setInterval(() => setIndex((i) => (i + 1) % messages.length), 4000)
    return () => clearInterval(id)
  }, [messages.length])

  if (!messages.length) return null

  return (
    <div className="bg-[#2a2a2a] text-white">
      <div className="mx-auto flex max-w-6xl items-center justify-center gap-4 px-3 py-2 text-[11px] uppercase tracking-[0.16em]">
        <button
          type="button"
          aria-label="Anterior"
          className="opacity-70 hover:opacity-100"
          onClick={() => setIndex((i) => (i - 1 + messages.length) % messages.length)}
        >
          ‹
        </button>
        <Link href="/productos" className="min-h-[1.2em] text-center">
          {messages[safeIndex]}
        </Link>
        <button
          type="button"
          aria-label="Siguiente"
          className="opacity-70 hover:opacity-100"
          onClick={() => setIndex((i) => (i + 1) % messages.length)}
        >
          ›
        </button>
      </div>
    </div>
  )
}
