import { redirect } from 'next/navigation'
import CarritoView from '@/components/CarritoView'

export default async function CarritoPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const status = String(params.collection_status || params.status || '')
  if (['success', 'approved', 'pending', 'failure', 'rejected'].includes(status)) {
    const query = new URLSearchParams()
    for (const [key, value] of Object.entries(params)) {
      const text = Array.isArray(value) ? value[0] : value
      if (text) query.set(key, text)
    }
    redirect(`/pedido/gracias?${query.toString()}`)
  }

  return <CarritoView />
}
