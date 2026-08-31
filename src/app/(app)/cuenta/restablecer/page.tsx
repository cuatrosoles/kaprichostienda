import { Suspense } from 'react'
import ResetForm from '@/components/auth/ResetForm'

export default function RestablecerPage() {
  return (
    <Suspense fallback={<div className="px-4 py-16 text-center text-sm">Cargando...</div>}>
      <ResetForm />
    </Suspense>
  )
}
