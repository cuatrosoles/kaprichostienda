import { NextResponse } from 'next/server'
import { assertSameOrigin, clientIp, jsonError, payloadClient, rateLimit } from '@/lib/auth'
import { notifyContact } from '@/lib/adminNotify'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  try {
    assertSameOrigin(req)
    if (!rateLimit(`contact:${clientIp(req)}`, 8, 15 * 60 * 1000)) {
      return jsonError('Demasiados mensajes. Probá en unos minutos.', 429)
    }

    const body = await req.json()
    if (body.website) return NextResponse.json({ ok: true })

    const name = String(body.name || '').trim()
    const email = String(body.email || '').trim().toLowerCase()
    const phone = String(body.phone || '').trim()
    const message = String(body.message || '').trim()

    if (!name) return jsonError('Ingresá tu nombre')
    if (!email || !email.includes('@')) return jsonError('Ingresá un email válido')
    if (!message) return jsonError('Escribí un mensaje')
    if (message.length > 4000) return jsonError('El mensaje es demasiado largo')

    const payload = await payloadClient()
    const sent = await notifyContact(payload, { name, email, phone, message })
    if (!sent) {
      return jsonError(
        'El mensaje no se pudo entregar. Si el problema continúa, escribinos por teléfono o WhatsApp.',
        503,
      )
    }
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Contacto:', error)
    return jsonError('No se pudo enviar el mensaje', 500)
  }
}
