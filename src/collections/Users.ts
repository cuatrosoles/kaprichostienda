import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  labels: {
    singular: 'Usuario administrador',
    plural: 'Usuarios administradores',
  },
  admin: {
    useAsTitle: 'email',
    group: 'Administración',
    description: 'Cuentas con acceso al panel de control. No son clientes de la tienda.',
    defaultColumns: ['email', 'name'],
  },
  auth: {
    // En Vercel (serverless) las sesiones de Payload 3 invalidan el JWT al guardar y tiran 403.
    useSessions: false,
    tokenExpiration: 60 * 60 * 24 * 14,
    cookies: {
      sameSite: 'Lax',
      secure: process.env.NODE_ENV === 'production' || process.env.VERCEL === '1',
    },
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      label: 'Nombre',
    },
  ],
}
