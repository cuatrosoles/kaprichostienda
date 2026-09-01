import type { CollectionConfig } from 'payload'

export const Products: CollectionConfig = {
  slug: 'products',
  labels: {
    singular: 'Producto',
    plural: 'Productos',
  },
  admin: {
    useAsTitle: 'title',
    group: 'Tienda',
    defaultColumns: ['title', 'price', 'category', 'status'],
    description: 'Catálogo de indumentaria con variantes de talle y color.',
  },
  access: {
    read: () => true,
  },
  fields: [
    { name: 'title', type: 'text', required: true, label: 'Nombre del producto' },
    { name: 'slug', type: 'text', required: true, unique: true, label: 'Slug (URL)' },
    { name: 'description', type: 'textarea', label: 'Descripción' },
    { name: 'price', type: 'number', required: true, label: 'Precio (ARS)' },
    { name: 'category', type: 'relationship', relationTo: 'categories', label: 'Categoría' },
    { name: 'imageUrl', type: 'text', label: 'Imagen principal (URL o /catalog/...)' },
    {
      name: 'images',
      type: 'upload',
      relationTo: 'media',
      hasMany: true,
      label: 'Fotos del producto',
    },
    { name: 'isNew', type: 'checkbox', defaultValue: false, label: 'Nuevo ingreso' },
    { name: 'onSale', type: 'checkbox', defaultValue: false, label: 'Oferta' },
    { name: 'featured', type: 'checkbox', defaultValue: false, label: 'Destacado' },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'published',
      label: 'Estado',
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
      labels: { singular: 'Variante', plural: 'Variantes' },
      label: 'Variantes (talle y color)',
      fields: [
        { name: 'sku', type: 'text', required: true, label: 'SKU' },
        { name: 'size', type: 'text', required: true, label: 'Talle' },
        { name: 'color', type: 'text', required: true, label: 'Color' },
        { name: 'colorHex', type: 'text', label: 'Color hexadecimal' },
        { name: 'stock', type: 'number', required: true, min: 0, defaultValue: 0, label: 'Stock' },
      ],
    },
    { name: 'stock', type: 'number', min: 0, label: 'Stock general (si no hay variantes)' },
  ],
}
