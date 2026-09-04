import type { GlobalConfig } from 'payload'
import { adminOnly } from '@/access/roles'

export const StoreSettings: GlobalConfig = {
  slug: 'store-settings',
  label: 'Ajustes generales',
  lockDocuments: false,
  admin: {
    group: 'Configuración de la tienda',
    description: 'Cuentas, pagos, envíos, avisos, captcha y correo SMTP.',
  },
  access: {
    read: () => true,
    update: adminOnly,
  },
  hooks: {
    afterChange: [
      async () => {
        const { revalidateTag } = await import('next/cache')
        revalidateTag('store-settings')
      },
    ],
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
              admin: {
                description:
                  'Nunca se envía al navegador. También se puede usar TURNSTILE_SECRET_KEY o RECAPTCHA_SECRET_KEY.',
              },
            },
          ],
        },
        {
          label: 'Pagos',
          fields: [
            {
              type: 'collapsible',
              label: 'Mercado Pago',
              admin: { initCollapsed: false },
              fields: [
                {
                  name: 'mpEnabled',
                  type: 'checkbox',
                  defaultValue: true,
                  label: 'Aceptar Mercado Pago',
                },
                {
                  name: 'mpLabel',
                  type: 'text',
                  defaultValue: 'Mercado Pago · 3 cuotas sin interés',
                  label: 'Texto en el carrito',
                  admin: {
                    description: 'Así lo ve el cliente al elegir cómo pagar.',
                    condition: (_, sibling) => sibling?.mpEnabled !== false,
                  },
                },
                {
                  name: 'mpAccessToken',
                  type: 'text',
                  label: 'Access Token de Mercado Pago',
                  admin: {
                    description:
                      'Lo sacás en Tus integraciones → Credenciales. Producción: APP_USR-…  Pruebas: TEST-…  Si lo dejás vacío, se usa MERCADOPAGO_ACCESS_TOKEN del servidor.',
                    condition: (_, sibling) => sibling?.mpEnabled !== false,
                  },
                },
                {
                  name: 'paymentsSiteUrl',
                  type: 'text',
                  label: 'URL de la tienda (vuelta del pago)',
                  admin: {
                    description:
                      'Ej: https://tudominio.com  Si está vacío, se usa NEXT_PUBLIC_SERVER_URL. Mercado Pago redirige acá al terminar.',
                    condition: (_, sibling) => sibling?.mpEnabled !== false,
                  },
                },
                {
                  name: 'paymentsWebhookUrl',
                  type: 'text',
                  label: 'URL pública para avisos de pago',
                  admin: {
                    description:
                      'La misma URL pública de la tienda, sin barra al final. Si está vacía, se usa NEXT_PUBLIC_WEBHOOK_URL. Mercado Pago avisa a esta URL + /api/webhooks/mercadopago.',
                    condition: (_, sibling) => sibling?.mpEnabled !== false,
                  },
                },
              ],
            },
            {
              type: 'collapsible',
              label: 'Transferencia / efectivo',
              admin: { initCollapsed: false },
              fields: [
                {
                  name: 'transferEnabled',
                  type: 'checkbox',
                  defaultValue: true,
                  label: 'Aceptar transferencia o efectivo',
                },
                {
                  name: 'cashDiscountPercent',
                  type: 'number',
                  defaultValue: 20,
                  min: 0,
                  max: 90,
                  label: 'Descuento por transferencia (%)',
                  admin: {
                    condition: (_, sibling) => sibling?.transferEnabled !== false,
                  },
                },
                {
                  name: 'transferLabel',
                  type: 'text',
                  label: 'Texto en el carrito',
                  admin: {
                    description: 'Si lo dejás vacío, se arma solo con el porcentaje de descuento.',
                    condition: (_, sibling) => sibling?.transferEnabled !== false,
                  },
                },
                {
                  name: 'transferBank',
                  type: 'text',
                  label: 'Banco',
                  admin: { condition: (_, sibling) => sibling?.transferEnabled !== false },
                },
                {
                  name: 'transferHolder',
                  type: 'text',
                  label: 'Titular de la cuenta',
                  admin: { condition: (_, sibling) => sibling?.transferEnabled !== false },
                },
                {
                  name: 'transferCbu',
                  type: 'text',
                  label: 'CBU / CVU',
                  admin: { condition: (_, sibling) => sibling?.transferEnabled !== false },
                },
                {
                  name: 'transferAlias',
                  type: 'text',
                  label: 'Alias',
                  admin: { condition: (_, sibling) => sibling?.transferEnabled !== false },
                },
                {
                  name: 'transferInstructions',
                  type: 'textarea',
                  label: 'Indicaciones para el cliente',
                  admin: {
                    description: 'Ej: Enviar el comprobante por WhatsApp al 11-…  Cada Enter es una línea nueva.',
                    condition: (_, sibling) => sibling?.transferEnabled !== false,
                  },
                },
              ],
            },
          ],
        },
        {
          label: 'Envíos',
          fields: [
            {
              name: 'shippingMode',
              type: 'select',
              defaultValue: 'internal',
              label: 'Cómo se calcula el envío',
              options: [
                { label: 'Tarifa de la tienda (código postal y peso)', value: 'internal' },
                { label: 'API externa de logística', value: 'api' },
              ],
              admin: {
                description:
                  'Hoy la tienda cotiza sola con el código postal. La API externa es para Correo, Andreani u otro sistema que ustedes conecten.',
              },
            },
            {
              name: 'shippingOriginZip',
              type: 'text',
              label: 'Código postal de origen (depósito)',
              admin: {
                description: 'Se manda a la API externa si está activa. En la tarifa interna no cambia el precio.',
              },
            },
            {
              type: 'collapsible',
              label: 'Precios por zona y peso',
              admin: { initCollapsed: false },
              fields: [
                {
                  name: 'shipBaseCost',
                  type: 'number',
                  defaultValue: 4500,
                  min: 0,
                  label: 'Costo base (ARS)',
                },
                {
                  name: 'shipPerKg',
                  type: 'number',
                  defaultValue: 850,
                  min: 0,
                  label: 'Extra por cada kg (ARS)',
                  admin: { description: 'Se suma 1 vez por cada kilo o fracción del pedido.' },
                },
                {
                  name: 'shipCabaMultiplier',
                  type: 'number',
                  defaultValue: 0.9,
                  min: 0,
                  label: 'Multiplicador CABA (CP 1000–1499)',
                },
                {
                  name: 'shipGbaMultiplier',
                  type: 'number',
                  defaultValue: 1,
                  min: 0,
                  label: 'Multiplicador GBA (CP 1600–1899)',
                },
                {
                  name: 'shipInteriorMultiplier',
                  type: 'number',
                  defaultValue: 1.6,
                  min: 0,
                  label: 'Multiplicador resto del país',
                },
                {
                  name: 'freeShippingFrom',
                  type: 'number',
                  defaultValue: 0,
                  min: 0,
                  label: 'Envío gratis desde (ARS)',
                  admin: { description: '0 = nunca automático. El cupón de envío gratis sigue funcionando aparte.' },
                },
              ],
            },
            {
              type: 'collapsible',
              label: 'Opciones que ve el cliente',
              admin: { initCollapsed: false },
              fields: [
                {
                  name: 'standardEnabled',
                  type: 'checkbox',
                  defaultValue: true,
                  label: 'Mostrar envío a domicilio',
                },
                {
                  name: 'standardName',
                  type: 'text',
                  defaultValue: 'Correo Argentino — Envío a domicilio',
                  label: 'Nombre envío a domicilio',
                },
                {
                  name: 'standardEta',
                  type: 'text',
                  defaultValue: '3 a 6 días hábiles',
                  label: 'Plazo envío a domicilio',
                },
                {
                  name: 'expressEnabled',
                  type: 'checkbox',
                  defaultValue: true,
                  label: 'Mostrar envío express',
                },
                {
                  name: 'expressName',
                  type: 'text',
                  defaultValue: 'Envío Express prioritario',
                  label: 'Nombre express',
                },
                {
                  name: 'expressEta',
                  type: 'text',
                  defaultValue: '24 a 48 horas hábiles',
                  label: 'Plazo express',
                },
                {
                  name: 'expressMultiplier',
                  type: 'number',
                  defaultValue: 1.45,
                  min: 0,
                  label: 'Multiplicador express (sobre el envío a domicilio)',
                },
                {
                  name: 'pickupEnabled',
                  type: 'checkbox',
                  defaultValue: true,
                  label: 'Mostrar retiro en punto de correo',
                },
                {
                  name: 'pickupName',
                  type: 'text',
                  defaultValue: 'Retiro en punto de correo',
                  label: 'Nombre retiro',
                },
                {
                  name: 'pickupEta',
                  type: 'text',
                  defaultValue: '4 a 7 días hábiles',
                  label: 'Plazo retiro',
                },
                {
                  name: 'pickupMultiplier',
                  type: 'number',
                  defaultValue: 0.75,
                  min: 0,
                  label: 'Multiplicador retiro (sobre el envío a domicilio)',
                },
              ],
            },
            {
              type: 'collapsible',
              label: 'API externa de envíos',
              admin: {
                initCollapsed: true,
                description: 'Solo se usa si arriba elegiste “API externa”. Si falla, se usa la tarifa de la tienda.',
              },
              fields: [
                {
                  name: 'shippingApiUrl',
                  type: 'text',
                  label: 'URL de la API',
                  admin: {
                    description:
                      'La tienda hace POST con { zipCode, totalWeight, orderTotal, originZip }. Tiene que responder { options: [{ id, name, cost, eta }] }.',
                  },
                },
                {
                  name: 'shippingApiKey',
                  type: 'text',
                  label: 'Clave de la API',
                  admin: { description: 'Se manda como Bearer. Dejala vacía si no hace falta.' },
                },
                {
                  name: 'shippingApiTimeout',
                  type: 'number',
                  defaultValue: 8000,
                  min: 2000,
                  max: 20000,
                  label: 'Tiempo máximo de espera (ms)',
                },
              ],
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
            },
            {
              name: 'notifyRegistrations',
              type: 'checkbox',
              defaultValue: true,
              label: 'Avisar registros de clientes',
            },
            {
              name: 'notifyContact',
              type: 'checkbox',
              defaultValue: true,
              label: 'Avisar mensajes del formulario de contacto',
            },
            {
              name: 'lowStockEnabled',
              type: 'checkbox',
              defaultValue: true,
              label: 'Alertar cuando un producto llegue al stock mínimo',
            },
            {
              name: 'lowStockThreshold',
              type: 'number',
              defaultValue: 5,
              min: 0,
              max: 9999,
              label: 'Cantidad mínima de unidades',
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
            },
            {
              name: 'smtpPort',
              type: 'number',
              defaultValue: 587,
              label: 'Puerto SMTP',
            },
            {
              name: 'smtpUser',
              type: 'text',
              label: 'Usuario SMTP',
            },
            {
              name: 'smtpPassword',
              type: 'text',
              label: 'Contraseña SMTP',
            },
          ],
        },
      ],
    },
  ],
}
