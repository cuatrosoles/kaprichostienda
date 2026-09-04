import type { StoreSetting } from '@/payload-types'

export type PublicCommerce = {
  cashDiscountPercent: number
  mpEnabled: boolean
  transferEnabled: boolean
  mpLabel: string
  transferLabel: string
  transferBank: string
  transferHolder: string
  transferCbu: string
  transferAlias: string
  transferInstructions: string
}

const DEFAULT_MP_LABEL = 'Mercado Pago · 3 cuotas sin interés'
const DEFAULT_TRANSFER_LABEL = 'Transferencia / efectivo'

export function cashDiscountPercent(settings?: StoreSetting | null) {
  const raw = Number(settings?.cashDiscountPercent ?? 20)
  if (Number.isNaN(raw)) return 20
  return Math.min(90, Math.max(0, raw))
}

export function cashDiscountRate(settings?: StoreSetting | null) {
  return cashDiscountPercent(settings) / 100
}

export function isPlaceholderSecret(value?: string | null) {
  const token = String(value || '').trim()
  return !token || token.includes('XXXXXX')
}

export function mpAccessToken(settings?: StoreSetting | null) {
  const fromSettings = String(settings?.mpAccessToken || '').trim()
  const fromEnv = String(process.env.MERCADOPAGO_ACCESS_TOKEN || '').trim()
  const token = fromSettings || fromEnv
  return isPlaceholderSecret(token) ? '' : token
}

export function storefrontUrl(settings?: StoreSetting | null) {
  return String(settings?.paymentsSiteUrl || process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000').replace(
    /\/$/,
    '',
  )
}

export function paymentsWebhookBase(settings?: StoreSetting | null) {
  return String(settings?.paymentsWebhookUrl || process.env.NEXT_PUBLIC_WEBHOOK_URL || storefrontUrl(settings)).replace(
    /\/$/,
    '',
  )
}

export function getPublicCommerce(settings?: StoreSetting | null): PublicCommerce {
  const percent = cashDiscountPercent(settings)
  return {
    cashDiscountPercent: percent,
    mpEnabled: settings?.mpEnabled !== false,
    transferEnabled: settings?.transferEnabled !== false,
    mpLabel: String(settings?.mpLabel || DEFAULT_MP_LABEL).trim() || DEFAULT_MP_LABEL,
    transferLabel:
      String(settings?.transferLabel || `${DEFAULT_TRANSFER_LABEL} · ${percent}% OFF`).trim() ||
      `${DEFAULT_TRANSFER_LABEL} · ${percent}% OFF`,
    transferBank: String(settings?.transferBank || '').trim(),
    transferHolder: String(settings?.transferHolder || '').trim(),
    transferCbu: String(settings?.transferCbu || '').trim(),
    transferAlias: String(settings?.transferAlias || '').trim(),
    transferInstructions: String(settings?.transferInstructions || '').trim(),
  }
}

export function transferDetails(settings?: StoreSetting | null) {
  const pub = getPublicCommerce(settings)
  return {
    bank: pub.transferBank,
    holder: pub.transferHolder,
    cbu: pub.transferCbu,
    alias: pub.transferAlias,
    instructions: pub.transferInstructions,
  }
}
