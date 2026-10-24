import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { LOCALE_COOKIE } from "@/lib/i18n/config"

// Shareable language links: /en/doctors/12 stores the "en" choice in a cookie
// and redirects to /doctors/12. Routes themselves are not locale-prefixed.
export function proxy(request: NextRequest) {
  const [, locale, ...rest] = request.nextUrl.pathname.split("/")
  const url = request.nextUrl.clone()
  url.pathname = `/${rest.join("/")}`
  const response = NextResponse.redirect(url)
  response.cookies.set(LOCALE_COOKIE, locale, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" })
  return response
}

export const config = {
  matcher: ["/en", "/en/:path*", "/cs", "/cs/:path*"],
}
