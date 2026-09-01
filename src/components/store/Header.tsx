'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FormEvent, useMemo, useRef, useState } from 'react'
import { buildMegaMenu, type CatalogCategory } from '@/data/catalog'
import { useCart } from '@/context/CartContext'
import { useAuth } from '@/context/AuthContext'

/** 'logo-left' = prueba actual. Volvé a 'classic' para el header original (logo al centro). */
const HEADER_LAYOUT: 'classic' | 'logo-left' = 'logo-left'

export default function Header({ categories }: { categories: CatalogCategory[] }) {
  const { count, openCart } = useCart()
  const { user } = useAuth()
  const [query, setQuery] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [mega, setMega] = useState(false)
  const megaCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const router = useRouter()
  const megaMenu = useMemo(() => buildMegaMenu(categories), [categories])

  const openMega = () => {
    if (megaCloseTimer.current) {
      clearTimeout(megaCloseTimer.current)
      megaCloseTimer.current = null
    }
    setMega(true)
  }

  const closeMega = () => {
    if (megaCloseTimer.current) clearTimeout(megaCloseTimer.current)
    megaCloseTimer.current = setTimeout(() => {
      setMega(false)
      megaCloseTimer.current = null
    }, 180)
  }

  const onSearch = (e: FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return
    router.push(`/productos?q=${encodeURIComponent(query.trim())}`)
    setMenuOpen(false)
  }

  const searchForm = (className: string, inputClassName: string) => (
    <form onSubmit={onSearch} className={className}>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar"
        className={inputClassName}
      />
      <button type="submit" aria-label="Buscar" className="text-lg leading-none">
        ⌕
      </button>
    </form>
  )

  const accountAndCart = (
    <div className="flex items-center gap-4">
      <Link
        href={user ? '/cuenta' : '/cuenta/ingresar'}
        className="hidden text-[11px] uppercase tracking-nav md:inline hover:opacity-60"
      >
        {user ? 'Mi cuenta' : 'Ingresar'}
      </Link>
      <button type="button" onClick={openCart} className="text-xl" aria-label="Carrito">
        <span className="relative inline-block">
          👜
          {count > 0 && (
            <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-kap-green px-1 text-[10px] text-white">
              {count}
            </span>
          )}
        </span>
      </button>
    </div>
  )

  const menuButton = (
    <button type="button" className="md:hidden" aria-label="Menú" onClick={() => setMenuOpen((v) => !v)}>
      <span className="block h-px w-5 bg-black" />
      <span className="mt-1.5 block h-px w-5 bg-black" />
      <span className="mt-1.5 block h-px w-5 bg-black" />
    </button>
  )

  const megaPanel =
    mega && (
      <div className="absolute left-1/2 top-full z-50 w-[min(920px,calc(100vw-2rem))] -translate-x-1/2 pt-4">
        <div className="border border-neutral-200 bg-white p-8 shadow-xl">
          <div
            className="grid gap-8 text-left"
            style={{ gridTemplateColumns: `repeat(${Math.max(megaMenu.length, 1)}, minmax(0, 1fr))` }}
          >
            {megaMenu.map((col) => (
              <div key={col.title}>
                <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-kap-green">{col.title}</p>
                <ul className="space-y-2 normal-case tracking-normal">
                  {col.links.map((l) => (
                    <li key={l.href + l.label}>
                      <Link
                        href={l.href}
                        className="text-xs text-neutral-700 hover:text-black"
                        onClick={() => setMega(false)}
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    )

  const desktopNav = (
    <nav className="hidden min-w-0 items-center justify-center gap-5 text-[11px] font-medium uppercase tracking-nav md:flex lg:gap-8">
      <Link href="/" className="hover:opacity-60">
        Inicio
      </Link>
      <div className="relative" onMouseEnter={openMega} onMouseLeave={closeMega}>
        <Link href="/productos" className="inline-block hover:opacity-60">
          Productos
        </Link>
        {megaPanel}
      </div>
      <Link href="/contacto" className="hover:opacity-60">
        Contacto
      </Link>
      <Link href="/politica-de-devolucion" className="hover:opacity-60">
        Política de Devolución
      </Link>
      <Link href="/puntos-de-beneficio" className="hover:opacity-60">
        Club Kaprichos
      </Link>
    </nav>
  )

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white">
      {HEADER_LAYOUT === 'classic' ? (
        <>
          <div className="mx-auto grid max-w-6xl grid-cols-3 items-center px-4 py-4">
            <div className="flex items-center gap-3">
              {menuButton}
              {searchForm(
                'hidden items-center gap-2 md:flex',
                'w-36 border-0 border-b border-neutral-400 bg-transparent py-1 text-sm outline-none focus:border-black',
              )}
            </div>
            <Link href="/" className="justify-self-center">
              <img
                src="/logo-kaprichos.webp"
                alt="Kaprichos Tienda"
                className="h-16 w-16 rounded-full object-cover md:h-20 md:w-20"
              />
            </Link>
            <div className="justify-self-end">{accountAndCart}</div>
          </div>
          <div className="hidden pb-4 md:flex md:justify-center">{desktopNav}</div>
        </>
      ) : (
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 md:grid md:grid-cols-[auto_minmax(0,1fr)_auto]">
          <div className="flex items-center gap-3">
            {menuButton}
            <Link href="/" className="shrink-0">
              <img
                src="/logo-kaprichos.webp"
                alt="Kaprichos Tienda"
                className="h-20 w-20 rounded-full object-cover md:h-28 md:w-28"
              />
            </Link>
          </div>
          {desktopNav}
          <div className="flex flex-col items-end gap-2">
            {accountAndCart}
            {searchForm(
              'hidden items-center gap-2 md:flex',
              'w-44 border-0 border-b border-neutral-400 bg-transparent py-1 text-right text-sm outline-none focus:border-black',
            )}
          </div>
        </div>
      )}

      {menuOpen && (
        <div className="space-y-4 border-t px-4 py-5 md:hidden">
          <form onSubmit={onSearch} className="flex gap-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar"
              className="flex-1 border-b border-neutral-400 py-1 text-sm outline-none"
            />
          </form>
          <Link href="/" className="block text-sm uppercase tracking-nav" onClick={() => setMenuOpen(false)}>
            Inicio
          </Link>
          <Link href="/productos" className="block text-sm uppercase tracking-nav" onClick={() => setMenuOpen(false)}>
            Productos
          </Link>
          {categories.map((c) => (
            <Link
              key={c.slug}
              href={`/productos?categoria=${c.slug}`}
              className="block pl-3 text-sm text-neutral-600"
              onClick={() => setMenuOpen(false)}
            >
              {c.title}
            </Link>
          ))}
          <Link href="/contacto" className="block text-sm uppercase tracking-nav" onClick={() => setMenuOpen(false)}>
            Contacto
          </Link>
          <Link
            href="/politica-de-devolucion"
            className="block text-sm uppercase tracking-nav"
            onClick={() => setMenuOpen(false)}
          >
            Política de Devolución
          </Link>
          <Link
            href="/puntos-de-beneficio"
            className="block text-sm uppercase tracking-nav"
            onClick={() => setMenuOpen(false)}
          >
            Club Kaprichos
          </Link>
          <Link
            href={user ? '/cuenta' : '/cuenta/ingresar'}
            className="block text-sm uppercase tracking-nav"
            onClick={() => setMenuOpen(false)}
          >
            {user ? 'Mi cuenta' : 'Iniciar sesión'}
          </Link>
          {!user && (
            <Link
              href="/cuenta/registro"
              className="block text-sm uppercase tracking-nav"
              onClick={() => setMenuOpen(false)}
            >
              Crear cuenta
            </Link>
          )}
        </div>
      )}
    </header>
  )
}
