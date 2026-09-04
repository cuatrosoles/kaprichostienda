import type { Metadata } from 'next'
import React from 'react'
import StoreShell from '@/components/store/StoreShell'
import { getStoreCategories } from '@/lib/storefront'
import { getPublicAuthConfig, getStoreCustomer, getStoreSettings } from '@/lib/auth'
import { getPublicCommerce } from '@/lib/storeCommerce'
import './globals.css'

export const metadata: Metadata = {
  title: 'Kaprichos Tienda',
  description: 'Indumentaria Kaprichos. Envíos a todo el país. 3 cuotas sin interés.',
  icons: {
    icon: [{ url: '/logo-kaprichos.webp', type: 'image/webp' }],
    shortcut: '/logo-kaprichos.webp',
    apple: '/logo-kaprichos.webp',
  },
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
  const commerce = settings ? getPublicCommerce(settings) : undefined

  return (
    <html lang="es">
      <body className="font-sans antialiased">
        <StoreShell categories={categories} user={user} authConfig={authConfig} commerce={commerce}>
          {children}
        </StoreShell>
      </body>
    </html>
  )
}
