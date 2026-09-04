import { POINT_VALUE_ARS, POINTS_PER_THOUSAND } from '@/data/catalog'

export default function ClubPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <p className="text-[11px] uppercase tracking-nav text-neutral-500">Inicio / Club Kaprichos</p>
      <h1 className="mt-3 font-display text-5xl">Puntos de beneficio</h1>
      <div className="mt-8 space-y-4 text-sm leading-7 text-neutral-700">
        <p>
          En cada compra aprobada sumás {POINTS_PER_THOUSAND} punto cada $1.000. Cada punto equivale a $
          {POINT_VALUE_ARS}.
        </p>
        <p>
          En el checkout ingresá el mismo email de siempre: vemos tu saldo y podés canjear puntos (mínimo 100) para
          descontar el total.
        </p>
        <p>Los puntos no se combinan con envío gratis en la misma orden si el cupón ya cubre el 100% del envío.</p>
      </div>
    </div>
  )
}
