import type { Payload } from 'payload'
import { htmlToText, wrapStoreEmailHtml } from '@/email/storeEmailTemplate'

type EmailAddress = {
  name?: string
  address?: string
}

type EmailMessage = {
  to?: string | string[]
  from?: string | EmailAddress
  replyTo?: string
  subject?: string
  html?: string
  text?: string
}

const FALLBACK_EMAIL = 'no-reply@kaprichostienda.com.ar'
const FALLBACK_NAME = 'Kaprichos Tienda'

function extractEmail(value?: string | null): string {
  if (!value) return ''
  const angle = value.match(/<([^>]+)>/)
  const raw = (angle?.[1] || value).trim().replace(/^["']|["']$/g, '')
  return /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(raw) ? raw : ''
}

function extractName(value?: string | null): string {
  if (!value || !value.includes('<')) return (value || '').replace(/[<>]/g, '').trim()
  return value.slice(0, value.indexOf('<')).trim().replace(/^["']|["']$/g, '')
}

function quoteDisplayName(name: string) {
  const clean = name.replace(/[<>]/g, '').replace(/\s+/g, ' ').trim()
  if (!clean) return ''
  if (/^[A-Za-z0-9 ÁÉÍÓÚáéíóúÜüÑñ.-]+$/.test(clean)) return clean
  return `"${clean.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`
}

function normalizeFrom(input?: string | EmailAddress | null, name?: string | null, address?: string | null) {
  let display = name || process.env.SMTP_FROM_NAME || FALLBACK_NAME
  let email = extractEmail(address) || extractEmail(process.env.SMTP_FROM) || FALLBACK_EMAIL

  if (typeof input === 'string' && input.trim()) {
    display = extractName(input) || display
    email = extractEmail(input) || email
  } else if (input && typeof input === 'object') {
    display = input.name || display
    email = extractEmail(input.address) || email
  }

  const quoted = quoteDisplayName(display)
  return quoted ? `${quoted} <${email}>` : email
}

export function storeEmailAdapter({ payload }: { payload: Payload }) {
  const defaultFromAddress = extractEmail(process.env.SMTP_FROM) || FALLBACK_EMAIL
  return {
    name: 'kaprichos-email',
    defaultFromName: process.env.SMTP_FROM_NAME || FALLBACK_NAME,
    defaultFromAddress,
    sendEmail: async (message: EmailMessage) => {
      let host = process.env.SMTP_HOST || ''
      let user = process.env.SMTP_USER || ''
      let pass = process.env.SMTP_PASS || ''
      let port = Number(process.env.SMTP_PORT || 587)
      let fromName = process.env.SMTP_FROM_NAME || FALLBACK_NAME
      let fromAddress = defaultFromAddress

      try {
        const settings = await payload.findGlobal({
          slug: 'store-settings',
          overrideAccess: true,
        })
        host = host || settings.smtpHost || ''
        user = user || settings.smtpUser || ''
        pass = pass || settings.smtpPassword || ''
        port = Number(process.env.SMTP_PORT || settings.smtpPort || 587)
        fromName = settings.fromName || fromName
        fromAddress = extractEmail(settings.fromAddress) || fromAddress
      } catch {
        // Store settings may not exist on first boot.
      }

      const from = normalizeFrom(message.from, fromName, fromAddress)
      const html = wrapStoreEmailHtml(message.html || '', message.subject)
      const text = message.text || (html ? htmlToText(html) : undefined)

      if (!host || !user || !pass) {
        console.info('[Kaprichos] Email sin SMTP — se registra en consola:')
        console.info(
          JSON.stringify(
            {
              from,
              to: message.to,
              replyTo: message.replyTo,
              subject: message.subject,
              text,
              html,
            },
            null,
            2,
          ),
        )
        return { accepted: [message.to] }
      }

      const nodemailer = await import('nodemailer')
      const transport = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      })

      return transport.sendMail({
        from,
        to: message.to,
        replyTo: message.replyTo,
        subject: message.subject,
        html,
        text,
      })
    },
  }
}
