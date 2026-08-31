import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import LoginForm from '@/components/auth/LoginForm'
import { getStoreCustomer } from '@/lib/auth'

export default async function IngresarPage() {
  const user = await getStoreCustomer()
  if (user) redirect('/cuenta')

  return (
    <Suspense fallback={<div className="px-4 py-16 text-center text-sm">Cargando...</div>}>
      <LoginForm />
    </Suspense>
  )
}
