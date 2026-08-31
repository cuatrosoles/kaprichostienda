import type { Payload } from 'payload'
import { randomPassword } from '@/lib/auth'

export async function ensureCustomer(
  payload: Payload,
  data: { email: string; name?: string; phone?: string; birthday?: string; newsletter?: boolean },
) {
  const email = data.email.trim().toLowerCase()
  const existing = await payload.find({
    collection: 'customers',
    where: { email: { equals: email } },
    limit: 1,
    overrideAccess: true,
  })

  if (existing.docs[0]) {
    await payload.update({
      collection: 'customers',
      id: existing.docs[0].id,
      data: {
        name: data.name || existing.docs[0].name,
        phone: data.phone || existing.docs[0].phone,
        birthday: data.birthday || existing.docs[0].birthday,
        newsletter: data.newsletter ?? existing.docs[0].newsletter,
      },
      overrideAccess: true,
    })
    return existing.docs[0]
  }

  return payload.create({
    collection: 'customers',
    data: {
      email,
      name: data.name || '',
      phone: data.phone || '',
      birthday: data.birthday || '',
      newsletter: Boolean(data.newsletter),
      password: randomPassword(),
      loyaltyPoints: 0,
      emailVerified: true,
    },
    context: { storeAuth: true },
    overrideAccess: true,
  })
}
