import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
  labels: {
    singular: 'Archivo',
    plural: 'Archivos',
  },
  admin: {
    group: 'Tienda',
    description: 'Imágenes y archivos. Se guardan en Cloudinary, no en Vercel.',
  },
  access: {
    read: () => true,
  },
  hooks: {
    beforeValidate: [
      ({ data }) => {
        if (data && (data.alt == null || data.alt === undefined)) {
          data.alt = ''
        }
        return data
      },
    ],
  },
  upload: {
    disableLocalStorage: true,
    imageSizes: [
      { name: 'thumbnail', width: 400, height: 300, position: 'centre' },
      { name: 'card', width: 768, height: 1024, position: 'centre' },
    ],
    adminThumbnail: 'thumbnail',
    mimeTypes: ['image/*'],
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: false,
      label: 'Texto alternativo (SEO)',
      admin: {
        description: 'Opcional. Si lo dejás vacío, no pasa nada.',
      },
    },
  ],
}
