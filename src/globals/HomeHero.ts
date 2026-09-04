import type { GlobalConfig } from 'payload'
import { adminOnly } from '@/access/roles'

export const HomeHero: GlobalConfig = {
  slug: 'home-hero',
  label: 'Hero de inicio',
  lockDocuments: false,
  admin: {
    group: 'Configuración de la tienda',
    description: 'Carrusel de la portada: imágenes, textos, botones y transiciones.',
  },
  access: {
    read: () => true,
    update: adminOnly,
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Diapositivas',
          fields: [
            {
              name: 'slides',
              type: 'array',
              labels: { singular: 'Diapositiva', plural: 'Diapositivas' },
              label: 'Diapositivas del hero',
              minRows: 1,
              admin: {
                description: 'El orden de esta lista es el orden en la portada. Arrastrá para reordenar.',
              },
              fields: [
                {
                  name: 'active',
                  type: 'checkbox',
                  defaultValue: true,
                  label: 'Visible en la tienda',
                },
                {
                  name: 'image',
                  type: 'upload',
                  relationTo: 'media',
                  label: 'Imagen',
                  admin: {
                    description: 'Subí un archivo (Cloudinary). Si no, usá la URL de abajo.',
                  },
                },
                {
                  name: 'imageUrl',
                  type: 'text',
                  label: 'URL de imagen (opcional)',
                  admin: {
                    description: 'Ej: /catalog/hero-temporada.jpg',
                  },
                },
                {
                  name: 'alt',
                  type: 'text',
                  label: 'Texto alternativo',
                },
                {
                  name: 'objectPosition',
                  type: 'select',
                  defaultValue: 'center_top',
                  label: 'Encaje de la foto',
                  options: [
                    { label: 'Arriba (centrado)', value: 'center_top' },
                    { label: 'Centro', value: 'center' },
                    { label: 'Abajo (centrado)', value: 'center_bottom' },
                    { label: 'Izquierda', value: 'left' },
                    { label: 'Derecha', value: 'right' },
                  ],
                },
                {
                  name: 'eyebrow',
                  type: 'text',
                  label: 'Texto script (arriba)',
                  admin: { description: 'Ej: Nueva' },
                },
                {
                  name: 'title',
                  type: 'text',
                  label: 'Título principal',
                  admin: { description: 'Ej: Temporada' },
                },
                {
                  name: 'badges',
                  type: 'array',
                  labels: { singular: 'Etiqueta', plural: 'Etiquetas' },
                  label: 'Etiquetas sobre la imagen',
                  fields: [{ name: 'text', type: 'text', required: true, label: 'Texto' }],
                },
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'ctaLabel',
                      type: 'text',
                      label: 'Botón (texto)',
                      admin: { width: '50%' },
                    },
                    {
                      name: 'ctaHref',
                      type: 'text',
                      label: 'Botón (enlace)',
                      admin: { width: '50%', description: 'Ej: /productos' },
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          label: 'Transición',
          fields: [
            {
              name: 'autoplay',
              type: 'checkbox',
              defaultValue: true,
              label: 'Reproducción automática',
            },
            {
              name: 'intervalSeconds',
              type: 'number',
              defaultValue: 6,
              min: 2,
              max: 20,
              label: 'Segundos entre diapositivas',
            },
            {
              name: 'transition',
              type: 'select',
              defaultValue: 'fade',
              label: 'Tipo de transición',
              options: [
                { label: 'Fundido (fade)', value: 'fade' },
                { label: 'Deslizamiento', value: 'slide' },
                { label: 'Zoom suave', value: 'zoom' },
              ],
            },
            {
              name: 'durationMs',
              type: 'number',
              defaultValue: 800,
              min: 200,
              max: 2500,
              label: 'Duración de la transición (ms)',
            },
            {
              name: 'showArrows',
              type: 'checkbox',
              defaultValue: true,
              label: 'Mostrar flechas',
            },
            {
              name: 'showDots',
              type: 'checkbox',
              defaultValue: true,
              label: 'Mostrar indicadores',
            },
          ],
        },
      ],
    },
  ],
}
