'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function AnalyticsNavLink() {
  const pathname = usePathname()
  const href = '/admin/analitica'
  const active = pathname === href || Boolean(pathname?.startsWith(`${href}/`))

  return (
    <div className="nav-group">
      <p className="nav-group__label">Marketing</p>
      <Link className={active ? 'nav__link active' : 'nav__link'} href={href} prefetch={false} id="nav-analitica">
        <span className="nav__link-label">Analítica</span>
      </Link>
    </div>
  )
}
