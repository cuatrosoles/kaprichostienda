import type { Metadata } from 'next'
import React from 'react'
import StoreShell from '@/components/store/StoreShell'
import { getStoreCategories } from '@/lib/storefront'
import { getPublicAuthConfig, getStoreCustomer, getStoreSettings } from '@/lib/auth'
import './globals.css'

export const metadata: Metadata = {
  title: 'Kaprichos Tienda',
  description: 'Indumentaria Kaprichos. Envíos a todo el país. 3 cuotas sin interés.',
}

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 60

const fallbackAuth = {
  loginEnabled: true,
  registrationEnabled: true,
  requireEmailVerification: false,
  minPasswordLength: 8,
  captchaEnabled: false,
  captchaProvider: 'turnstile' as const,
  captchaSiteKey: '',
}

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const settings = await getStoreSettings().catch(() => null)
  const user = await getStoreCustomer()
  const categories = await getStoreCategories()
  const authConfig = settings ? getPublicAuthConfig(settings) : fallbackAuth

  return (
    <html lang="es">
      <body className="font-sans antialiased">
        <StoreShell categories={categories} user={user} authConfig={authConfig}>
          {children}
        </StoreShell>
      </body>
    </html>
  )
}
