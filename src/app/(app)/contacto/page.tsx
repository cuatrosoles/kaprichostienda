'use client'

import { FormEvent, useState } from 'react'

export default function ContactoPage() {
  const [sent, setSent] = useState(false)

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.get('name'),
        email: form.get('email'),
        phone: form.get('phone'),
        message: form.get('message'),
      }),
    })
    setSent(true)
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <p className="text-[11px] uppercase tracking-nav text-neutral-500">Inicio / Contacto</p>
      <h1 className="mt-3 font-display text-5xl">Contacto</h1>
      <div className="mt-10 grid gap-12 md:grid-cols-2">
        <div className="space-y-3 text-sm leading-7">
          <p>+54 11 5555-0101</p>
          <p>+54 11 5555-0102</p>
          <p>info@kaprichos.com.ar</p>
          <p>Buenos Aires, Argentina</p>
          <p>Lunes a viernes 10 a 18 hs</p>
        </div>
        <form onSubmit={onSubmit} className="space-y-5">
          <label className="block text-[11px] uppercase tracking-widest">
            Nombre
            <input name="name" required className="store-input mt-1" />
          </label>
          <label className="block text-[11px] uppercase tracking-widest">
            Email
            <input name="email" type="email" required className="store-input mt-1" />
          </label>
          <label className="block text-[11px] uppercase tracking-widest">
            Teléfono
            <input name="phone" className="store-input mt-1" />
          </label>
          <label className="block text-[11px] uppercase tracking-widest">
            Mensaje
            <textarea name="message" required rows={5} className="store-input mt-1" />
          </label>
          {sent && (
            <p className="bg-neutral-800 px-4 py-3 text-sm text-white">¡Operación exitosa!</p>
          )}
          <button type="submit" className="store-btn">
            Enviar
          </button>
        </form>
      </div>
    </div>
  )
}
