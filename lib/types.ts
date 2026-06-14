export interface Project {
  id: string
  name: string
  liveUrl?: string
  adminUrl?: string
  repoUrl?: string
  host?: string
  tags?: string[]
  note?: string
}

// 입력값: id 없이 받는다(서버가 생성)
export type ProjectInput = Omit<Project, "id">
