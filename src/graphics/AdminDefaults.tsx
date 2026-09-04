'use client'

import { useEffect, type ReactNode } from 'react'

export default function AdminDefaults({ children }: { children: ReactNode }) {
  useEffect(() => {
    const openNav = () => {
      document
        .querySelectorAll('.template-default--nav-collapsed, .nav--nav-collapsed')
        .forEach((el) => {
          el.classList.remove('template-default--nav-collapsed', 'nav--nav-collapsed')
        })
      const toggle = document.querySelector<HTMLButtonElement>(
        'button.nav-toggler, .nav__toggler, button[aria-label="Open Menu"], button[aria-label="Close Menu"]',
      )
      const nav = document.querySelector('nav.nav, aside.nav, .nav')
      if (nav?.className.includes('collapsed') && toggle) {
        toggle.click()
      }
    }
    openNav()
    const t = window.setTimeout(openNav, 400)
    return () => window.clearTimeout(t)
  }, [])

  return children
}
