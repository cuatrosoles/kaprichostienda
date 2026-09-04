'use client'

import { CartProvider } from '@/context/CartContext'
import { AuthProvider } from '@/context/AuthContext'
import { CommerceProvider } from '@/context/CommerceContext'
import type { ReactNode } from 'react'
import AnnouncementBar from '@/components/store/AnnouncementBar'
import Header from '@/components/store/Header'
import Footer from '@/components/store/Footer'
import CartDrawer from '@/components/store/CartDrawer'
import WhatsAppButton from '@/components/store/WhatsAppButton'
import CookieBanner from '@/components/store/CookieBanner'
import NewsletterModal from '@/components/store/NewsletterModal'
import type { CatalogCategory } from '@/data/catalog'
import type { PublicAuthConfig, PublicCustomer } from '@/lib/auth'
import type { PublicCommerce } from '@/lib/storeCommerce'

export default function StoreShell({
  children,
  categories,
  user,
  authConfig,
  commerce,
}: {
  children: ReactNode
  categories: CatalogCategory[]
  user: PublicCustomer | null
  authConfig: PublicAuthConfig
  commerce?: PublicCommerce | null
}) {
  return (
    <AuthProvider initialUser={user} initialConfig={authConfig}>
      <CommerceProvider value={commerce}>
        <CartProvider>
          <AnnouncementBar />
          <Header categories={categories} />
          <main>{children}</main>
          <Footer categories={categories} />
          <CartDrawer />
          <WhatsAppButton />
          <CookieBanner />
          <NewsletterModal />
        </CartProvider>
      </CommerceProvider>
    </AuthProvider>
  )
}
