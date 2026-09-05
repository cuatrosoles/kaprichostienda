import type { CollectionConfig } from 'payload'

export const Categories: CollectionConfig = {
  slug: 'categories',
  labels: {
    singular: 'Categoría',
    plural: 'Categorías',
  },
  admin: {
    useAsTitle: 'title',
    group: 'Tienda',
    defaultColumns: ['title', 'slug', 'parent', 'sort'],
    description: 'Categorías (Mujer, Hombre…) y subcategorías (Pantalones, Remeras…).',
  },
  access: { read: () => true },
  fields: [
    { name: 'title', type: 'text', required: true, label: 'Nombre' },
    { name: 'slug', type: 'text', required: true, unique: true, label: 'Slug (URL)' },
    {
      name: 'parent',
      type: 'relationship',
      relationTo: 'categories',
      label: 'Categoría padre',
      admin: {
        description: 'Vacío = categoría principal (Mujer, Hombre, Ofertas…). Si es subcategoría, elegí el padre.',
      },
      filterOptions: ({ id }) => ({
        parent: { exists: false },
        ...(id ? { id: { not_equals: id } } : {}),
      }),
    },
    { name: 'imageUrl', type: 'text', label: 'Imagen (URL pública)' },
    { name: 'description', type: 'textarea', label: 'Descripción' },
    {
      name: 'menuGroup',
      type: 'select',
      label: 'Columna del mega menú (legado)',
      admin: { hidden: true },
      options: [
        { label: 'Destacados', value: 'destacados' },
        { label: 'Remeras y camisas', value: 'remeras' },
        { label: 'Abrigo', value: 'abrigo' },
        { label: 'Total look', value: 'total' },
      ],
    },
    { name: 'sort', type: 'number', defaultValue: 0, label: 'Orden' },
    {
      name: 'showOnHome',
      type: 'checkbox',
      defaultValue: true,
      label: 'Mostrar en inicio',
      admin: {
        description: 'Solo tiene sentido en categorías principales.',
      },
    },
  ],
}
