'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FormEvent, useMemo, useRef, useState } from 'react'
import { buildMegaMenu, type CatalogCategory } from '@/data/catalog'
import { useCart } from '@/context/CartContext'
import { useAuth } from '@/context/AuthContext'

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

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white">
      <div className="mx-auto grid max-w-6xl grid-cols-3 items-center px-4 py-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="md:hidden"
            aria-label="Menú"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <span className="block h-px w-5 bg-black" />
            <span className="mt-1.5 block h-px w-5 bg-black" />
            <span className="mt-1.5 block h-px w-5 bg-black" />
          </button>
          <form onSubmit={onSearch} className="hidden items-center gap-2 md:flex">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar"
              className="w-36 border-0 border-b border-neutral-400 bg-transparent py-1 text-sm outline-none focus:border-black"
            />
            <button type="submit" aria-label="Buscar" className="text-lg leading-none">
              ⌕
            </button>
          </form>
        </div>

        <Link href="/" className="justify-self-center">
          <img
            src="/logo-kaprichos.webp"
            alt="Kaprichos Tienda"
            className="h-16 w-16 rounded-full object-cover md:h-20 md:w-20"
          />
        </Link>

        <div className="flex items-center justify-self-end gap-4">
          <Link
            href={user ? '/cuenta' : '/cuenta/ingresar'}
            className="hidden text-[11px] uppercase tracking-nav md:inline hover:opacity-60"
          >
            {user ? 'Mi cuenta' : 'Ingresar'}
          </Link>
          <button
            type="button"
            onClick={openCart}
            className="text-xl"
            aria-label="Carrito"
          >
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
      </div>

      <nav className="hidden justify-center gap-8 pb-4 text-[11px] font-medium uppercase tracking-nav md:flex">
        <Link href="/" className="hover:opacity-60">
          Inicio
        </Link>
        <div className="relative" onMouseEnter={openMega} onMouseLeave={closeMega}>
          <Link href="/productos" className="inline-block hover:opacity-60">
            Productos
          </Link>
          {mega && (
            <div className="absolute left-1/2 top-full z-50 w-[720px] -translate-x-1/2 pt-4">
              <div className="border border-neutral-200 bg-white p-8 shadow-xl">
                <div className="grid grid-cols-4 gap-6 text-left">
                  {megaMenu.map((col) => (
                    <div key={col.title}>
                      <p className="mb-3 text-[10px] font-semibold text-kap-green">{col.title}</p>
                      <ul className="space-y-2 normal-case tracking-normal">
                        {col.links.map((l) => (
                          <li key={l.href}>
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
          )}
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
