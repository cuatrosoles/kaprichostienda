'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { trackStoreEvent } from '@/lib/analytics/client'

export default function AnalyticsTracker() {
  const pathname = usePathname()
  const started = useRef(Date.now())

  useEffect(() => {
    started.current = Date.now()
    trackStoreEvent('pageview', { path: pathname || '/' })

    const ping = () => {
      trackStoreEvent('ping', { path: pathname || '/', durationMs: Date.now() - started.current })
    }
    const onHide = () => {
      if (document.visibilityState === 'hidden') ping()
    }
    window.addEventListener('pagehide', ping)
    document.addEventListener('visibilitychange', onHide)
    return () => {
      ping()
      window.removeEventListener('pagehide', ping)
      document.removeEventListener('visibilitychange', onHide)
    }
  }, [pathname])

  return null
}
