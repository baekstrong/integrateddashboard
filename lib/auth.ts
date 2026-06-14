export const COOKIE_NAME = "dash_auth"

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input)
  const digest = await crypto.subtle.digest("SHA-256", data)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

export async function makeToken(password: string, secret: string): Promise<string> {
  return sha256Hex(`${password}::${secret}`)
}

// 상수시간 비교
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

export async function verifyToken(
  token: string,
  password: string,
  secret: string
): Promise<boolean> {
  if (!token) return false
  const expected = await makeToken(password, secret)
  return safeEqual(token, expected)
}

// 환경변수 헬퍼(라우트/미들웨어에서 사용)
export function getPassword(): string {
  return process.env.DASHBOARD_PASSWORD ?? ""
}
export function getSecret(): string {
  const secret = process.env.AUTH_SECRET
  if (!secret) {
    console.warn("AUTH_SECRET 미설정 — 'dev-secret' fallback 사용 중. 운영 환경에서는 반드시 설정하세요.")
    return "dev-secret"
  }
  return secret
}
