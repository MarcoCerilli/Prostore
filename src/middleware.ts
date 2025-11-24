import { NextRequest, NextResponse } from "next/server";
import { edgeAuth } from "./lib/edge-auth";

// ----------------------------------------------------
// FUNZIONE NATIVA PER GENERARE UUID V4 (Alternativa a uuid)
// Fonte: standard RFC4122/StackOverflow. Estremamente leggera.
// ----------------------------------------------------
function uuidv4_native() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0,
      v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// ----------------------------------------------------
// 1. Funzione Middleware
// ----------------------------------------------------
export async function middleware(request: NextRequest) {
  // ------------------------------------
  // LOGICA 1: PROTEZIONE ROTTE (AUTH)
  // ------------------------------------
  const token = await edgeAuth(request);

  const protectedPaths = ["/dashboard", "/profilo"];
  const currentPath = request.nextUrl.pathname;
  const isProtected = protectedPaths.some((path) =>
    currentPath.startsWith(path)
  );

  if (isProtected) {
    if (!token) {
      // Se non autenticato e la rotta è protetta, reindirizza al login
      const loginUrl = new URL("/sign-in", request.url);
      loginUrl.searchParams.set("callbackUrl", currentPath);
      return NextResponse.redirect(loginUrl);
    }
  }

  // ------------------------------------
  // LOGICA 2: GESTIONE SESSIONE CARRELLO (UUID)
  // ------------------------------------
  let response = NextResponse.next();
  const sessionCartId = request.cookies.get("sessionCartId");

  // Se il cookie del carrello NON esiste, creane uno nuovo
  if (!sessionCartId) {
    const newSessionCartId = uuidv4_native();

    // Se c'è un redirect o una modifica dello stato, lavoriamo sulla response
    response.cookies.set("sessionCartId", newSessionCartId, {
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });
    console.log(
      `[Middleware] Generata nuova sessione carrello: ${newSessionCartId}`
    );
  } else {
    console.log(
      `[Middleware] Sessione carrello esistente rilevata: ${sessionCartId.value}`
    );
  }

  // Se il middleware non ha già reindirizzato (Logica 1), restituisce la risposta aggiornata (Logica 2)
  return response;
}

// ----------------------------------------------------
// 2. Configurazione (Specifica quali percorsi intercettare)
// ----------------------------------------------------
export const config = {
  // Intercetta TUTTE le rotte tranne gli asset, le API e i percorsi interni di Next.js
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|images|fonts|.*\\..*).*)",
  ],
};

// console.log("Force new build 2025-11-05");
