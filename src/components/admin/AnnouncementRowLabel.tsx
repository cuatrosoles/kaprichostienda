'use client'

import { useRowLabel } from '@payloadcms/ui'

export default function AnnouncementRowLabel() {
  const { data } = useRowLabel<{ text?: string | null }>()
  const text = typeof data?.text === 'string' ? data.text.trim() : ''
  return <span>{text || 'Anuncio'}</span>
}
