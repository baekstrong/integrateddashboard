import { nanoid } from "nanoid"
import type { Project, ProjectInput } from "./types"

export interface ProjectStore {
  list(): Promise<Project[]>
  add(input: ProjectInput): Promise<Project>
  update(id: string, patch: Partial<ProjectInput>): Promise<Project | null>
  remove(id: string): Promise<boolean>
}

export class InMemoryStore implements ProjectStore {
  private projects: Project[]

  constructor(seed: Project[] = []) {
    this.projects = [...seed]
  }

  async list(): Promise<Project[]> {
    return [...this.projects]
  }

  async add(input: ProjectInput): Promise<Project> {
    const project: Project = { id: nanoid(), ...input }
    this.projects.push(project)
    return project
  }

  async update(id: string, patch: Partial<ProjectInput>): Promise<Project | null> {
    const i = this.projects.findIndex((p) => p.id === id)
    if (i === -1) return null
    this.projects[i] = { ...this.projects[i], ...patch }
    return this.projects[i]
  }

  async remove(id: string): Promise<boolean> {
    const before = this.projects.length
    this.projects = this.projects.filter((p) => p.id !== id)
    return this.projects.length < before
  }
}
