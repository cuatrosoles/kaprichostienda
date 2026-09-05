'use client'

import { useEffect, type ReactNode } from 'react'

function persistNavOpen() {
  try {
    localStorage.setItem('nav', JSON.stringify({ open: true, collapsed: false }))
    localStorage.setItem('payload-nav', JSON.stringify({ open: true, collapsed: false }))
  } catch {
    /* ignore */
  }
}

function openNav() {
  persistNavOpen()
  document
    .querySelectorAll('.template-default--nav-collapsed, .nav--nav-collapsed')
    .forEach((el) => {
      el.classList.remove('template-default--nav-collapsed', 'nav--nav-collapsed')
    })

  const toggle = document.querySelector<HTMLButtonElement>(
    'button.nav-toggler, .nav__toggler, button[class*="nav-toggler"]',
  )
  if (toggle && toggle.getAttribute('aria-expanded') === 'false') {
    toggle.click()
  }
}

export default function AdminDefaults({ children }: { children: ReactNode }) {
  useEffect(() => {
    persistNavOpen()
    openNav()
    const timeouts = [200, 800].map((ms) => window.setTimeout(openNav, ms))

    let scheduled = 0
    const observer = new MutationObserver(() => {
      window.clearTimeout(scheduled)
      scheduled = window.setTimeout(openNav, 80)
    })
    const root = document.querySelector('.template-default, #app, body')
    if (root) {
      observer.observe(root, { subtree: true, attributes: true, attributeFilter: ['class'] })
    }

    return () => {
      timeouts.forEach((id) => window.clearTimeout(id))
      window.clearTimeout(scheduled)
      observer.disconnect()
    }
  }, [])

  return children
}
