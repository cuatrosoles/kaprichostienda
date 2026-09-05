'use client'

import { FormEvent, useEffect, useState } from 'react'

export default function NewsletterModal() {
  const [open, setOpen] = useState(false)
  const [sent, setSent] = useState(false)

  useEffect(() => {
    if (sessionStorage.getItem('kaprichos-nl')) return
    const t = setTimeout(() => setOpen(true), 1800)
    return () => clearTimeout(t)
  }, [])

  const close = () => {
    setOpen(false)
    sessionStorage.setItem('kaprichos-nl', '1')
  }

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    await fetch('/api/newsletter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: form.get('email'),
        name: form.get('name'),
        birthday: form.get('birthday'),
      }),
    })
    setSent(true)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md overflow-hidden rounded-md bg-white">
        <div className="p-8">
          <button type="button" onClick={close} className="float-right text-neutral-400" aria-label="Cerrar">
            ×
          </button>
          <h2 className="mt-6 font-display text-2xl">¡Suscribite para recibir descuentos exclusivos!</h2>
          {sent ? (
            <p className="mt-6 text-sm text-kap-green">¡Listo! Revisá tu correo. Cupón BIENVENIDA15.</p>
          ) : (
            <form onSubmit={onSubmit} className="mt-6 space-y-4">
              <input name="email" type="email" required placeholder="Email" className="store-input" />
              <input name="name" type="text" placeholder="Nombre" className="store-input" />
              <input name="birthday" type="text" placeholder="Cumpleaños (DD/MM)" className="store-input" />
              <button type="submit" className="w-full bg-[#e85aaa] py-3 text-sm font-semibold uppercase tracking-widest text-white">
                ¡Yo quiero!
              </button>
              <p className="text-xs text-neutral-500">Recibirás un correo para validar tu email.</p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
