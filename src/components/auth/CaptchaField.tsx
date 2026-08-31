'use client'

import { useEffect, useRef } from 'react'
import type { PublicAuthConfig } from '@/lib/auth'

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string
      reset: (id?: string) => void
      remove: (id?: string) => void
    }
    grecaptcha?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => number
      reset: (id?: number) => void
    }
  }
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

  useEffect(() => {
    if (!config.captchaEnabled || !config.captchaSiteKey || !box.current) return
    const el = box.current
    let cancelled = false

    const render = () => {
      if (cancelled || !box.current) return
      box.current.innerHTML = ''
      if (config.captchaProvider === 'recaptcha' && window.grecaptcha) {
        widget.current = window.grecaptcha.render(box.current, {
          sitekey: config.captchaSiteKey,
          callback: (token: string) => onToken(token),
          'expired-callback': () => onToken(''),
        })
        return
      }
      if (window.turnstile) {
        widget.current = window.turnstile.render(box.current, {
          sitekey: config.captchaSiteKey,
          callback: (token: string) => onToken(token),
          'expired-callback': () => onToken(''),
        })
      }
    }

    const src =
      config.captchaProvider === 'recaptcha'
        ? 'https://www.google.com/recaptcha/api.js?render=explicit'
        : 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'

    const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`)
    if (existing) {
      existing.addEventListener('load', render)
      if (window.turnstile || window.grecaptcha) render()
    } else {
      const script = document.createElement('script')
      script.src = src
      script.async = true
      script.onload = render
      document.body.appendChild(script)
    }

    return () => {
      cancelled = true
      el.innerHTML = ''
    }
  }, [config.captchaEnabled, config.captchaProvider, config.captchaSiteKey, onToken])

  if (!config.captchaEnabled) return null

  return <div ref={box} className="mt-4" />
}
