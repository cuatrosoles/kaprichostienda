import Link from 'next/link'
import ProductCard from '@/components/store/ProductCard'
import { childCategories, topLevelCategories } from '@/data/catalog'
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
  const parents = topLevelCategories(categories)
  const activeParentSlug = current?.parentSlug || current?.slug
  const siblings = activeParentSlug ? childCategories(categories, activeParentSlug) : []

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <p className="text-[11px] uppercase tracking-nav text-neutral-500">
        Inicio / Productos
        {current ? ` / ${current.parentSlug ? categories.find((c) => c.slug === current.parentSlug)?.title : current.title}` : ''}
        {current?.parentSlug ? ` / ${current.title}` : ''}
      </p>
      <h1 className="mt-3 font-display text-4xl">
        {current?.title || (params.q ? `Resultados: ${params.q}` : 'Productos')}
      </h1>
      <div className="mt-6 flex flex-wrap gap-2">
        <Link href="/productos" className="border px-3 py-1 text-xs uppercase tracking-widest">
          Todos
        </Link>
        {parents.map((c) => (
          <Link
            key={c.slug}
            href={`/productos?categoria=${c.slug}`}
            className={`border px-3 py-1 text-xs uppercase tracking-widest ${activeParentSlug === c.slug ? 'bg-black text-white' : ''}`}
          >
            {c.title}
          </Link>
        ))}
      </div>
      {siblings.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {siblings.map((c) => (
            <Link
              key={c.slug}
              href={`/productos?categoria=${c.slug}`}
              className={`px-3 py-1 font-display text-sm italic ${params.categoria === c.slug ? 'text-black underline' : 'text-[#c45c26]'}`}
            >
              {c.title}
            </Link>
          ))}
        </div>
      )}
      <div className="mt-10 grid grid-cols-2 gap-6 md:grid-cols-3">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
      {products.length === 0 && <p className="mt-10 text-neutral-500">No hay productos para ese filtro.</p>}
    </div>
  )
}
