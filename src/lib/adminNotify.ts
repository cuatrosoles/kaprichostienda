import type { Payload } from 'payload'
import type { Product, StoreSetting } from '@/payload-types'
import { formatARS } from '@/data/catalog'

export type AdminNotifyKind = 'sales' | 'registrations' | 'contact' | 'lowStock'

function escapeHtml(value: unknown) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function productTotalStock(doc: Pick<Product, 'stock' | 'variants'>) {
  const variants = doc.variants || []
  if (variants.length) {
    return variants.reduce((acc, v) => acc + Number(v.stock ?? 0), 0)
  }
  return Number(doc.stock ?? 0)
}

async function loadSettings(payload: Payload): Promise<StoreSetting | null> {
  try {
    return await payload.findGlobal({
      slug: 'store-settings',
      overrideAccess: true,
    })
  } catch {
    return null
  }
}

function shouldNotify(settings: StoreSetting | null, kind: AdminNotifyKind) {
  const to = settings?.adminEmail?.trim()
  if (!to || !to.includes('@')) return false
  if (kind === 'sales') return settings?.notifySales !== false
  if (kind === 'registrations') return settings?.notifyRegistrations !== false
  if (kind === 'contact') return settings?.notifyContact !== false
  return settings?.lowStockEnabled !== false
}

export async function notifyAdmin(
  payload: Payload,
  args: { kind: AdminNotifyKind; subject: string; html: string; text?: string; replyTo?: string },
): Promise<boolean> {
  try {
    const settings = await loadSettings(payload)
    if (!shouldNotify(settings, args.kind)) return false
    await payload.sendEmail({
      to: settings!.adminEmail!.trim(),
      subject: args.subject,
      html: args.html,
      text: args.text,
      ...(args.replyTo ? { replyTo: args.replyTo } : {}),
    })
    return true
  } catch (error) {
    console.error('[Kaprichos] No se pudo avisar al administrador:', error)
    return false
  }
}

export async function notifySale(payload: Payload, order: {
  id: number | string
  customerName?: string | null
  customerEmail?: string | null
  customerPhone?: string | null
  total?: number | null
  paymentStatus?: string | null
  items?: Array<{
    quantity?: number | null
    size?: string | null
    color?: string | null
    variantSku?: string | null
    priceAtPurchase?: number | null
    product?: number | { title?: string | null } | null
  }> | null
}) {
  const lines = (order.items || []).map((item) => {
    const title =
      item.product && typeof item.product === 'object' ? item.product.title || 'Producto' : 'Producto'
    const qty = Number(item.quantity || 0)
    const extra = [item.color, item.size, item.variantSku].filter(Boolean).join(' · ')
    return `<li>${escapeHtml(title)} × ${qty}${extra ? ` (${escapeHtml(extra)})` : ''}</li>`
  })

  const paid = order.paymentStatus === 'approved'
  await notifyAdmin(payload, {
    kind: 'sales',
    subject: paid
      ? `Venta cobrada #${order.id} — Kaprichos`
      : `Pedido pendiente #${order.id} — Kaprichos`,
    html: `
      <p>${paid ? 'Se cobró una venta en Kaprichos.' : 'Hay un pedido pendiente de pago en Kaprichos.'}</p>
      <p><strong>Pedido:</strong> #${escapeHtml(order.id)}<br/>
      <strong>Estado:</strong> ${escapeHtml(order.paymentStatus || '')}<br/>
      <strong>Cliente:</strong> ${escapeHtml(order.customerName)} (${escapeHtml(order.customerEmail)})<br/>
      <strong>Teléfono:</strong> ${escapeHtml(order.customerPhone)}<br/>
      <strong>Total:</strong> ${escapeHtml(formatARS(Number(order.total || 0)))}</p>
      <p><strong>Ítems</strong></p>
      <ul>${lines.join('') || '<li>Sin detalle</li>'}</ul>
    `,
  })
}

export async function notifyRegistration(payload: Payload, user: { email: string; name?: string; phone?: string }) {
  await notifyAdmin(payload, {
    kind: 'registrations',
    subject: `Nuevo cliente — ${user.email}`,
    html: `
      <p>Se registró un cliente en la tienda.</p>
      <p><strong>Nombre:</strong> ${escapeHtml(user.name)}<br/>
      <strong>Email:</strong> ${escapeHtml(user.email)}<br/>
      <strong>Teléfono:</strong> ${escapeHtml(user.phone)}</p>
    `,
  })
}

export async function notifyContact(
  payload: Payload,
  data: { name: string; email: string; phone?: string; message: string },
) {
  return notifyAdmin(payload, {
    kind: 'contact',
    subject: `Contacto web — ${data.name}`,
    replyTo: data.email,
    html: `
      <p>Nuevo mensaje desde el formulario de contacto.</p>
      <p><strong>Nombre:</strong> ${escapeHtml(data.name)}<br/>
      <strong>Email:</strong> ${escapeHtml(data.email)}<br/>
      <strong>Teléfono:</strong> ${escapeHtml(data.phone)}</p>
      <p>${escapeHtml(data.message).replace(/\n/g, '<br/>')}</p>
    `,
  })
}

export async function notifyLowStockIfCrossed(
  payload: Payload,
  previous: Pick<Product, 'stock' | 'variants'> | null | undefined,
  current: Product,
) {
  if (!previous) return
  const settings = await loadSettings(payload)
  if (!shouldNotify(settings, 'lowStock')) return
  const threshold = Math.max(0, Number(settings?.lowStockThreshold ?? 5))
  const before = productTotalStock(previous)
  const after = productTotalStock(current)
  if (before > threshold && after <= threshold) {
    await notifyAdmin(payload, {
      kind: 'lowStock',
      subject: `Stock bajo — ${current.title}`,
      html: `
        <p>Un producto llegó al mínimo de stock configurado (${threshold} unidades).</p>
        <p><strong>Producto:</strong> ${escapeHtml(current.title)}<br/>
        <strong>SKU:</strong> ${escapeHtml(current.sku)}<br/>
        <strong>Stock anterior:</strong> ${before}<br/>
        <strong>Stock actual:</strong> ${after}</p>
      `,
    })
  }
}
