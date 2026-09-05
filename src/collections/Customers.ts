import { APIError, type CollectionConfig } from 'payload'
import { adminOnly, adminOrSelfCustomer, isAdminUser } from '@/access/roles'
import { renderStoreEmail, storePublicUrl } from '@/email/storeEmailTemplate'

function storeAuth(req: { context?: Record<string, unknown> }) {
  return req.context?.storeAuth === true
}

export const Customers: CollectionConfig = {
  slug: 'customers',
  labels: { singular: 'Cliente', plural: 'Clientes' },
  admin: {
    useAsTitle: 'email',
    group: 'Tienda',
    defaultColumns: ['email', 'name', 'loyaltyPoints', 'emailVerified'],
    description: 'Cuentas de clientes de la tienda (registro, inicio de sesión y puntos). No acceden al panel.',
  },
  auth: {
    useSessions: false,
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
        const url = `${storePublicUrl()}/cuenta/restablecer?token=${encodeURIComponent(token || '')}`
        return renderStoreEmail({
          preheader: 'Elegí una nueva contraseña para tu cuenta',
          eyebrow: 'Seguridad de la cuenta',
          title: 'Restablecé tu contraseña',
          intro: 'Recibimos un pedido para cambiar la contraseña de tu cuenta Kaprichos. El enlace vale por una hora.',
          cta: { href: url, label: 'Elegir nueva contraseña' },
          footerNote: `Si no fuiste vos, ignorá este correo. También podés copiar este enlace: ${url}`,
        }).html
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
      label: 'Token de verificación',
      admin: { hidden: true },
      access: {
        read: ({ req }) => isAdminUser(req.user),
        update: ({ req }) => isAdminUser(req.user),
      },
    },
    {
      name: 'verifyTokenExpires',
      type: 'date',
      label: 'Vencimiento del token de verificación',
      admin: { hidden: true },
      access: {
        read: ({ req }) => isAdminUser(req.user),
        update: ({ req }) => isAdminUser(req.user),
      },
    },
  ],
}
