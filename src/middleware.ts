import { NextRequest, NextResponse } from "next/server";
import { edgeAuth } from "./lib/edge-auth";

function uuidv4_native() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export async function middleware(request: NextRequest) {
  // 1. Protezione rotte (Auth & Ruoli)
  const token = await edgeAuth(request);
  const currentPath = request.nextUrl.pathname;

  const protectedPaths = ["/dashboard", "/profilo"];
  const isProtected = protectedPaths.some((path) =>
    currentPath.startsWith(path)
  );

  if (isProtected) {
    if (!token) {
      const loginUrl = new URL("/sign-in", request.url);
      loginUrl.searchParams.set("callbackUrl", currentPath);
      return NextResponse.redirect(loginUrl);
    }

    // Protezione specifica per l'area Amministratore
    if (currentPath.startsWith("/dashboard/admin")) {
      const userRole = (token as { role?: string })?.role?.toLowerCase();
      if (userRole !== "admin") {
        // Utente non amministratore reindirizzato a home o orders
        return NextResponse.redirect(new URL("/dashboard/orders", request.url));
      }
    }
  }

  // 2. Gestione sessione carrello (UUID)
  const response = NextResponse.next();
  const sessionCartId = request.cookies.get("sessionCartId");

  if (!sessionCartId) {
    const newSessionCartId = uuidv4_native();

    response.cookies.set("sessionCartId", newSessionCartId, {
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 giorni
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|images|fonts|.*\\..*).*)",
  ],
};
