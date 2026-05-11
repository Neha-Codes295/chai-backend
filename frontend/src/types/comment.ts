import type { VideoOwner } from './video'

export type CommentItem = {
  _id: string
  content: string
  createdAt?: string
  updatedAt?: string
  owner?: VideoOwner | null
}

export type CommentsPagePayload = {
  data: CommentItem[]
  page: number
  limit: number
  total: number
}
