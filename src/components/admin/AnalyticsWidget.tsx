'use client'

import { useEffect, useState } from 'react'
import { Link } from '@payloadcms/ui'

type TodayStats = {
  totals?: {
    humanSessions: number
    uniqueVisitors: number
    bots: number
    bounceRate: number
    purchases: number
  }
}

export default function AnalyticsWidget() {
  const [data, setData] = useState<TodayStats['totals'] | null>(null)

  useEffect(() => {
    let alive = true
    void fetch('/api/analytics/stats?range=today', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then((json: TodayStats | null) => {
        if (alive && json?.totals) setData(json.totals)
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [])

  return (
    <div className="kap-analytics-widget">
      <div className="kap-analytics-widget__head">
        <div>
          <p className="kap-analytics-widget__eyebrow">Hoy</p>
          <h2 className="kap-analytics-widget__title">Analítica de visitas</h2>
        </div>
        <Link className="btn btn--style-primary btn--size-small" href="/admin/analitica" prefetch={false}>
          Ver panel
        </Link>
      </div>
      <div className="kap-analytics-widget__grid">
        <div>
          <strong>{data ? data.humanSessions : '—'}</strong>
          <span>Sesiones</span>
        </div>
        <div>
          <strong>{data ? data.uniqueVisitors : '—'}</strong>
          <span>Únicos</span>
        </div>
        <div>
          <strong>{data ? `${data.bounceRate}%` : '—'}</strong>
          <span>Rebote</span>
        </div>
        <div>
          <strong>{data ? data.bots : '—'}</strong>
          <span>Bots</span>
        </div>
        <div>
          <strong>{data ? data.purchases : '—'}</strong>
          <span>Compras</span>
        </div>
      </div>
    </div>
  )
}
