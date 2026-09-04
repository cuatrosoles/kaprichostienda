import type { GlobalConfig } from 'payload'
import { adminFieldAccess, adminOnly } from '@/access/roles'

const secretAccess = {
  read: adminFieldAccess,
  create: adminFieldAccess,
  update: adminFieldAccess,
}

export const StoreSettings: GlobalConfig = {
  slug: 'store-settings',
  label: 'Ajustes generales',
  admin: {
    group: 'Configuración de la tienda',
    description: 'Cuentas, avisos al administrador, captcha y correo SMTP.',
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
          label: 'Cuentas',
          fields: [
            {
              name: 'loginEnabled',
              type: 'checkbox',
              defaultValue: true,
              label: 'Permitir inicio de sesión',
            },
            {
              name: 'registrationEnabled',
              type: 'checkbox',
              defaultValue: true,
              label: 'Permitir registro de clientes',
            },
            {
              name: 'requireEmailVerification',
              type: 'checkbox',
              defaultValue: false,
              label: 'Exigir verificación de email al registrarse',
              admin: {
                description:
                  'Requiere SMTP o el enlace se imprime en la consola del servidor. Los clientes existentes pueden seguir entrando.',
              },
            },
            {
              name: 'minPasswordLength',
              type: 'number',
              defaultValue: 8,
              min: 8,
              max: 64,
              label: 'Largo mínimo de contraseña',
            },
            {
              name: 'sessionDays',
              type: 'number',
              defaultValue: 14,
              min: 1,
              max: 90,
              label: 'Duración de la sesión (días)',
            },
          ],
        },
        {
          label: 'Captcha',
          fields: [
            {
              name: 'captchaEnabled',
              type: 'checkbox',
              defaultValue: false,
              label: 'Activar captcha en inicio de sesión, registro y recuperación',
            },
            {
              name: 'captchaProvider',
              type: 'select',
              defaultValue: 'turnstile',
              label: 'Proveedor',
              options: [
                { label: 'Cloudflare Turnstile', value: 'turnstile' },
                { label: 'Google reCAPTCHA v2', value: 'recaptcha' },
              ],
            },
            {
              name: 'captchaSiteKey',
              type: 'text',
              label: 'Clave pública del captcha',
              admin: {
                description:
                  'Visible en el sitio. También se puede usar NEXT_PUBLIC_TURNSTILE_SITE_KEY o NEXT_PUBLIC_RECAPTCHA_SITE_KEY.',
              },
            },
            {
              name: 'captchaSecretKey',
              type: 'text',
              label: 'Clave secreta',
              access: secretAccess,
              admin: {
                description:
                  'Nunca se envía al navegador. También se puede usar TURNSTILE_SECRET_KEY o RECAPTCHA_SECRET_KEY.',
              },
            },
          ],
        },
        {
          label: 'Avisos',
          fields: [
            {
              name: 'adminEmail',
              type: 'email',
              label: 'Email de administración',
              access: secretAccess,
              admin: {
                description:
                  'Ahí llegan ventas, registros, mensajes de contacto y alertas de stock bajo.',
              },
            },
            {
              name: 'notifySales',
              type: 'checkbox',
              defaultValue: true,
              label: 'Avisar ventas (pedidos cobrados o por transferencia)',
              access: secretAccess,
            },
            {
              name: 'notifyRegistrations',
              type: 'checkbox',
              defaultValue: true,
              label: 'Avisar registros de clientes',
              access: secretAccess,
            },
            {
              name: 'notifyContact',
              type: 'checkbox',
              defaultValue: true,
              label: 'Avisar mensajes del formulario de contacto',
              access: secretAccess,
            },
            {
              name: 'lowStockEnabled',
              type: 'checkbox',
              defaultValue: true,
              label: 'Alertar cuando un producto llegue al stock mínimo',
              access: secretAccess,
            },
            {
              name: 'lowStockThreshold',
              type: 'number',
              defaultValue: 5,
              min: 0,
              max: 9999,
              label: 'Cantidad mínima de unidades',
              access: secretAccess,
              admin: {
                description:
                  'Si el stock total del producto (suma de variantes) pasa de estar por encima de este número a igual o menor, se envía el email.',
                condition: (_, sibling) => sibling?.lowStockEnabled !== false,
              },
            },
          ],
        },
        {
          label: 'Correo',
          fields: [
            {
              name: 'fromName',
              type: 'text',
              defaultValue: 'Kaprichos Tienda',
              label: 'Nombre del remitente',
            },
            {
              name: 'fromAddress',
              type: 'email',
              label: 'Email remitente',
              admin: { description: 'Ej: noreply@kaprichos.com.ar' },
            },
            {
              name: 'smtpHost',
              type: 'text',
              label: 'Servidor SMTP',
              access: secretAccess,
            },
            {
              name: 'smtpPort',
              type: 'number',
              defaultValue: 587,
              label: 'Puerto SMTP',
              access: secretAccess,
            },
            {
              name: 'smtpUser',
              type: 'text',
              label: 'Usuario SMTP',
              access: secretAccess,
            },
            {
              name: 'smtpPassword',
              type: 'text',
              label: 'Contraseña SMTP',
              access: secretAccess,
            },
          ],
        },
      ],
    },
  ],
}
