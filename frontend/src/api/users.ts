import { apiFetchWithRefresh, readApiResponse } from './client'
import type { User } from '../types/user'

export async function updateAccountDetails(body: {
  fullname: string
  email: string
}): Promise<{ ok: boolean; data?: User; message?: string }> {
  const res = await apiFetchWithRefresh('/api/v1/users/update-account', {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
  return readApiResponse<User>(res)
}

export async function changePassword(body: {
  oldPassword: string
  newPassword: string
}): Promise<{ ok: boolean; message?: string }> {
  const res = await apiFetchWithRefresh('/api/v1/users/change-password', {
    method: 'POST',
    body: JSON.stringify(body),
  })
  return readApiResponse<unknown>(res)
}

export async function updateUserAvatar(formData: FormData): Promise<{
  ok: boolean
  data?: User
  message?: string
}> {
  const res = await apiFetchWithRefresh('/api/v1/users/avatar', {
    method: 'PATCH',
    body: formData,
  })
  return readApiResponse<User>(res)
}

export async function updateUserCoverImage(formData: FormData): Promise<{
  ok: boolean
  data?: User
  message?: string
}> {
  const res = await apiFetchWithRefresh('/api/v1/users/cover-image', {
    method: 'PATCH',
    body: formData,
  })
  return readApiResponse<User>(res)
}
