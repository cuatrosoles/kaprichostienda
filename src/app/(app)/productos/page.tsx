import Link from 'next/link'
import ProductCard from '@/components/store/ProductCard'
import { getStoreCategories, getStoreProducts } from '@/lib/storefront'

export default async function ProductosPage({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string; novedad?: string; oferta?: string; q?: string }>
}) {
  const params = await searchParams
  const [categories, products] = await Promise.all([
    getStoreCategories(),
    getStoreProducts(params),
  ])
  const current = categories.find((c) => c.slug === params.categoria)

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <p className="text-[11px] uppercase tracking-nav text-neutral-500">Inicio / Productos</p>
      <h1 className="mt-3 font-display text-4xl">
        {current?.title || (params.q ? `Resultados: ${params.q}` : 'Productos')}
      </h1>
      <div className="mt-6 flex flex-wrap gap-2">
        <Link href="/productos" className="border px-3 py-1 text-xs uppercase tracking-widest">
          Todos
        </Link>
        {categories.map((c) => (
          <Link
            key={c.slug}
            href={`/productos?categoria=${c.slug}`}
            className={`border px-3 py-1 text-xs uppercase tracking-widest ${params.categoria === c.slug ? 'bg-black text-white' : ''}`}
          >
            {c.title}
          </Link>
        ))}
      </div>
      <div className="mt-10 grid grid-cols-2 gap-6 md:grid-cols-3">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
      {products.length === 0 && <p className="mt-10 text-neutral-500">No hay productos para ese filtro.</p>}
    </div>
  )
}
