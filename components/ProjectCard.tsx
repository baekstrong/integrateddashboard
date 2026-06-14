import type { Project } from "@/lib/types"

function LinkButton({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="rounded bg-neutral-800 px-2.5 py-1 text-xs hover:bg-neutral-700"
    >
      {label}
    </a>
  )
}

export function ProjectCard({
  project,
  onEdit,
  onDelete,
}: {
  project: Project
  onEdit: (p: Project) => void
  onDelete: (p: Project) => void
}) {
  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4 flex flex-col gap-2">
      <div className="flex items-start justify-between gap-2">
        <h2 className="font-semibold">{project.name}</h2>
        {project.host && (
          <span className="shrink-0 rounded bg-neutral-800 px-2 py-0.5 text-[11px] text-neutral-400">
            {project.host}
          </span>
        )}
      </div>
      {project.tags && project.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {project.tags.map((t) => (
            <span key={t} className="rounded bg-neutral-800 px-1.5 py-0.5 text-[11px] text-neutral-300">
              #{t}
            </span>
          ))}
        </div>
      )}
      <div className="flex flex-wrap gap-1.5">
        {project.liveUrl && <LinkButton href={project.liveUrl} label="라이브" />}
        {project.adminUrl && <LinkButton href={project.adminUrl} label="관리" />}
        {project.repoUrl && <LinkButton href={project.repoUrl} label="레포" />}
      </div>
      {project.note && <p className="text-xs text-neutral-400">{project.note}</p>}
      <div className="mt-1 flex gap-2 text-xs text-neutral-500">
        <button onClick={() => onEdit(project)} className="hover:text-neutral-200">편집</button>
        <button onClick={() => onDelete(project)} className="hover:text-red-400">삭제</button>
      </div>
    </div>
  )
}
