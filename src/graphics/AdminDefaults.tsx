'use client'

import { useNav } from '@payloadcms/ui'
import { useEffect, type ReactNode } from 'react'

function isDesktop() {
  return typeof window !== 'undefined' && window.innerWidth >= 768
}

export default function AdminDefaults({ children }: { children: ReactNode }) {
  const { hydrated, navOpen, setNavOpen } = useNav()

  useEffect(() => {
    if (!isDesktop()) return
    if (!navOpen) setNavOpen(true)
  }, [hydrated, navOpen, setNavOpen])

  useEffect(() => {
    if (!isDesktop()) return
    const onResize = () => {
      if (isDesktop()) setNavOpen(true)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [setNavOpen])

  return children
}
