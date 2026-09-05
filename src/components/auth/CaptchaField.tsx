'use client'

import { useEffect, useRef, useState } from 'react'
import type { PublicAuthConfig } from '@/lib/auth'

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string
      reset: (id?: string) => void
      remove: (id?: string) => void
    }
    grecaptcha?: {
      ready: (cb: () => void) => void
      render: (el: HTMLElement, opts: Record<string, unknown>) => number
      reset: (id?: number) => void
    }
  }
}

function loadScript(src: string) {
  const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`)
  if (existing) {
    return existing.dataset.loaded === '1' || Boolean(window.grecaptcha || window.turnstile)
      ? Promise.resolve()
      : new Promise<void>((resolve, reject) => {
          existing.addEventListener('load', () => resolve(), { once: true })
          existing.addEventListener('error', () => reject(new Error('script')), { once: true })
        })
  }

  return new Promise<void>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = src
    script.async = true
    script.defer = true
    script.onload = () => {
      script.dataset.loaded = '1'
      resolve()
    }
    script.onerror = () => reject(new Error('script'))
    document.body.appendChild(script)
  })
}

export default function CaptchaField({
  config,
  onToken,
}: {
  config: PublicAuthConfig
  onToken: (token: string) => void
}) {
  const box = useRef<HTMLDivElement>(null)
  const widget = useRef<string | number | null>(null)
  const [live, setLive] = useState(config)
  const [status, setStatus] = useState<'off' | 'loading' | 'ready' | 'error'>('off')

  useEffect(() => {
    setLive(config)
  }, [config])

  useEffect(() => {
    if (live.captchaEnabled && live.captchaSiteKey) return
    let cancelled = false
    fetch('/api/auth/config')
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data.config?.captchaEnabled && data.config.captchaSiteKey) {
          setLive(data.config)
        }
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [live.captchaEnabled, live.captchaSiteKey])

  useEffect(() => {
    if (!live.captchaEnabled || !live.captchaSiteKey) {
      setStatus('off')
      return
    }

    let cancelled = false
    setStatus('loading')
    const src =
      live.captchaProvider === 'recaptcha'
        ? 'https://www.google.com/recaptcha/api.js?render=explicit'
        : 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'

    const target = () => {
      if (!box.current) return null
      box.current.replaceChildren()
      const el = document.createElement('div')
      box.current.appendChild(el)
      return el
    }

    const render = () => {
      if (cancelled || widget.current != null) return
      try {
        if (live.captchaProvider === 'recaptcha') {
          const go = () => {
            if (cancelled || widget.current != null) return
            const el = target()
            if (!el) return
            widget.current = window.grecaptcha!.render(el, {
              sitekey: live.captchaSiteKey,
              callback: (token: string) => onToken(token),
              'expired-callback': () => onToken(''),
              'error-callback': () => onToken(''),
            })
            setStatus('ready')
          }
          if (window.grecaptcha?.ready) window.grecaptcha.ready(go)
          else if (window.grecaptcha?.render) go()
          else setStatus('error')
          return
        }
        if (window.turnstile) {
          const el = target()
          if (!el) return
          widget.current = window.turnstile.render(el, {
            sitekey: live.captchaSiteKey,
            callback: (token: string) => onToken(token),
            'expired-callback': () => onToken(''),
          })
          setStatus('ready')
          return
        }
        setStatus('error')
      } catch {
        setStatus('error')
      }
    }

    loadScript(src)
      .then(() => {
        if (!cancelled) render()
      })
      .catch(() => {
        if (!cancelled) setStatus('error')
      })

    return () => {
      cancelled = true
      const id = widget.current
      widget.current = null
      try {
        if (id == null) return
        if (live.captchaProvider === 'recaptcha') window.grecaptcha?.reset(id as number)
        else window.turnstile?.remove(String(id))
      } catch {
        /* el widget puede no existir si el contenedor se desmontó */
      }
    }
  }, [live.captchaEnabled, live.captchaProvider, live.captchaSiteKey, onToken])

  if (!live.captchaEnabled) return null

  return (
    <div className="mt-4">
      <div ref={box} className="min-h-[78px]" />
      {status === 'loading' ? (
        <p className="mt-2 text-xs text-neutral-500">Cargando verificación…</p>
      ) : null}
      {status === 'error' ? (
        <p className="mt-2 text-xs text-red-600">No se pudo cargar el captcha. Recargá la página.</p>
      ) : null}
    </div>
  )
}
