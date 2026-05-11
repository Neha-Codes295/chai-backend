export type VideoOwner = {
  _id?: string
  fullname?: string
  username?: string
  avatar?: string
}

export type VideoSummary = {
  _id: string
  title: string
  thumbnail: string
  duration: number
  views?: number
  createdAt?: string
  updatedAt?: string
  owner?: VideoOwner | null
}

export type VideosPageResult = {
  docs: VideoSummary[]
  totalDocs: number
  limit: number
  page: number
  totalPages: number
  pagingCounter?: number
  hasNextPage: boolean
  hasPrevPage?: boolean
  prevPage?: number | null
  nextPage?: number | null
}

export type VideoDetail = {
  _id: string
  title: string
  description: string
  videoFile: string
  thumbnail: string
  duration: number
  views?: number
  isPublished?: boolean
  createdAt?: string
  updatedAt?: string
  owner?: VideoOwner | null
}
