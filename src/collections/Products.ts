import type { CollectionConfig } from 'payload'

export const Products: CollectionConfig = {
  slug: 'products',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'price', 'category', 'status'],
  },
  access: {
    read: () => true,
  },
  fields: [
    { name: 'title', type: 'text', required: true, label: 'Nombre del Producto' },
    { name: 'slug', type: 'text', required: true, unique: true },
    { name: 'description', type: 'textarea', label: 'Descripción' },
    { name: 'price', type: 'number', required: true, label: 'Precio (ARS)' },
    { name: 'category', type: 'relationship', relationTo: 'categories' },
    { name: 'imageUrl', type: 'text', label: 'Imagen principal (demo / CDN)' },
    {
      name: 'images',
      type: 'upload',
      relationTo: 'media',
      hasMany: true,
      label: 'Fotos del Producto',
    },
    { name: 'isNew', type: 'checkbox', defaultValue: false, label: 'Nuevo ingreso' },
    { name: 'onSale', type: 'checkbox', defaultValue: false, label: 'Oferta' },
    { name: 'featured', type: 'checkbox', defaultValue: false, label: 'Destacado' },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'published',
      options: [
        { label: 'Borrador', value: 'draft' },
        { label: 'Publicado', value: 'published' },
      ],
      required: true,
    },
    { name: 'weight', type: 'number', required: true, defaultValue: 400, label: 'Peso en gramos' },
    {
      name: 'variants',
      type: 'array',
      label: 'Variantes (talle y color)',
      fields: [
        { name: 'sku', type: 'text', required: true },
        { name: 'size', type: 'text', required: true, label: 'Talle' },
        { name: 'color', type: 'text', required: true, label: 'Color' },
        { name: 'colorHex', type: 'text', label: 'Hex' },
        { name: 'stock', type: 'number', required: true, min: 0, defaultValue: 0 },
      ],
    },
    { name: 'stock', type: 'number', min: 0, label: 'Stock general (si no hay variantes)' },
  ],
}
