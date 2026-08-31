import type { CollectionConfig } from 'payload'

export const Coupons: CollectionConfig = {
  slug: 'coupons',
  admin: { useAsTitle: 'code' },
  access: { read: () => true },
  fields: [
    { name: 'code', type: 'text', required: true, unique: true, label: 'Código' },
    {
      name: 'type',
      type: 'select',
      required: true,
      options: [
        { label: 'Porcentaje', value: 'percent' },
        { label: 'Envío gratis', value: 'shipping' },
      ],
    },
    { name: 'value', type: 'number', required: true, label: 'Valor' },
    { name: 'active', type: 'checkbox', defaultValue: true },
    { name: 'label', type: 'text' },
  ],
}
