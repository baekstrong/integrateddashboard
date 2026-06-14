import "./globals.css"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "통합 대시보드" }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  )
}
