import type { AdminViewServerProps } from 'payload'
import { DefaultTemplate } from '@payloadcms/next/templates'
import { Gutter } from '@payloadcms/ui'
import { redirect } from 'next/navigation'
import React from 'react'
import { isAdminUser } from '@/access/roles'
import { getAnalyticsStats } from '@/lib/analytics/stats'
import AnalyticsDashboard from '@/components/admin/AnalyticsDashboard'

export default async function AnalyticsView({
  initPageResult,
  params,
  searchParams,
}: AdminViewServerProps) {
  const { req, visibleEntities, permissions, locale } = initPageResult
  if (!isAdminUser(req.user)) {
    redirect('/admin/login')
  }

  const rangeParam = typeof searchParams?.range === 'string' ? searchParams.range : '30d'
  const initial = await getAnalyticsStats(req.payload, rangeParam)

  return (
    <DefaultTemplate
      i18n={req.i18n}
      locale={locale}
      params={params}
      payload={req.payload}
      permissions={permissions}
      req={req}
      searchParams={searchParams}
      user={req.user || undefined}
      visibleEntities={visibleEntities}
    >
      <Gutter className="kap-analytics">
        <AnalyticsDashboard initial={initial} />
      </Gutter>
    </DefaultTemplate>
  )
}
