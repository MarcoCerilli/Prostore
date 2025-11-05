import { getToken } from "@auth/core/jwt";
import { NextRequest } from "next/server";


// funzione EdgeAuth che useremo nel middleware

export async function edgeAuth(request: NextRequest) {
  //Leggiamo il cookie di sessione e lo decodifichiamo
  // Non usa il DB è l'approccio standard di NextAuth per il middleware
  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET, // Usa lo stesso secret di NextAuth
    cookieName:
      process.env.NODE_ENV === "production"
        ? "__Secure-authjs.session-token"
        : "authjs.session-token",
  });

  //ritorna il token decodificato (che  contiene role, id, ecc..)
  return token;
}


