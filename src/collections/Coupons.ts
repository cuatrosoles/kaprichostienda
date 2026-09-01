import type { CollectionConfig } from 'payload'

export const Coupons: CollectionConfig = {
  slug: 'coupons',
  labels: {
    singular: 'Cupón',
    plural: 'Cupones',
  },
  admin: {
    useAsTitle: 'code',
    group: 'Tienda',
    description: 'Códigos de descuento y envío gratis.',
    defaultColumns: ['code', 'type', 'value', 'active'],
  },
  access: { read: () => true },
  fields: [
    { name: 'code', type: 'text', required: true, unique: true, label: 'Código' },
    {
      name: 'type',
      type: 'select',
      required: true,
      label: 'Tipo',
      options: [
        { label: 'Porcentaje', value: 'percent' },
        { label: 'Envío gratis', value: 'shipping' },
      ],
    },
    { name: 'value', type: 'number', required: true, label: 'Valor' },
    { name: 'active', type: 'checkbox', defaultValue: true, label: 'Activo' },
    { name: 'label', type: 'text', label: 'Etiqueta visible' },
  ],
}
