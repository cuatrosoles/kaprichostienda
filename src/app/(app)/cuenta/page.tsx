import { redirect } from 'next/navigation'
import AccountDashboard from '@/components/auth/AccountDashboard'
import { getStoreCustomer, payloadClient } from '@/lib/auth'

export default async function CuentaPage() {
  const user = await getStoreCustomer()
  if (!user) redirect('/cuenta/ingresar')

  let orders: Array<{ id: number; total: number; paymentStatus: string; createdAt: string }> = []
  try {
    const payload = await payloadClient()
    const result = await payload.find({
      collection: 'orders',
      where: { customerEmail: { equals: user.email } },
      sort: '-createdAt',
      limit: 20,
      overrideAccess: true,
    })
    orders = result.docs.map((doc) => ({
      id: Number(doc.id),
      total: Number(doc.total),
      paymentStatus: String(doc.paymentStatus),
      createdAt: String(doc.createdAt),
    }))
  } catch {
    orders = []
  }

  return <AccountDashboard user={user} orders={orders} />
}
