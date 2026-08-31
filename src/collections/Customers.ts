import { APIError, type CollectionConfig } from 'payload'
import { adminOnly, adminOrSelfCustomer, isAdminUser } from '@/access/roles'

function storeAuth(req: { context?: Record<string, unknown> }) {
  return req.context?.storeAuth === true
}

function storeUrl() {
  return (process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000').replace(/\/$/, '')
}

export const Customers: CollectionConfig = {
  slug: 'customers',
  labels: { singular: 'Cliente', plural: 'Clientes' },
  admin: {
    useAsTitle: 'email',
    group: 'Tienda',
    defaultColumns: ['email', 'name', 'loyaltyPoints', 'emailVerified'],
    description: 'Cuentas de la tienda (registro, login y puntos). No acceden al panel admin.',
  },
  auth: {
    tokenExpiration: 60 * 60 * 24 * 14,
    maxLoginAttempts: 5,
    lockTime: 15 * 60 * 1000,
    cookies: {
      sameSite: 'Lax',
      secure: process.env.NODE_ENV === 'production' || process.env.VERCEL === '1',
    },
    verify: false,
    forgotPassword: {
      generateEmailSubject: () => 'Restablecé tu contraseña — Kaprichos',
      generateEmailHTML: ({ token } = {}) => {
        const url = `${storeUrl()}/cuenta/restablecer?token=${encodeURIComponent(token || '')}`
        return `
          <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#111">
            <h1 style="font-size:22px">Kaprichos Tienda</h1>
            <p>Recibimos un pedido para restablecer tu contraseña.</p>
            <p><a href="${url}" style="display:inline-block;background:#111;color:#fff;padding:12px 20px;text-decoration:none">Elegir nueva contraseña</a></p>
            <p style="font-size:12px;color:#666">Si no fuiste vos, ignorá este correo. El enlace vence en una hora.</p>
            <p style="font-size:12px;word-break:break-all;color:#666">${url}</p>
          </div>
        `
      },
    },
  },
  access: {
    admin: ({ req }) => isAdminUser(req.user),
    create: () => false,
    read: adminOrSelfCustomer,
    update: adminOrSelfCustomer,
    delete: adminOnly,
  },
  hooks: {
    beforeLogin: [
      ({ req }) => {
        if (storeAuth(req) || isAdminUser(req.user)) return
        throw new APIError('Usá los formularios de la tienda.', 403)
      },
    ],
    beforeOperation: [
      ({ operation, req }) => {
        if (!['login', 'forgotPassword', 'resetPassword'].includes(String(operation))) return
        if (storeAuth(req) || isAdminUser(req.user)) return
        throw new APIError('Usá los formularios de la tienda.', 403)
      },
    ],
  },
  fields: [
    { name: 'name', type: 'text', label: 'Nombre' },
    { name: 'phone', type: 'text', label: 'Teléfono' },
    {
      name: 'loyaltyPoints',
      type: 'number',
      defaultValue: 0,
      label: 'Puntos Club Kaprichos',
      access: {
        update: ({ req }) => isAdminUser(req.user),
      },
    },
    { name: 'birthday', type: 'text', label: 'Cumpleaños (DD/MM)' },
    {
      name: 'newsletter',
      type: 'checkbox',
      defaultValue: false,
      label: 'Suscripto al newsletter',
    },
    {
      name: 'emailVerified',
      type: 'checkbox',
      defaultValue: true,
      label: 'Email verificado',
      admin: { position: 'sidebar' },
    },
    {
      name: 'verifyToken',
      type: 'text',
      admin: { hidden: true },
      access: {
        read: ({ req }) => isAdminUser(req.user),
        update: ({ req }) => isAdminUser(req.user),
      },
    },
    {
      name: 'verifyTokenExpires',
      type: 'date',
      admin: { hidden: true },
      access: {
        read: ({ req }) => isAdminUser(req.user),
        update: ({ req }) => isAdminUser(req.user),
      },
    },
  ],
}
