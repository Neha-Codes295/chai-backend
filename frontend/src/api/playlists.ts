import { apiFetchWithRefresh, readApiResponse } from './client'

export type PlaylistOwner = {
  _id?: string
  fullname?: string
  username?: string
  avatar?: string
}

export type PlaylistListItem = {
  _id: string
  name: string
  description: string
  videos?: unknown[]
  owner?: string
}

export type PlaylistDetail = {
  _id: string
  name: string
  description: string
  videos?: unknown[]
  owner?: PlaylistOwner | null
}

export async function fetchPlaylistsByUserId(
  userId: string,
): Promise<{ ok: boolean; data?: PlaylistListItem[]; message?: string }> {
  const res = await apiFetchWithRefresh(
    `/api/v1/playlists/u/${encodeURIComponent(userId)}`,
  )
  return readApiResponse<PlaylistListItem[]>(res)
}

export async function fetchPlaylistById(
  playlistId: string,
): Promise<{ ok: boolean; data?: PlaylistDetail; message?: string }> {
  const res = await apiFetchWithRefresh(
    `/api/v1/playlists/${encodeURIComponent(playlistId)}`,
  )
  return readApiResponse<PlaylistDetail>(res)
}

export async function createPlaylist(body: {
  name: string
  description: string
}): Promise<{ ok: boolean; data?: PlaylistListItem; message?: string }> {
  const res = await apiFetchWithRefresh('/api/v1/playlists', {
    method: 'POST',
    body: JSON.stringify(body),
  })
  return readApiResponse<PlaylistListItem>(res)
}

/** Owner only. Idempotent if the video is already in the playlist. */
export async function addVideoToPlaylist(
  playlistId: string,
  videoId: string,
): Promise<{ ok: boolean; data?: PlaylistListItem; message?: string }> {
  const res = await apiFetchWithRefresh(
    `/api/v1/playlists/${encodeURIComponent(playlistId)}/videos/${encodeURIComponent(videoId)}`,
    { method: 'POST' },
  )
  return readApiResponse<PlaylistListItem>(res)
}

export async function removeVideoFromPlaylist(
  playlistId: string,
  videoId: string,
): Promise<{ ok: boolean; data?: PlaylistListItem; message?: string }> {
  const res = await apiFetchWithRefresh(
    `/api/v1/playlists/${encodeURIComponent(playlistId)}/videos/${encodeURIComponent(videoId)}`,
    { method: 'DELETE' },
  )
  return readApiResponse<PlaylistListItem>(res)
}
