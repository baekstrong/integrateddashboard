"use client"
import { useState } from "react"

export default function LoginPage() {
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    })
    setLoading(false)
    if (res.ok) {
      window.location.href = "/"
    } else {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? "로그인 실패")
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <form onSubmit={submit} className="w-full max-w-xs space-y-4">
        <h1 className="text-xl font-semibold text-center">통합 대시보드</h1>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="비밀번호"
          autoFocus
          className="w-full rounded-md bg-neutral-800 px-3 py-2 outline-none focus:ring-2 ring-neutral-500"
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-neutral-100 text-neutral-900 py-2 font-medium disabled:opacity-50"
        >
          {loading ? "확인 중…" : "입장"}
        </button>
      </form>
    </main>
  )
}
