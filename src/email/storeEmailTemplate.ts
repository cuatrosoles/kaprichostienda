export function storePublicUrl() {
  return (process.env.NEXT_PUBLIC_SERVER_URL || 'https://www.kaprichostienda.com.ar').replace(/\/$/, '')
}

export function escapeEmailHtml(value: unknown) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function htmlToText(html: string) {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/(h\d|div|tr|li)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export type EmailField = { label: string; value: string }
export type EmailCta = { href: string; label: string }

export type StoreEmailContent = {
  preheader?: string
  eyebrow?: string
  title: string
  intro?: string
  fields?: EmailField[]
  bodyHtml?: string
  cta?: EmailCta
  footerNote?: string
}

function fieldsTable(fields: EmailField[]) {
  const rows = fields
    .filter((field) => field.value)
    .map(
      (field, index) => `
        <tr>
          <td style="padding:${index === 0 ? '0' : '12px'} 0 0 0;border-top:${index === 0 ? '0' : '1px solid #ece7df'};">
            <p style="margin:0 0 4px 0;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#6b6358;font-family:Arial,Helvetica,sans-serif;">
              ${escapeEmailHtml(field.label)}
            </p>
            <p style="margin:0;font-size:15px;line-height:1.5;color:#0b0b0b;font-family:Georgia,'Times New Roman',serif;">
              ${escapeEmailHtml(field.value)}
            </p>
          </td>
        </tr>`,
    )
    .join('')

  if (!rows) return ''
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0 0 0;background:#f7f4ef;border-radius:10px;">
      <tr>
        <td style="padding:18px 20px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}</table>
        </td>
      </tr>
    </table>`
}

export function renderStoreEmail(content: StoreEmailContent): { html: string; text: string } {
  const site = storePublicUrl()
  const logo = `${site}/logo-kaprichos.webp`
  const preheader = content.preheader || content.intro || content.title
  const fields = fieldsTable(content.fields || [])
  const intro = content.intro
    ? `<p style="margin:0;font-size:16px;line-height:1.65;color:#3f3a34;font-family:Arial,Helvetica,sans-serif;">${content.intro}</p>`
    : ''
  const body = content.bodyHtml
    ? `<div style="margin:24px 0 0 0;font-size:15px;line-height:1.65;color:#3f3a34;font-family:Arial,Helvetica,sans-serif;">${content.bodyHtml}</div>`
    : ''
  const cta = content.cta
    ? `
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0 0 0;">
        <tr>
          <td style="border-radius:4px;background:#0b0b0b;">
            <a href="${escapeEmailHtml(content.cta.href)}" style="display:inline-block;padding:14px 26px;font-family:Arial,Helvetica,sans-serif;font-size:12px;letter-spacing:0.16em;text-transform:uppercase;text-decoration:none;color:#ffffff;font-weight:700;">
              ${escapeEmailHtml(content.cta.label)}
            </a>
          </td>
        </tr>
      </table>`
    : ''
  const footerNote = content.footerNote
    ? `<p style="margin:0 0 10px 0;font-size:12px;line-height:1.6;color:#8a8176;">${content.footerNote}</p>`
    : ''

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${escapeEmailHtml(content.title)}</title>
</head>
<body style="margin:0;padding:0;background:#f3efe8;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeEmailHtml(preheader)}</div>
  <table data-kaprichos-email="layout" role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3efe8;padding:28px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 8px 30px rgba(11,11,11,0.06);">
          <tr>
            <td style="background:#1e4d32;padding:28px 24px 24px 24px;text-align:center;">
              <a href="${site}" style="text-decoration:none;">
                <img src="${logo}" alt="Kaprichos" width="72" height="72" style="display:block;margin:0 auto 12px auto;border-radius:50%;border:2px solid #c4a574;object-fit:cover;" />
              </a>
              <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:26px;letter-spacing:0.08em;color:#f7f4ef;">Kaprichos</p>
              <p style="margin:6px 0 0 0;font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:#c4a574;">Tienda de indumentaria</p>
            </td>
          </tr>
          <tr>
            <td style="height:4px;background:#c4a574;font-size:0;line-height:0;">&nbsp;</td>
          </tr>
          <tr>
            <td style="padding:36px 32px 20px 32px;">
              ${
                content.eyebrow
                  ? `<p style="margin:0 0 10px 0;font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#1e4d32;">${escapeEmailHtml(content.eyebrow)}</p>`
                  : ''
              }
              <h1 style="margin:0 0 16px 0;font-family:Georgia,'Times New Roman',serif;font-size:28px;line-height:1.25;color:#0b0b0b;font-weight:normal;">${escapeEmailHtml(content.title)}</h1>
              ${intro}
              ${fields}
              ${body}
              ${cta}
            </td>
          </tr>
          <tr>
            <td style="padding:8px 32px 32px 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="height:1px;background:#ece7df;font-size:0;line-height:0;">&nbsp;</td>
                </tr>
              </table>
              <p style="margin:18px 0 0 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.6;color:#6b6358;">
                Gracias por elegir Kaprichos. Si necesitás ayuda, respondé este correo o escribinos desde la web.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:#f7f4ef;padding:22px 28px;text-align:center;">
              ${footerNote}
              <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;">
                <a href="${site}" style="color:#1e4d32;text-decoration:none;font-weight:700;">kaprichostienda.com.ar</a>
              </p>
              <p style="margin:8px 0 0 0;font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#8a8176;">
                © ${new Date().getFullYear()} Kaprichos. Todos los derechos reservados.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

  const textParts = [
    content.eyebrow,
    content.title,
    content.intro,
    ...(content.fields || [])
      .filter((field) => field.value)
      .map((field) => `${field.label}: ${field.value}`),
    content.bodyHtml ? htmlToText(content.bodyHtml) : '',
    content.cta ? `${content.cta.label}: ${content.cta.href}` : '',
    content.footerNote,
    site,
  ].filter(Boolean)

  return { html, text: textParts.join('\n\n') }
}

export function wrapStoreEmailHtml(html: string, subject?: string) {
  if (!html || html.includes('data-kaprichos-email')) return html
  return renderStoreEmail({
    title: subject || 'Kaprichos',
    bodyHtml: html,
  }).html
}
