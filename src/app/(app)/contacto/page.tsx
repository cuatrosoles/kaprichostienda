'use client'

import { FormEvent, useState } from 'react'

export default function ContactoPage() {
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setPending(true)
    const form = new FormData(e.currentTarget)
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.get('name'),
          email: form.get('email'),
          phone: form.get('phone'),
          message: form.get('message'),
          website: form.get('website'),
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error || 'No se pudo enviar el mensaje')
        return
      }
      setSent(true)
    } catch {
      setError('No se pudo enviar el mensaje')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <p className="text-[11px] uppercase tracking-nav text-neutral-500">Inicio / Contacto</p>
      <h1 className="mt-3 font-display text-5xl">Contacto</h1>
      <div className="mt-10 grid gap-12 md:grid-cols-2">
        <div className="space-y-3 text-sm leading-7">
          <p>+54 2477 59-0742</p>
          <p>maralga2008@yahoo.com.ar</p>
          <p>C. Eduardo T. Silva 2096, Pergamino</p>
          <p>Buenos Aires, Argentina</p>
          <p>Lun a Sab 17:00 a 20:00 hs</p>
        </div>
        <form onSubmit={onSubmit} className="space-y-5">
          <div className="hidden" aria-hidden="true">
            <input name="website" tabIndex={-1} autoComplete="off" />
          </div>
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
          {error && (
            <p className="bg-red-800 px-4 py-3 text-sm text-white">{error}</p>
          )}
          {sent && (
            <p className="bg-neutral-800 px-4 py-3 text-sm text-white">¡Operación exitosa!</p>
          )}
          <button type="submit" className="store-btn" disabled={pending || sent}>
            {pending ? 'Enviando…' : 'Enviar'}
          </button>
        </form>
      </div>
    </div>
  )
}
