'use client'

import { CartProvider } from '@/context/CartContext'
import { AuthProvider } from '@/context/AuthContext'
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

export default function StoreShell({
  children,
  categories,
  user,
  authConfig,
}: {
  children: ReactNode
  categories: CatalogCategory[]
  user: PublicCustomer | null
  authConfig: PublicAuthConfig
}) {
  return (
    <AuthProvider initialUser={user} initialConfig={authConfig}>
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
    </AuthProvider>
  )
}
