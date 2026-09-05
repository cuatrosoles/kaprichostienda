import Link from 'next/link'
import ProductCard from '@/components/store/ProductCard'
import HeroSlider from '@/components/store/HeroSlider'
import { getHomeHero, getStoreProducts } from '@/lib/storefront'

export default async function HomePage() {
  const products = await getStoreProducts()
  const hero = await getHomeHero()
  const featured = products.filter((p) => p.featured)
  const news = products.filter((p) => p.isNew)

  return (
    <>
      <HeroSlider hero={hero} />

      <section className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-4 py-12 text-center text-sm md:grid-cols-4">
        <div>
          <p className="text-2xl">🚚</p>
          <p className="mt-2 font-medium">Envíos a todo el país</p>
        </div>
        <div>
          <p className="text-2xl">💳</p>
          <p className="mt-2 font-medium">Elegí cómo querés pagar</p>
        </div>
        <div>
          <p className="text-2xl">🔒</p>
          <p className="mt-2 font-medium">Sitio seguro</p>
        </div>
        <div>
          <p className="text-2xl">💬</p>
          <p className="mt-2 font-medium">Contactanos</p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="font-display text-3xl">Destacados</h2>
          <Link href="/productos" className="text-xs uppercase tracking-nav">
            Ver todo
          </Link>
        </div>
        {featured.length === 0 ? (
          <p className="text-sm text-neutral-500">Todavía no hay productos destacados.</p>
        ) : (
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="font-display text-3xl">Nuevos ingresos</h2>
          <Link href="/productos?novedad=1" className="text-xs uppercase tracking-nav">
            Ver todo
          </Link>
        </div>
        {news.length === 0 ? (
          <p className="text-sm text-neutral-500">Todavía no hay nuevos ingresos.</p>
        ) : (
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {news.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>

      <section className="bg-[#5f6f6a] px-4 py-16 text-center text-white">
        <h2 className="font-display text-4xl">Club Kaprichos</h2>
        <p className="mx-auto mt-3 max-w-xl text-sm text-white/90">
          Sumá 1 punto cada $1.000. Canjeá 100 puntos por $1.000 en tu próxima compra. Ingresá tu email en el checkout.
        </p>
        <Link href="/puntos-de-beneficio" className="mt-6 inline-block border border-white px-6 py-3 text-xs uppercase tracking-nav">
          Conocer beneficios
        </Link>
      </section>
    </>
  )
}
