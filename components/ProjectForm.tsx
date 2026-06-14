"use client"
import { useState } from "react"
import type { Project, ProjectInput } from "@/lib/types"

export function ProjectForm({
  initial,
  onCancel,
  onSubmit,
}: {
  initial?: Project
  onCancel: () => void
  onSubmit: (input: ProjectInput) => Promise<void>
}) {
  const [name, setName] = useState(initial?.name ?? "")
  const [liveUrl, setLiveUrl] = useState(initial?.liveUrl ?? "")
  const [adminUrl, setAdminUrl] = useState(initial?.adminUrl ?? "")
  const [repoUrl, setRepoUrl] = useState(initial?.repoUrl ?? "")
  const [host, setHost] = useState(initial?.host ?? "")
  const [tags, setTags] = useState((initial?.tags ?? []).join(", "))
  const [note, setNote] = useState(initial?.note ?? "")
  const [saving, setSaving] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    await onSubmit({
      name: name.trim(),
      liveUrl: liveUrl.trim() || undefined,
      adminUrl: adminUrl.trim() || undefined,
      repoUrl: repoUrl.trim() || undefined,
      host: host.trim() || undefined,
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      note: note.trim() || undefined,
    })
    setSaving(false)
  }

  const field = "w-full rounded-md bg-neutral-800 px-3 py-2 text-sm outline-none focus:ring-2 ring-neutral-500"

  return (
    <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/60 p-4" onClick={onCancel}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        className="w-full max-w-md space-y-2 rounded-lg border border-neutral-800 bg-neutral-900 p-5"
      >
        <h2 className="mb-2 font-semibold">{initial ? "카드 편집" : "새 카드"}</h2>
        <input className={field} placeholder="이름 *" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        <input className={field} placeholder="라이브 URL" value={liveUrl} onChange={(e) => setLiveUrl(e.target.value)} />
        <input className={field} placeholder="관리자 URL" value={adminUrl} onChange={(e) => setAdminUrl(e.target.value)} />
        <input className={field} placeholder="레포 URL" value={repoUrl} onChange={(e) => setRepoUrl(e.target.value)} />
        <input className={field} placeholder="호스팅 (예: Vercel)" value={host} onChange={(e) => setHost(e.target.value)} />
        <input className={field} placeholder="태그 (쉼표로 구분)" value={tags} onChange={(e) => setTags(e.target.value)} />
        <input className={field} placeholder="메모" value={note} onChange={(e) => setNote(e.target.value)} />
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onCancel} className="rounded-md px-3 py-1.5 text-sm text-neutral-400 hover:text-neutral-200">취소</button>
          <button type="submit" disabled={saving} className="rounded-md bg-neutral-100 px-3 py-1.5 text-sm font-medium text-neutral-900 disabled:opacity-50">
            {saving ? "저장 중…" : "저장"}
          </button>
        </div>
      </form>
    </div>
  )
}
