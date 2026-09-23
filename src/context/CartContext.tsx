'use client'

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { type CatalogProduct, type ProductVariant } from '@/data/catalog'
import { trackStoreEvent } from '@/lib/analytics/client'

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
  stockSku?: string
  stock?: number
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
    const pool = variant.stockSku || variant.sku
    setItems((prev) => {
      const used = prev.reduce((acc, row) => ((row.stockSku || row.sku) === pool ? acc + row.quantity : acc), 0)
      const room = Math.max(0, variant.stock - used)
      const add = Math.min(quantity, room)
      if (add <= 0) return prev
      const existing = prev.find((i) => i.sku === variant.sku)
      if (existing) {
        return prev.map((i) =>
          i.sku === variant.sku ? { ...i, quantity: i.quantity + add, stock: variant.stock, stockSku: pool } : i,
        )
      }
      return [
        ...prev,
        {
          productId: product.id,
          slug: product.slug,
          title: product.title,
          price: product.price,
          quantity: add,
          weight: product.weight,
          image: product.image,
          sku: variant.sku,
          size: variant.size,
          color: variant.color,
          stock: variant.stock,
          stockSku: pool,
        },
      ]
    })
    if (variant.stock <= 0) return
    setIsOpen(true)
    trackStoreEvent('cart', { path: `/productos/${product.slug}` })
  }

  const updateQty = (sku: string, quantity: number) => {
    setItems((prev) => {
      if (quantity <= 0) return prev.filter((i) => i.sku !== sku)
      return prev.map((item) => {
        if (item.sku !== sku) return item
        const pool = item.stockSku || item.sku
        const others = prev.reduce((acc, row) => {
          if (row.sku === sku || (row.stockSku || row.sku) !== pool) return acc
          return acc + row.quantity
        }, 0)
        const cap = typeof item.stock === 'number' ? Math.max(0, item.stock - others) : quantity
        return { ...item, quantity: Math.min(quantity, cap) }
      })
    })
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
