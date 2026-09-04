import type { CollectionConfig, Where } from 'payload'
import { assignVariantSkus, skuFromTitle, slugifyTitle } from '@/lib/productMeta'

export const Products: CollectionConfig = {
  slug: 'products',
  labels: {
    singular: 'Producto',
    plural: 'Productos',
  },
  admin: {
    useAsTitle: 'title',
    group: 'Tienda',
    defaultColumns: ['title', 'sku', 'category', 'status'],
    description: 'Catálogo de indumentaria con variantes de talle y color.',
  },
  access: {
    read: () => true,
  },
  hooks: {
    beforeValidate: [
      async ({ data, req, originalDoc }) => {
        if (!data) return data
        const title = String(data.title || originalDoc?.title || '')
        if (title) {
          const slugBase = slugifyTitle(title)
          const slugHit = await req.payload.find({
            collection: 'products',
            where: { slug: { equals: slugBase } },
            limit: 1,
            overrideAccess: true,
          })
          const slugTaken = slugHit.docs[0] && slugHit.docs[0].id !== originalDoc?.id
          data.slug = slugTaken ? `${slugBase}-${Date.now().toString(36)}` : slugBase
          if (!data.sku) {
            const candidate = skuFromTitle(title)
            const existing = await req.payload.find({
              collection: 'products',
              where: { sku: { equals: candidate } },
              limit: 1,
              overrideAccess: true,
            })
            const taken = existing.docs[0] && existing.docs[0].id !== originalDoc?.id
            data.sku = taken
              ? `${candidate}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
              : candidate
          }
        }

        if (Array.isArray(data.variants)) {
          const previous = (originalDoc?.variants || []) as Array<{ id?: string; sku?: string | null }>
          data.variants = data.variants.map((variant, index) => {
            if (variant.sku) return variant
            const sameRow = variant.id ? previous.find((row) => row.id === variant.id) : undefined
            const inherited = sameRow?.sku || previous[index]?.sku
            return inherited ? { ...variant, sku: inherited } : variant
          })
          data.variants = assignVariantSkus(String(data.sku || originalDoc?.sku || ''), data.variants)
        }

        const subId = typeof data.category === 'object' && data.category ? data.category.id : data.category
        if (subId && !data.mainCategory) {
          try {
            const cat = await req.payload.findByID({
              collection: 'categories',
              id: subId,
              depth: 0,
              overrideAccess: true,
            })
            if (cat.parent) {
              data.mainCategory = typeof cat.parent === 'object' ? cat.parent.id : cat.parent
            }
          } catch {
            /* la categoría puede no existir aún */
          }
        }
        return data
      },
    ],
    afterChange: [
      async ({ doc, previousDoc, req, operation }) => {
        if (operation !== 'update' || !previousDoc) return
        const { notifyLowStockIfCrossed } = await import('@/lib/adminNotify')
        await notifyLowStockIfCrossed(req.payload, previousDoc, doc)
      },
    ],
  },
  fields: [
    { name: 'title', type: 'text', required: true, label: 'Nombre del producto' },
    {
      name: 'slug',
      type: 'text',
      unique: true,
      index: true,
      label: 'Slug (URL)',
      admin: {
        readOnly: true,
        description: 'Se genera solo a partir del nombre al guardar.',
      },
    },
    {
      name: 'sku',
      type: 'text',
      unique: true,
      label: 'SKU / identificador único',
      admin: {
        description: 'Si lo dejás vacío, se genera a partir del nombre al guardar.',
      },
    },
    { name: 'description', type: 'textarea', label: 'Descripción' },
    { name: 'price', type: 'number', required: true, label: 'Precio (ARS)' },
    {
      name: 'mainCategory',
      type: 'relationship',
      relationTo: 'categories',
      label: 'Categoría',
      admin: {
        description: 'Mujer, Hombre, Niños, etc. Al elegirla aparecen las subcategorías.',
      },
      filterOptions: () => ({
        parent: { exists: false },
      }),
    },
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'categories',
      label: 'Subcategoría',
      admin: {
        condition: (_, siblingData) => Boolean(siblingData?.mainCategory),
        description: 'Se listan solo las de la categoría elegida arriba.',
      },
      filterOptions: ({ siblingData, data }): Where => {
        const source = (siblingData || data || {}) as { mainCategory?: number | { id?: number } | null }
        const parent = source.mainCategory
        if (!parent) return { id: { in: [] } }
        const parentId = typeof parent === 'object' ? parent.id : parent
        return { parent: { equals: parentId } }
      },
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      label: 'Imagen principal',
    },
    {
      name: 'images',
      type: 'upload',
      relationTo: 'media',
      hasMany: true,
      label: 'Galería (hasta 4 imágenes)',
      maxRows: 4,
      admin: {
        description: 'Fotos extra. La tienda muestra la principal y estas como miniaturas.',
      },
      validate: (value: unknown) => {
        if (Array.isArray(value) && value.length > 4) {
          return 'Podés cargar como máximo 4 imágenes en la galería.'
        }
        return true
      },
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
        {
          name: 'sku',
          type: 'text',
          label: 'SKU de variante',
          admin: {
            readOnly: true,
            description: 'Se completa solo al guardar: SKU del producto + 1, 2, 3…',
          },
        },
        { name: 'size', type: 'text', required: true, label: 'Talle' },
        {
          name: 'color',
          type: 'text',
          required: true,
          label: 'Nombre del color',
          admin: { description: 'Ej: Negro, Rojo, Crudo' },
        },
        {
          name: 'colorHex',
          type: 'text',
          defaultValue: '#111111',
          label: 'Color',
          admin: {
            description: 'Tocá el cuadro grande para abrir todos los colores, o un circulito rápido. Ese color se ve en la tienda.',
            components: {
              Field: '/fields/ColorPicker',
            },
          },
        },
        { name: 'stock', type: 'number', required: true, min: 0, defaultValue: 0, label: 'Stock' },
      ],
    },
    { name: 'stock', type: 'number', min: 0, label: 'Stock general (si no hay variantes)' },
  ],
}
