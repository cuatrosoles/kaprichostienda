import Link from 'next/link'
import ProductCard from '@/components/store/ProductCard'
import { getStoreCategories, getStoreProducts } from '@/lib/storefront'

export default async function HomePage() {
  const [categories, news, featured] = await Promise.all([
    getStoreCategories(),
    getStoreProducts({ isNew: true }),
    getStoreProducts({ featured: true }),
  ])
  const homeCategories = categories.filter((c) => c.showOnHome !== false)
  const showcase = news.length ? news : featured

  return (
    <>
      <section className="relative bg-black text-white">
        <div className="relative h-[calc(100svh-8.75rem)] min-h-[28rem] md:h-[calc(100svh-12rem)]">
          <img
            src="/catalog/hero-temporada.jpg"
            alt="Nueva temporada Kaprichos"
            className="absolute inset-0 h-full w-full object-cover object-[center_top]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/15 to-black/10" />
          <div className="relative z-10 mx-auto flex h-full max-w-6xl flex-col justify-end px-6 pb-12 md:pb-16">
            <p className="font-script text-6xl md:text-8xl">Nueva</p>
            <h1 className="font-display text-5xl uppercase tracking-wide text-kap-tan md:text-7xl">Temporada</h1>
            <div className="mt-8 flex flex-wrap gap-3">
              <div className="bg-black/80 px-4 py-3 text-[11px] uppercase tracking-nav text-kap-tan">
                3 cuotas sin interés
              </div>
              <div className="bg-black/80 px-4 py-3 text-[11px] uppercase tracking-nav text-kap-tan">
                20% OFF efectivo o transferencia
              </div>
            </div>
          </div>
        </div>
      </section>

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
        {homeCategories.length === 0 ? (
          <p className="text-center text-sm text-neutral-500">
            Todavía no hay categorías publicadas. Cargalas desde el panel de administración.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-5 md:grid-cols-3">
            {homeCategories.map((c) => (
              <Link key={c.slug} href={`/productos?categoria=${c.slug}`} className="group">
                <img src={c.image} alt={c.title} className="aspect-[4/5] w-full rounded-md object-cover" />
                <h2 className="mt-3 text-center text-sm font-semibold">{c.title}</h2>
              </Link>
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
        {showcase.length === 0 ? (
          <p className="text-sm text-neutral-500">No hay productos publicados todavía.</p>
        ) : (
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {showcase.map((p) => (
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
