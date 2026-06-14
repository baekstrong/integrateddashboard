"use client"
import { useState } from "react"
import type { Project, ProjectInput } from "@/lib/types"
import { ProjectCard } from "./ProjectCard"
import { ProjectForm } from "./ProjectForm"

type FormState = { open: false } | { open: true; editing?: Project }

export function DashboardClient({ initial }: { initial: Project[] }) {
  const [projects, setProjects] = useState<Project[]>(initial)
  const [form, setForm] = useState<FormState>({ open: false })

  async function create(input: ProjectInput) {
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    })
    if (res.ok) {
      const created: Project = await res.json()
      setProjects((prev) => [...prev, created])
    }
    setForm({ open: false })
  }

  async function update(id: string, input: ProjectInput) {
    const res = await fetch(`/api/projects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    })
    if (res.ok) {
      const updated: Project = await res.json()
      setProjects((prev) => prev.map((p) => (p.id === id ? updated : p)))
    }
    setForm({ open: false })
  }

  async function remove(p: Project) {
    if (!confirm(`"${p.name}" 카드를 삭제할까요?`)) return
    const res = await fetch(`/api/projects/${p.id}`, { method: "DELETE" })
    if (res.ok) setProjects((prev) => prev.filter((x) => x.id !== p.id))
  }

  async function logout() {
    await fetch("/api/logout", { method: "POST" })
    window.location.href = "/login"
  }

  return (
    <main className="mx-auto max-w-5xl p-6">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">내 프로젝트</h1>
        <div className="flex gap-2">
          <button onClick={() => setForm({ open: true })} className="rounded-md bg-neutral-100 px-3 py-1.5 text-sm font-medium text-neutral-900">+ 추가</button>
          <button onClick={logout} className="rounded-md px-3 py-1.5 text-sm text-neutral-400 hover:text-neutral-200">로그아웃</button>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((p) => (
          <ProjectCard key={p.id} project={p} onEdit={(proj) => setForm({ open: true, editing: proj })} onDelete={remove} />
        ))}
      </div>

      {form.open && (
        <ProjectForm
          initial={form.editing}
          onCancel={() => setForm({ open: false })}
          onSubmit={(input) => (form.editing ? update(form.editing.id, input) : create(input))}
        />
      )}
    </main>
  )
}
