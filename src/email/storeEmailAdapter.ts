import type { Payload } from 'payload'

type EmailMessage = {
  to?: string | string[]
  from?: string
  subject?: string
  html?: string
  text?: string
}

function formatFrom(name?: string | null, address?: string | null) {
  const addr = address || process.env.SMTP_FROM || 'noreply@kaprichos.com.ar'
  const fromName = name || process.env.SMTP_FROM_NAME || 'Kaprichos Tienda'
  if (addr.includes('<')) return addr
  return `${fromName} <${addr}>`
}

export function storeEmailAdapter({ payload }: { payload: Payload }) {
  return {
    name: 'kaprichos-email',
    defaultFromName: 'Kaprichos Tienda',
    defaultFromAddress: process.env.SMTP_FROM || 'noreply@kaprichos.com.ar',
    sendEmail: async (message: EmailMessage) => {
      let host = process.env.SMTP_HOST || ''
      let user = process.env.SMTP_USER || ''
      let pass = process.env.SMTP_PASS || ''
      let port = Number(process.env.SMTP_PORT || 587)
      let fromName = 'Kaprichos Tienda'
      let fromAddress = process.env.SMTP_FROM || 'noreply@kaprichos.com.ar'

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
        fromAddress = settings.fromAddress || fromAddress
      } catch {
        /* global todavía no existe durante el primer boot */
      }

      const from = message.from || formatFrom(fromName, fromAddress)

      if (!host || !user || !pass) {
        console.info('[Kaprichos] Email sin SMTP — se registra en consola:')
        console.info(
          JSON.stringify(
            { from, to: message.to, subject: message.subject, text: message.text, html: message.html },
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
        subject: message.subject,
        html: message.html,
        text: message.text,
      })
    },
  }
}
