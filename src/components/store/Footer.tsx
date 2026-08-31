import Link from 'next/link'
import type { CatalogCategory } from '@/data/catalog'

export default function Footer({ categories }: { categories: CatalogCategory[] }) {
  return (
    <footer className="mt-16 border-t bg-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 md:grid-cols-4">
        <div>
          <img src="/logo-kaprichos.webp" alt="Kaprichos" className="h-16 w-16 rounded-full object-cover" />
          <div className="mt-4 flex gap-3 text-sm">
            <a href="https://instagram.com" target="_blank" rel="noreferrer">
              Instagram
            </a>
            <a href="https://facebook.com" target="_blank" rel="noreferrer">
              Facebook
            </a>
          </div>
        </div>
        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-nav">Categorías</h3>
          <ul className="space-y-2 text-sm text-neutral-600">
            {categories.slice(0, 7).map((c) => (
              <li key={c.slug}>
                <Link href={`/productos?categoria=${c.slug}`}>{c.title}</Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-nav">Contactanos</h3>
          <ul className="space-y-2 text-sm text-neutral-600">
            <li>WhatsApp: +54 11 5555-0101</li>
            <li>info@kaprichos.com.ar</li>
            <li>Buenos Aires, Argentina</li>
            <li>
              <Link href="/contacto">Escribinos</Link>
            </li>
          </ul>
        </div>
        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-nav">Newsletter</h3>
          <p className="mb-3 text-sm text-neutral-600">Enterate de nuevos ingresos y cupones.</p>
          <p className="mb-4 text-sm">
            <Link href="/cuenta/ingresar" className="underline">
              Iniciar sesión
            </Link>
            {' | '}
            <Link href="/cuenta/registro" className="underline">
              Crear cuenta
            </Link>
          </p>
          <form action="/api/newsletter" method="post" className="flex border-b border-black">
            <input name="email" type="email" required placeholder="Email" className="flex-1 py-2 text-sm outline-none" />
            <button type="submit" className="px-2 text-lg">
              +
            </button>
          </form>
        </div>
      </div>
      <div className="border-t px-4 py-6 text-center text-[11px] text-neutral-500">
        <p className="mb-2">Visa · Mastercard · American Express · Mercado Pago · Cabal · Naranja · Correo Argentino</p>
        <p>Copyright Kaprichos Tienda. Todos los derechos reservados.</p>
        <p className="mt-2">
          <a href="https://www.argentina.gob.ar/produccion/defensadelconsumidor" className="underline">
            Defensa de las y los consumidores
          </a>
          {' · '}
          <Link href="/politica-de-devolucion" className="underline">
            Botón de arrepentimiento
          </Link>
        </p>
      </div>
    </footer>
  )
}
