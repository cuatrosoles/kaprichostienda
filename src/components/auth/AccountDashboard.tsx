'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { formatARS } from '@/data/catalog'
import type { PublicCustomer } from '@/lib/auth'

type OrderPreview = {
  id: number
  total: number
  paymentStatus: string
  createdAt: string
}

export default function AccountDashboard({
  user: initialUser,
  orders,
}: {
  user: PublicCustomer
  orders: OrderPreview[]
}) {
  const { setUser, logout, config } = useAuth()
  const router = useRouter()
  const [profile, setProfile] = useState({
    name: initialUser.name,
    phone: initialUser.phone,
    birthday: initialUser.birthday,
    newsletter: initialUser.newsletter,
  })
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    password: '',
    confirmPassword: '',
  })
  const [profileMsg, setProfileMsg] = useState('')
  const [passMsg, setPassMsg] = useState('')
  const [error, setError] = useState('')

  const saveProfile = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    const res = await fetch('/api/auth/profile', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error || 'No se pudo guardar')
      return
    }
    setUser(data.user)
    setProfileMsg('Datos actualizados')
  }

  const savePassword = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    const res = await fetch('/api/auth/change-password', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(passwords),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error || 'No se pudo cambiar la contraseña')
      return
    }
    setPasswords({ currentPassword: '', password: '', confirmPassword: '' })
    setPassMsg('Contraseña actualizada')
  }

  const onLogout = async () => {
    await logout()
    router.push('/')
    router.refresh()
  }

  const statusLabel: Record<string, string> = {
    pending: 'Pendiente',
    approved: 'Aprobado',
    rejected: 'Rechazado',
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-nav text-neutral-500">Cuenta</p>
          <h1 className="mt-2 font-display text-4xl">Hola, {initialUser.name || initialUser.email}</h1>
          <p className="mt-2 text-sm text-neutral-600">
            Club Kaprichos: <strong>{initialUser.loyaltyPoints}</strong> puntos
          </p>
        </div>
        <button type="button" onClick={onLogout} className="store-btn-outline">
          Cerrar sesión
        </button>
      </div>

      {error && <p className="mt-6 text-sm text-red-600">{error}</p>}

      <section className="mt-10 border p-6">
        <h2 className="font-display text-2xl">Tus pedidos</h2>
        {orders.length === 0 ? (
          <p className="mt-3 text-sm text-neutral-500">Todavía no hay pedidos en esta cuenta.</p>
        ) : (
          <ul className="mt-4 divide-y text-sm">
            {orders.map((order) => (
              <li key={order.id} className="flex justify-between py-3">
                <span>
                  Orden #{order.id} · {new Date(order.createdAt).toLocaleDateString('es-AR')}
                </span>
                <span>
                  {statusLabel[order.paymentStatus] || order.paymentStatus} · {formatARS(order.total)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <form onSubmit={saveProfile} className="mt-8 space-y-4 border p-6">
        <h2 className="font-display text-2xl">Datos personales</h2>
        <input
          className="store-input"
          placeholder="Nombre"
          value={profile.name}
          onChange={(e) => setProfile({ ...profile, name: e.target.value })}
        />
        <input className="store-input" value={initialUser.email} disabled />
        <input
          className="store-input"
          placeholder="Teléfono"
          value={profile.phone}
          onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
        />
        <input
          className="store-input"
          placeholder="Cumpleaños (DD/MM)"
          value={profile.birthday}
          onChange={(e) => setProfile({ ...profile, birthday: e.target.value })}
        />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={profile.newsletter}
            onChange={(e) => setProfile({ ...profile, newsletter: e.target.checked })}
          />
          Newsletter
        </label>
        {profileMsg && <p className="text-sm text-kap-green">{profileMsg}</p>}
        <button type="submit" className="store-btn">
          Guardar datos
        </button>
      </form>

      <form onSubmit={savePassword} className="mt-8 space-y-4 border p-6">
        <h2 className="font-display text-2xl">Cambiar contraseña</h2>
        <input
          type="password"
          required
          placeholder="Contraseña actual"
          className="store-input"
          value={passwords.currentPassword}
          onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
        />
        <input
          type="password"
          required
          placeholder={`Nueva (mín. ${config.minPasswordLength})`}
          className="store-input"
          value={passwords.password}
          onChange={(e) => setPasswords({ ...passwords, password: e.target.value })}
        />
        <input
          type="password"
          required
          placeholder="Repetir nueva"
          className="store-input"
          value={passwords.confirmPassword}
          onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
        />
        {passMsg && <p className="text-sm text-kap-green">{passMsg}</p>}
        <button type="submit" className="store-btn">
          Actualizar contraseña
        </button>
      </form>
    </div>
  )
}
