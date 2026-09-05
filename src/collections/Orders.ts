import type { CollectionConfig } from 'payload'

export const Orders: CollectionConfig = {
  slug: 'orders',
  labels: {
    singular: 'Pedido',
    plural: 'Pedidos',
  },
  admin: {
    useAsTitle: 'id',
    group: 'Tienda',
    defaultColumns: ['id', 'customerName', 'total', 'paymentStatus', 'createdAt'],
    description: 'Pedidos de la tienda y estado de pago.',
  },
  access: {
    create: () => true,
    read: ({ req: { user } }) => {
      if (!user) return false
      if (user.collection === 'users') return true
      if (user.collection === 'customers') {
        return { customerEmail: { equals: user.email } }
      }
      return false
    },
  },
  hooks: {
    afterChange: [
      async ({ doc, previousDoc, req, operation }) => {
        if (operation !== 'update') return
        if (doc.paymentStatus !== 'approved' || previousDoc?.paymentStatus === 'approved') return
        const { notifySale } = await import('@/lib/adminNotify')
        const full = await req.payload.findByID({
          collection: 'orders',
          id: doc.id,
          depth: 1,
          overrideAccess: true,
          req,
        })
        await notifySale(req.payload, full)
      },
    ],
  },
  fields: [
    {
      name: 'paymentStatus',
      type: 'select',
      defaultValue: 'pending',
      label: 'Estado de pago',
      options: [
        { label: 'Pendiente de pago', value: 'pending' },
        { label: 'Aprobado', value: 'approved' },
        { label: 'Rechazado / Cancelado', value: 'rejected' },
      ],
      required: true,
      admin: { readOnly: true },
    },
    { name: 'customerName', type: 'text', required: true, label: 'Nombre del cliente' },
    { name: 'customerEmail', type: 'email', required: true, label: 'Email de contacto' },
    { name: 'customerPhone', type: 'text', required: true, label: 'Teléfono' },
    {
      name: 'shippingAddress',
      type: 'group',
      label: 'Dirección de entrega (Argentina)',
      fields: [
        { name: 'street', type: 'text', required: true, label: 'Calle y número' },
        { name: 'floorAppart', type: 'text', label: 'Piso / departamento (opcional)' },
        { name: 'city', type: 'text', required: true, label: 'Localidad / ciudad' },
        { name: 'province', type: 'text', required: true, label: 'Provincia' },
        { name: 'zipCode', type: 'text', required: true, label: 'Código postal' },
      ],
    },
    {
      name: 'items',
      type: 'array',
      labels: { singular: 'Ítem', plural: 'Ítems' },
      label: 'Productos comprados',
      fields: [
        { name: 'product', type: 'relationship', relationTo: 'products', label: 'Producto' },
        { name: 'quantity', type: 'number', required: true, label: 'Cantidad' },
        { name: 'priceAtPurchase', type: 'number', required: true, label: 'Precio unitario al comprar' },
        { name: 'variantSku', type: 'text', label: 'SKU de la variante' },
        { name: 'size', type: 'text', label: 'Talle' },
        { name: 'color', type: 'text', label: 'Color' },
      ],
    },
    { name: 'shippingMethod', type: 'text', label: 'Opción de envío o retiro' },
    { name: 'shippingCost', type: 'number', required: true, label: 'Costo de envío abonado' },
    { name: 'discount', type: 'number', defaultValue: 0, label: 'Descuento (cupón / puntos)' },
    { name: 'couponCode', type: 'text', label: 'Cupón aplicado' },
    { name: 'loyaltyPointsUsed', type: 'number', defaultValue: 0, label: 'Puntos utilizados' },
    { name: 'total', type: 'number', required: true, label: 'Total del pedido' },
    { name: 'mpPreferenceId', type: 'text', label: 'ID de preferencia Mercado Pago', admin: { position: 'sidebar' } },
    { name: 'mpPaymentId', type: 'text', label: 'ID de transacción Mercado Pago', admin: { position: 'sidebar' } },
    { name: 'trackingNumber', type: 'text', label: 'Número de seguimiento logístico', admin: { position: 'sidebar' } },
  ],
}
