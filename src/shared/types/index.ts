export interface Bookmark {
  id: string
  path: string
  name: string
  icon?: string
  lastAccessed: Date
  addedAt: Date
  order: number
  pinned: boolean
}
