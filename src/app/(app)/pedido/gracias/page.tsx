import { Suspense } from 'react'
import OrderReturnView from '@/components/store/OrderReturnView'

export default function PedidoGraciasPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-xl px-4 py-20 text-sm text-neutral-500">Cargando…</div>}>
      <OrderReturnView />
    </Suspense>
  )
}
