'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ANNOUNCEMENTS } from '@/data/catalog'

export default function AnnouncementBar() {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % ANNOUNCEMENTS.length), 4000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="bg-[#2a2a2a] text-white">
      <div className="mx-auto flex max-w-6xl items-center justify-center gap-4 px-3 py-2 text-[11px] uppercase tracking-[0.16em]">
        <button
          type="button"
          aria-label="Anterior"
          className="opacity-70 hover:opacity-100"
          onClick={() => setIndex((i) => (i - 1 + ANNOUNCEMENTS.length) % ANNOUNCEMENTS.length)}
        >
          ‹
        </button>
        <Link href="/productos" className="min-h-[1.2em] text-center">
          {ANNOUNCEMENTS[index]}
        </Link>
        <button
          type="button"
          aria-label="Siguiente"
          className="opacity-70 hover:opacity-100"
          onClick={() => setIndex((i) => (i + 1) % ANNOUNCEMENTS.length)}
        >
          ›
        </button>
      </div>
    </div>
  )
}
