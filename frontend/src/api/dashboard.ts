import { apiFetchWithRefresh, readApiResponse } from './client'

export type DashboardStats = {
  totalVideos: number
  totalSubscribers: number
  totalSubscribed: number
  totalCommentsOnChannel: number
}

export async function fetchDashboardStats(): Promise<{
  ok: boolean
  data?: DashboardStats
  message?: string
}> {
  const res = await apiFetchWithRefresh('/api/v1/dashboard/stats')
  return readApiResponse<DashboardStats>(res)
}
