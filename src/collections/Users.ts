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
  auth: true,
  fields: [
    {
      name: 'name',
      type: 'text',
      label: 'Nombre',
    },
  ],
}
