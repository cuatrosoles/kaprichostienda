import { redirect } from 'next/navigation'
import RegisterForm from '@/components/auth/RegisterForm'
import { getStoreCustomer } from '@/lib/auth'

export default async function RegistroPage() {
  const user = await getStoreCustomer()
  if (user) redirect('/cuenta')
  return <RegisterForm />
}
