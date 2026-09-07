import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { getAnalyticsStats } from '@/lib/analytics/stats'
import { isAdminUser } from '@/access/roles'
import { payloadClient } from '@/lib/payload'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function GET(req: Request) {
  try {
    const payload = await payloadClient()
    const { user } = await payload.auth({ headers: await headers() })
    if (!isAdminUser(user)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    const range = new URL(req.url).searchParams.get('range')
    const stats = await getAnalyticsStats(payload, range)
    return NextResponse.json(stats)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'No se pudieron cargar las estadísticas' },
      { status: 500 },
    )
  }
}
