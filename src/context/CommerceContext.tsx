'use client'

import { createContext, useContext, type ReactNode } from 'react'
import type { PublicCommerce } from '@/lib/storeCommerce'
import { localFulfillmentOptions } from '@/lib/fulfillment'

export const FALLBACK_COMMERCE: PublicCommerce = {
  cashDiscountPercent: 20,
  mpEnabled: true,
  transferEnabled: true,
  mpLabel: 'Mercado Pago · 3 cuotas sin interés',
  transferLabel: 'Transferencia / efectivo · 20% OFF',
  transferBank: '',
  transferHolder: '',
  transferCbu: '',
  transferAlias: '',
  transferInstructions: '',
  fulfillmentOptions: localFulfillmentOptions(),
}

const CommerceContext = createContext<PublicCommerce>(FALLBACK_COMMERCE)

export function CommerceProvider({
  children,
  value,
}: {
  children: ReactNode
  value?: PublicCommerce | null
}) {
  return <CommerceContext.Provider value={value || FALLBACK_COMMERCE}>{children}</CommerceContext.Provider>
}

export function useCommerce() {
  return useContext(CommerceContext)
}

export function useCashDiscountRate() {
  const { cashDiscountPercent } = useCommerce()
  return Math.min(90, Math.max(0, cashDiscountPercent)) / 100
}
