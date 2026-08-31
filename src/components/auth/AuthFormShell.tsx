import type { ReactNode } from 'react'
import Link from 'next/link'

export default function AuthFormShell({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <p className="text-[11px] uppercase tracking-nav text-neutral-500">
        <Link href="/">Inicio</Link> / Cuenta
      </p>
      <h1 className="mt-3 font-display text-4xl">{title}</h1>
      <div className="mt-8 border border-neutral-200 p-6">{children}</div>
    </div>
  )
}
