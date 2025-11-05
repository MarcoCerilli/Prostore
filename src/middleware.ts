import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid'; // Importa UUID per generare ID univoci
// 💡 IMPORTIAMO LA FUNZIONE AUTH PER LA PROTEZIONE DELLE ROTTE
import { auth } from "./auth"; 

// ----------------------------------------------------
// 1. Funzione Middleware
// ----------------------------------------------------
export async function middleware(request: NextRequest) {
    
    // ------------------------------------
    // LOGICA 1: PROTEZIONE ROTTE (AUTH)
    // ------------------------------------
    const session = await auth();
    const protectedPaths = ["/checkout", "/dashboard", "/profilo"];
    const currentPath = request.nextUrl.pathname;
    const isProtected = protectedPaths.some(path => currentPath.startsWith(path));

    if (isProtected) {
        if (!session?.user) {
            // Se non autenticato e la rotta è protetta, reindirizza al login
            const loginUrl = new URL("/login", request.url);
            loginUrl.searchParams.set("callbackUrl", currentPath);
            // ⚠️ Non usiamo NextResponse.next(), ma NextResponse.redirect() qui
            return NextResponse.redirect(loginUrl);
        }
    }

    // ------------------------------------
    // LOGICA 2: GESTIONE SESSIONE CARRELLO (UUID)
    // ------------------------------------
    let response = NextResponse.next();
    const sessionCartId = request.cookies.get('sessionCartId');

    // Se il cookie del carrello NON esiste, creane uno nuovo
    if (!sessionCartId) {
        const newSessionCartId = uuidv4();
        
        // Se c'è un redirect o una modifica dello stato, lavoriamo sulla response
        response.cookies.set('sessionCartId', newSessionCartId, {
            path: '/', 
            maxAge: 60 * 60 * 24 * 7, 
            secure: process.env.NODE_ENV === 'production', 
            sameSite: 'lax',
        });
        console.log(`[Middleware] Generata nuova sessione carrello: ${newSessionCartId}`);
    } else {
        console.log(`[Middleware] Sessione carrello esistente rilevata: ${sessionCartId.value}`);
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
        '/((?!api|_next/static|_next/image|favicon.ico|images|fonts|.*\\..*).*)',
    ],
};
