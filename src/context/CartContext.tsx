'use client'

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { type CatalogProduct, type ProductVariant } from '@/data/catalog'

export type CartItem = {
  productId: string
  slug: string
  title: string
  price: number
  quantity: number
  weight: number
  image: string
  sku: string
  size: string
  color: string
}

type CartContextValue = {
  items: CartItem[]
  count: number
  subtotal: number
  addItem: (product: CatalogProduct, variant: ProductVariant, quantity?: number) => void
  updateQty: (sku: string, quantity: number) => void
  removeItem: (sku: string) => void
  clear: () => void
  isOpen: boolean
  openCart: () => void
  closeCart: () => void
}

const CartContext = createContext<CartContextValue | null>(null)
const STORAGE_KEY = 'kaprichos-cart'

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setItems(JSON.parse(raw))
    } catch {
      /* ignore */
    }
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items, hydrated])

  const addItem = (product: CatalogProduct, variant: ProductVariant, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.sku === variant.sku)
      if (existing) {
        return prev.map((i) =>
          i.sku === variant.sku ? { ...i, quantity: i.quantity + quantity } : i,
        )
      }
      return [
        ...prev,
        {
          productId: product.id,
          slug: product.slug,
          title: product.title,
          price: product.price,
          quantity,
          weight: product.weight,
          image: product.image,
          sku: variant.sku,
          size: variant.size,
          color: variant.color,
        },
      ]
    })
    setIsOpen(true)
  }

  const updateQty = (sku: string, quantity: number) => {
    setItems((prev) =>
      quantity <= 0 ? prev.filter((i) => i.sku !== sku) : prev.map((i) => (i.sku === sku ? { ...i, quantity } : i)),
    )
  }

  const removeItem = (sku: string) => setItems((prev) => prev.filter((i) => i.sku !== sku))
  const clear = () => setItems([])

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      count: items.reduce((acc, i) => acc + i.quantity, 0),
      subtotal: items.reduce((acc, i) => acc + i.price * i.quantity, 0),
      addItem,
      updateQty,
      removeItem,
      clear,
      isOpen,
      openCart: () => setIsOpen(true),
      closeCart: () => setIsOpen(false),
    }),
    [items, isOpen],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart debe usarse dentro de CartProvider')
  return ctx
}
