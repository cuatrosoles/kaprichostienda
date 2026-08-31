import type { Metadata } from 'next'
import Link from 'next/link'
import React from 'react'
import './globals.css'

export const metadata: Metadata = {
  title: 'Kaprichos',
  description: 'Tienda online Kaprichos',
}

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        <header className="border-b bg-white">
          <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
            <Link href="/" className="text-xl font-bold tracking-tight">
              Kaprichos
            </Link>
            <Link href="/carrito" className="text-sm font-semibold text-blue-600 hover:text-blue-700">
              Carrito
            </Link>
          </nav>
        </header>
        {children}
      </body>
    </html>
  )
}
