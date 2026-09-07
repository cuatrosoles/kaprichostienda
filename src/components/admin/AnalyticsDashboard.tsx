'use client'

import { useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import type { AnalyticsRange, AnalyticsStats } from '@/lib/analytics/stats'

const RANGES: { key: AnalyticsRange; label: string }[] = [
  { key: 'today', label: 'Hoy' },
  { key: '7d', label: '7 días' },
  { key: '30d', label: '30 días' },
  { key: '90d', label: '90 días' },
]

const CHANNEL_LABEL: Record<string, string> = {
  direct: 'Directo',
  organic: 'Orgánico',
  social: 'Redes',
  paid: 'Pago / ads',
  referral: 'Referido',
  bot: 'Bots',
}

const DEVICE_LABEL: Record<string, string> = {
  desktop: 'Escritorio',
  mobile: 'Móvil',
  tablet: 'Tablet',
  bot: 'Bot',
}

function formatInt(value: number) {
  return new Intl.NumberFormat('es-AR').format(value)
}

function formatDuration(seconds: number) {
  if (seconds < 60) return `${seconds}s`
  const min = Math.floor(seconds / 60)
  const sec = seconds % 60
  return `${min}m ${sec}s`
}

function formatWhen(iso: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function downloadCsv(name: string, rows: string[][]) {
  const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(';')).join('\n')
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = name
  link.click()
  URL.revokeObjectURL(url)
}

function BarList({
  items,
  label,
}: {
  items: { key: string; count: number }[]
  label?: (key: string) => string
}) {
  const max = items[0]?.count || 1
  if (!items.length) return <p className="kap-analytics__empty">Sin datos en este período.</p>
  return (
    <ul className="kap-analytics__bars">
      {items.map((item) => (
        <li key={item.key}>
          <div>
            <span>{label ? label(item.key) : item.key}</span>
            <strong>{formatInt(item.count)}</strong>
          </div>
          <i style={{ width: `${Math.max(8, (item.count / max) * 100)}%` }} />
        </li>
      ))}
    </ul>
  )
}

export default function AnalyticsDashboard({ initial }: { initial: AnalyticsStats }) {
  const [stats, setStats] = useState(initial)
  const [pending, startTransition] = useTransition()
  const maxDaily = useMemo(
    () => Math.max(1, ...stats.daily.map((d) => d.sessions + d.bots)),
    [stats.daily],
  )

  const load = (range: AnalyticsRange) => {
    startTransition(async () => {
      const res = await fetch(`/api/analytics/stats?range=${range}`, { credentials: 'include' })
      if (!res.ok) return
      setStats((await res.json()) as AnalyticsStats)
    })
  }

  const funnelMax = Math.max(stats.totals.humanSessions, 1)

  return (
    <div className={pending ? 'kap-analytics__wrap is-loading' : 'kap-analytics__wrap'}>
      <header className="kap-analytics__header">
        <div>
          <p className="kap-analytics__eyebrow">Kaprichos · Marketing</p>
          <h1>Analítica de visitas</h1>
          <p>
            Visitas humanas, rebotes, campañas UTM y ubicación aproximada por IP. Los bots e indexadores se
            separan para no inflar las campañas.
          </p>
        </div>
        <div className="kap-analytics__ranges">
          {RANGES.map((range) => (
            <button
              key={range.key}
              type="button"
              className={stats.range.key === range.key ? 'is-active' : ''}
              onClick={() => load(range.key)}
            >
              {range.label}
            </button>
          ))}
        </div>
      </header>

      <section className="kap-analytics__kpis">
        <article>
          <span>Sesiones humanas</span>
          <strong>{formatInt(stats.totals.humanSessions)}</strong>
        </article>
        <article>
          <span>Visitantes únicos</span>
          <strong>{formatInt(stats.totals.uniqueVisitors)}</strong>
        </article>
        <article>
          <span>Páginas vistas</span>
          <strong>{formatInt(stats.totals.pageviews)}</strong>
        </article>
        <article>
          <span>Rebote</span>
          <strong>{stats.totals.bounceRate}%</strong>
        </article>
        <article>
          <span>Duración media</span>
          <strong>{formatDuration(stats.totals.avgDurationSec)}</strong>
        </article>
        <article>
          <span>Bots / arañas</span>
          <strong>{formatInt(stats.totals.bots)}</strong>
        </article>
      </section>

      <section className="kap-analytics__card">
        <div className="kap-analytics__card-head">
          <h2>Evolución diaria</h2>
          <p>
            {stats.range.from} → {stats.range.to}
            {stats.truncated ? ' · muestra limitada a 8.000 sesiones' : ''}
          </p>
        </div>
        <div className="kap-analytics__chart">
          {stats.daily.map((day) => (
            <div key={day.date} className="kap-analytics__col" title={`${day.date}: ${day.sessions} sesiones`}>
              <div className="kap-analytics__col-bars">
                <span style={{ height: `${(day.sessions / maxDaily) * 100}%` }} />
                <em style={{ height: `${(day.bots / maxDaily) * 100}%` }} />
              </div>
              <small>{day.date.slice(8)}</small>
            </div>
          ))}
        </div>
        <p className="kap-analytics__legend">
          <i /> Sesiones humanas <em /> Bots
        </p>
      </section>

      <section className="kap-analytics__grid">
        <article className="kap-analytics__card">
          <h2>Embudo de la tienda</h2>
          <ul className="kap-analytics__funnel">
            {[
              ['Visitas', stats.totals.humanSessions],
              ['Carrito', stats.totals.cart],
              ['Checkout', stats.totals.checkout],
              ['Compra', stats.totals.purchases],
              ['Newsletter', stats.totals.newsletters],
            ].map(([label, value]) => (
              <li key={String(label)}>
                <div>
                  <span>{label}</span>
                  <strong>{formatInt(Number(value))}</strong>
                </div>
                <i style={{ width: `${Math.max(6, (Number(value) / funnelMax) * 100)}%` }} />
              </li>
            ))}
          </ul>
        </article>
        <article className="kap-analytics__card">
          <h2>Canal de llegada</h2>
          <BarList items={stats.channels} label={(key) => CHANNEL_LABEL[key] || key} />
        </article>
        <article className="kap-analytics__card">
          <h2>Dispositivo</h2>
          <BarList items={stats.devices} label={(key) => DEVICE_LABEL[key] || key} />
        </article>
      </section>

      <section className="kap-analytics__grid kap-analytics__grid--2">
        <article className="kap-analytics__card">
          <h2>País</h2>
          <BarList items={stats.countries} />
        </article>
        <article className="kap-analytics__card">
          <h2>Provincia / región</h2>
          <BarList items={stats.regions} />
        </article>
        <article className="kap-analytics__card">
          <h2>Ciudad estimada</h2>
          <BarList items={stats.cities} />
        </article>
        <article className="kap-analytics__card">
          <h2>Sitios de origen</h2>
          <BarList items={stats.referrers.map((r) => ({ key: r.host, count: r.count }))} />
        </article>
      </section>

      <section className="kap-analytics__card">
        <div className="kap-analytics__card-head">
          <div>
            <h2>Campañas (UTM)</h2>
            <p>Usá estos datos para segmentar Instagram, Meta Ads, Google y WhatsApp.</p>
          </div>
          <button
            type="button"
            className="kap-analytics__ghost"
            onClick={() =>
              downloadCsv('kaprichos-campanas.csv', [
                ['Fuente', 'Medio', 'Campaña', 'Sesiones', 'Únicos', 'Rebote %', 'Compras'],
                ...stats.campaigns.map((row) => [
                  row.source,
                  row.medium,
                  row.campaign,
                  String(row.sessions),
                  String(row.unique),
                  String(row.bounceRate),
                  String(row.purchases),
                ]),
              ])
            }
          >
            Exportar CSV
          </button>
        </div>
        {stats.campaigns.length === 0 ? (
          <p className="kap-analytics__empty">
            Todavía no hay UTM. Enlaces de ejemplo: <code>?utm_source=instagram&utm_medium=social&utm_campaign=otono</code>
          </p>
        ) : (
          <div className="kap-analytics__table-wrap">
            <table className="kap-analytics__table">
              <thead>
                <tr>
                  <th>Fuente</th>
                  <th>Medio</th>
                  <th>Campaña</th>
                  <th>Sesiones</th>
                  <th>Únicos</th>
                  <th>Rebote</th>
                  <th>Compras</th>
                </tr>
              </thead>
              <tbody>
                {stats.campaigns.map((row) => (
                  <tr key={`${row.source}-${row.medium}-${row.campaign}`}>
                    <td>{row.source}</td>
                    <td>{row.medium}</td>
                    <td>{row.campaign}</td>
                    <td>{formatInt(row.sessions)}</td>
                    <td>{formatInt(row.unique)}</td>
                    <td>{row.bounceRate}%</td>
                    <td>{formatInt(row.purchases)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="kap-analytics__grid kap-analytics__grid--2">
        <article className="kap-analytics__card">
          <h2>Páginas más vistas</h2>
          <BarList items={stats.pages.map((p) => ({ key: p.path, count: p.views }))} />
        </article>
        <article className="kap-analytics__card">
          <h2>Bots e indexadores</h2>
          {stats.bots.length === 0 ? (
            <p className="kap-analytics__empty">No se detectaron arañas en este período.</p>
          ) : (
            <ul className="kap-analytics__bots">
              {stats.bots.map((bot) => (
                <li key={bot.name}>
                  <strong>{bot.name}</strong>
                  <span>
                    {formatInt(bot.sessions)} sesiones · {formatInt(bot.pages)} páginas
                  </span>
                </li>
              ))}
            </ul>
          )}
        </article>
      </section>

      <section className="kap-analytics__card">
        <div className="kap-analytics__card-head">
          <h2>Sesiones recientes</h2>
          <Link href="/admin/collections/visit-sessions">Ver listado completo</Link>
        </div>
        <div className="kap-analytics__table-wrap">
          <table className="kap-analytics__table">
            <thead>
              <tr>
                <th>Cuándo</th>
                <th>Entrada</th>
                <th>Ubicación</th>
                <th>Canal</th>
                <th>Disp.</th>
                <th>Págs.</th>
              </tr>
            </thead>
            <tbody>
              {stats.recent.map((row) => (
                <tr key={row.id}>
                  <td>{formatWhen(row.startedAt)}</td>
                  <td>
                    {row.landingPath}
                    {row.utmCampaign ? <small> · {row.utmCampaign}</small> : null}
                  </td>
                  <td>{[row.city, row.region, row.country].filter(Boolean).join(', ') || '—'}</td>
                  <td>{row.isBot ? row.botName || 'Bot' : CHANNEL_LABEL[row.channel] || row.channel || '—'}</td>
                  <td>{row.isBot ? 'Bot' : DEVICE_LABEL[row.device] || row.device}</td>
                  <td>{row.pageCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
