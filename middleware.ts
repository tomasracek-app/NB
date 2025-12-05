import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const { nextUrl } = req;

  // Získáme token z JWT (nepoužívá Prisma)
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET
  });

  const isLoggedIn = !!token;
  const userRole = token?.role as "ADMIN" | "CLIENT" | undefined;

  // Veřejné cesty - nevyžadují autentizaci
  const publicPaths = ["/login", "/api/auth"];
  const isPublicPath = publicPaths.some((path) =>
    nextUrl.pathname.startsWith(path)
  ) || nextUrl.pathname === "/";

  // Pokud je veřejná cesta, povolit přístup
  if (isPublicPath) {
    // Pokud je přihlášený a jde na login, přesměrovat
    if (isLoggedIn && nextUrl.pathname === "/login") {
      if (userRole === "ADMIN") {
        return NextResponse.redirect(new URL("/admin", nextUrl));
      }
      return NextResponse.redirect(new URL("/dashboard", nextUrl));
    }
    return NextResponse.next();
  }

  // Pokud není přihlášený, přesměrovat na login
  if (!isLoggedIn) {
    const loginUrl = new URL("/login", nextUrl);
    loginUrl.searchParams.set("callbackUrl", nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Admin cesty - pouze pro adminy
  if (nextUrl.pathname.startsWith("/admin")) {
    if (userRole !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", nextUrl));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Chránit všechny cesty kromě statických souborů a API health
    "/((?!_next/static|_next/image|favicon.ico|api/health).*)",
  ],
};
