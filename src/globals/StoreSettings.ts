import type { GlobalConfig, PayloadRequest } from 'payload'
import { adminOnly, isAdminUser } from '@/access/roles'

const secretRead = ({ req }: { req: PayloadRequest }) => isAdminUser(req.user)

export const StoreSettings: GlobalConfig = {
  slug: 'store-settings',
  label: 'Configuración de la tienda',
  admin: {
    group: 'Tienda',
    description: 'Login, registro, captcha y correo de la tienda pública.',
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
              label: 'Activar captcha en login, registro y recuperación',
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
              label: 'Site key (pública)',
              admin: {
                description: 'Visible en el frontend. También podés usar NEXT_PUBLIC_TURNSTILE_SITE_KEY / NEXT_PUBLIC_RECAPTCHA_SITE_KEY.',
              },
            },
            {
              name: 'captchaSecretKey',
              type: 'text',
              label: 'Secret key',
              access: { read: secretRead },
              admin: {
                description: 'Nunca se envía al navegador. También podés usar TURNSTILE_SECRET_KEY / RECAPTCHA_SECRET_KEY.',
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
              label: 'SMTP host',
              access: { read: secretRead },
            },
            {
              name: 'smtpPort',
              type: 'number',
              defaultValue: 587,
              label: 'SMTP puerto',
              access: { read: secretRead },
            },
            {
              name: 'smtpUser',
              type: 'text',
              label: 'SMTP usuario',
              access: { read: secretRead },
            },
            {
              name: 'smtpPassword',
              type: 'text',
              label: 'SMTP contraseña',
              access: { read: secretRead },
            },
          ],
        },
      ],
    },
  ],
}
