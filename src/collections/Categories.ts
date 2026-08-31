import type { CollectionConfig } from 'payload'

export const Categories: CollectionConfig = {
  slug: 'categories',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'menuGroup', 'sort'],
  },
  access: { read: () => true },
  fields: [
    { name: 'title', type: 'text', required: true, label: 'Nombre' },
    { name: 'slug', type: 'text', required: true, unique: true, label: 'Slug (URL)' },
    { name: 'imageUrl', type: 'text', label: 'Imagen (URL o /catalog/...)' },
    { name: 'description', type: 'textarea', label: 'Descripción' },
    {
      name: 'menuGroup',
      type: 'select',
      label: 'Columna del mega menú',
      options: [
        { label: 'Destacados', value: 'destacados' },
        { label: 'Remeras y camisas', value: 'remeras' },
        { label: 'Abrigo', value: 'abrigo' },
        { label: 'Total look', value: 'total' },
      ],
    },
    { name: 'sort', type: 'number', defaultValue: 0, label: 'Orden' },
    { name: 'showOnHome', type: 'checkbox', defaultValue: true, label: 'Mostrar en inicio' },
  ],
}
