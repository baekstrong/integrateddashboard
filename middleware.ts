import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { COOKIE_NAME, verifyToken, getPassword, getSecret } from "./lib/auth"

const PUBLIC_PATHS = ["/login", "/api/login"]

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  if (PUBLIC_PATHS.includes(pathname)) return NextResponse.next()

  const token = req.cookies.get(COOKIE_NAME)?.value ?? ""
  const ok = await verifyToken(token, getPassword(), getSecret())
  if (ok) return NextResponse.next()

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }
  const url = req.nextUrl.clone()
  url.pathname = "/login"
  return NextResponse.redirect(url)
}

export const config = {
  // 정적 자산 제외 전부 보호
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
