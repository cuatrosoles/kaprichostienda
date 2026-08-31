import type { CollectionConfig } from 'payload'

export const Orders: CollectionConfig = {
  slug: 'orders',
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['id', 'customerName', 'total', 'paymentStatus', 'createdAt'],
  },
  access: {
    create: () => true,
    read: ({ req: { user } }) => Boolean(user),
  },
  fields: [
    {
      name: 'paymentStatus',
      type: 'select',
      defaultValue: 'pending',
      options: [
        { label: 'Pendiente de Pago', value: 'pending' },
        { label: 'Aprobado', value: 'approved' },
        { label: 'Rechazado / Cancelado', value: 'rejected' },
      ],
      required: true,
      admin: { readOnly: true },
    },
    { name: 'customerName', type: 'text', required: true, label: 'Nombre del Cliente' },
    { name: 'customerEmail', type: 'email', required: true, label: 'Email de Contacto' },
    { name: 'customerPhone', type: 'text', required: true, label: 'Teléfono' },
    {
      name: 'shippingAddress',
      type: 'group',
      label: 'Dirección de Entrega (Argentina)',
      fields: [
        { name: 'street', type: 'text', required: true, label: 'Calle y Número' },
        { name: 'floorAppart', type: 'text', label: 'Piso / Departamento (Opcional)' },
        { name: 'city', type: 'text', required: true, label: 'Localidad / Ciudad' },
        { name: 'province', type: 'text', required: true, label: 'Provincia' },
        { name: 'zipCode', type: 'text', required: true, label: 'Código Postal' },
      ],
    },
    {
      name: 'items',
      type: 'array',
      label: 'Productos Comprados',
      fields: [
        { name: 'product', type: 'relationship', relationTo: 'products', required: true },
        { name: 'quantity', type: 'number', required: true },
        { name: 'priceAtPurchase', type: 'number', required: true, label: 'Precio Unitario Congelado' },
      ],
    },
    { name: 'shippingCost', type: 'number', required: true, label: 'Costo de Envío Abonado' },
    { name: 'total', type: 'number', required: true, label: 'Total General de la Orden' },
    { name: 'mpPreferenceId', type: 'text', label: 'ID Preferencia Mercado Pago', admin: { position: 'sidebar' } },
    { name: 'mpPaymentId', type: 'text', label: 'ID Transacción Mercado Pago', admin: { position: 'sidebar' } },
    { name: 'trackingNumber', type: 'text', label: 'Número de Tracking Logístico', admin: { position: 'sidebar' } },
  ],
}
