import { getPayload } from 'payload'
import config from '@payload-config'

export default async function HomePage() {
  const payload = await getPayload({ config })
  const products = await payload.find({
    collection: 'products',
    where: {
      status: { equals: 'published' },
    },
    limit: 24,
  })

  return (
    <main className="mx-auto max-w-6xl p-4">
      <h1 className="mb-6 text-3xl font-bold tracking-tight">Catálogo</h1>
      {products.docs.length === 0 ? (
        <p className="text-gray-500">Aún no hay productos publicados.</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
          {products.docs.map((product) => (
            <article key={product.id} className="rounded-lg border bg-white p-4 shadow-sm">
              <h2 className="text-lg font-semibold">{product.title}</h2>
              <p className="mt-2 text-gray-700">
                ${Number(product.price).toLocaleString('es-AR')}
              </p>
            </article>
          ))}
        </div>
      )}
    </main>
  )
}
