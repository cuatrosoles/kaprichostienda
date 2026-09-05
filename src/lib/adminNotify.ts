import type { Payload } from 'payload'
import type { Product, StoreSetting } from '@/payload-types'
import { formatARS } from '@/data/catalog'
import { escapeEmailHtml, renderStoreEmail, storePublicUrl } from '@/email/storeEmailTemplate'

export type AdminNotifyKind = 'sales' | 'registrations' | 'contact' | 'lowStock'

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
  const paid = order.paymentStatus === 'approved'
  const lines = (order.items || [])
    .map((item) => {
      const title =
        item.product && typeof item.product === 'object' ? item.product.title || 'Producto' : 'Producto'
      const qty = Number(item.quantity || 0)
      const extra = [item.color, item.size, item.variantSku].filter(Boolean).join(' · ')
      const price = formatARS(Number(item.priceAtPurchase || 0) * qty)
      return `<tr>
        <td style="padding:10px 0;border-bottom:1px solid #ece7df;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#0b0b0b;">
          <strong>${escapeEmailHtml(title)}</strong>${extra ? `<br/><span style="color:#6b6358;font-size:12px;">${escapeEmailHtml(extra)}</span>` : ''}
        </td>
        <td style="padding:10px 0;border-bottom:1px solid #ece7df;text-align:right;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#6b6358;white-space:nowrap;">
          × ${qty}
        </td>
        <td style="padding:10px 0;border-bottom:1px solid #ece7df;text-align:right;font-family:Georgia,'Times New Roman',serif;font-size:14px;color:#0b0b0b;white-space:nowrap;">
          ${escapeEmailHtml(price)}
        </td>
      </tr>`
    })
    .join('')

  const email = renderStoreEmail({
    preheader: paid ? `Venta cobrada #${order.id}` : `Pedido pendiente #${order.id}`,
    eyebrow: paid ? 'Venta cobrada' : 'Pedido pendiente',
    title: paid ? 'Se acreditó un pago' : 'Hay un pedido nuevo',
    intro: paid
      ? 'Un cliente completó el pago en la tienda. Revisá el detalle para preparar el envío.'
      : 'Un cliente generó un pedido que todavía figura pendiente de pago.',
    fields: [
      { label: 'Pedido', value: `#${order.id}` },
      { label: 'Estado', value: order.paymentStatus || '' },
      { label: 'Cliente', value: order.customerName || '' },
      { label: 'Email', value: order.customerEmail || '' },
      { label: 'Teléfono', value: order.customerPhone || '' },
      { label: 'Total', value: formatARS(Number(order.total || 0)) },
    ],
    bodyHtml: `
      <p style="margin:0 0 10px 0;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#6b6358;">Ítems del pedido</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${lines || '<tr><td>Sin detalle</td></tr>'}</table>
    `,
    cta: {
      href: `${storePublicUrl()}/admin/collections/orders/${order.id}`,
      label: 'Ver pedido en el panel',
    },
  })

  await notifyAdmin(payload, {
    kind: 'sales',
    subject: paid ? `Venta cobrada #${order.id} — Kaprichos` : `Pedido pendiente #${order.id} — Kaprichos`,
    html: email.html,
    text: email.text,
  })
}

export async function notifyRegistration(payload: Payload, user: { email: string; name?: string; phone?: string }) {
  const email = renderStoreEmail({
    preheader: `Nuevo cliente: ${user.name || user.email}`,
    eyebrow: 'Nuevo cliente',
    title: 'Se registró una cuenta',
    intro: 'Alguien creó una cuenta en Kaprichos. Estos son los datos que dejó en el formulario.',
    fields: [
      { label: 'Nombre', value: user.name || '' },
      { label: 'Email', value: user.email },
      { label: 'Teléfono', value: user.phone || '' },
    ],
    cta: {
      href: `${storePublicUrl()}/admin/collections/customers`,
      label: 'Ver clientes',
    },
  })

  await notifyAdmin(payload, {
    kind: 'registrations',
    subject: `Nuevo cliente — ${user.email}`,
    html: email.html,
    text: email.text,
  })
}

export async function notifyContact(
  payload: Payload,
  data: { name: string; email: string; phone?: string; message: string },
) {
  const email = renderStoreEmail({
    preheader: `Mensaje de ${data.name}`,
    eyebrow: 'Contacto web',
    title: 'Nuevo mensaje de un cliente',
    intro: 'Llegó una consulta desde el formulario de contacto de la tienda.',
    fields: [
      { label: 'Nombre', value: data.name },
      { label: 'Email', value: data.email },
      { label: 'Teléfono', value: data.phone || '' },
    ],
    bodyHtml: `
      <p style="margin:0 0 8px 0;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#6b6358;">Mensaje</p>
      <p style="margin:0;padding:16px 18px;background:#f7f4ef;border-left:3px solid #c4a574;border-radius:0 8px 8px 0;color:#0b0b0b;">
        ${escapeEmailHtml(data.message).replace(/\n/g, '<br/>')}
      </p>
    `,
    footerNote: 'Podés responder este correo para escribirle directo al cliente.',
  })

  return notifyAdmin(payload, {
    kind: 'contact',
    subject: `Contacto web — ${data.name}`,
    replyTo: data.email,
    html: email.html,
    text: email.text,
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
    const email = renderStoreEmail({
      preheader: `Stock bajo: ${current.title}`,
      eyebrow: 'Alerta de stock',
      title: 'Un producto llegó al mínimo',
      intro: `El stock de este producto cruzó el umbral configurado de ${threshold} unidades.`,
      fields: [
        { label: 'Producto', value: current.title },
        { label: 'SKU', value: current.sku || '' },
        { label: 'Stock anterior', value: String(before) },
        { label: 'Stock actual', value: String(after) },
      ],
      cta: {
        href: `${storePublicUrl()}/admin/collections/products/${current.id}`,
        label: 'Abrir producto',
      },
    })

    await notifyAdmin(payload, {
      kind: 'lowStock',
      subject: `Stock bajo — ${current.title}`,
      html: email.html,
      text: email.text,
    })
  }
}
