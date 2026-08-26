import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/session-cookie";

export async function proxy(req: NextRequest) {
  const session = req.cookies.get(SESSION_COOKIE)?.value;

  const isLogin = req.nextUrl.pathname.startsWith("/login");

  if (!session && !isLogin) {
    const url = new URL("/login", req.url);
    url.searchParams.set("from", req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  if (session && isLogin) {
    return NextResponse.redirect(new URL("/", req.url));
  }
  return NextResponse.next();
}

export const config = {
  // vše kromě statiky a favicon
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|ico)$).*)"],
};
