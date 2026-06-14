import { kv } from "@vercel/kv"
import { nanoid } from "nanoid"
import type { Project, ProjectInput } from "./types"
import type { ProjectStore } from "./store"

const KEY = "projects"

export class KvStore implements ProjectStore {
  private async readAll(): Promise<Project[]> {
    const data = await kv.get<Project[]>(KEY)
    return data ?? []
  }

  private async writeAll(projects: Project[]): Promise<void> {
    await kv.set(KEY, projects)
  }

  async list(): Promise<Project[]> {
    return this.readAll()
  }

  async add(input: ProjectInput): Promise<Project> {
    const projects = await this.readAll()
    const project: Project = { id: nanoid(), ...input }
    projects.push(project)
    await this.writeAll(projects)
    return project
  }

  async update(id: string, patch: Partial<ProjectInput>): Promise<Project | null> {
    const projects = await this.readAll()
    const i = projects.findIndex((p) => p.id === id)
    if (i === -1) return null
    projects[i] = { ...projects[i], ...patch }
    await this.writeAll(projects)
    return projects[i]
  }

  async remove(id: string): Promise<boolean> {
    const projects = await this.readAll()
    const next = projects.filter((p) => p.id !== id)
    if (next.length === projects.length) return false
    await this.writeAll(next)
    return true
  }
}
