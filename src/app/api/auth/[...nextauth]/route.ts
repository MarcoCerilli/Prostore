// Importa l'oggetto 'handlers' dal tuo file di configurazione principale (src/auth.ts).
import { authOptions } from "@/auth";
import NextAuth from "next-auth";


const handler = NextAuth(authOptions as any)

// Espone i metodi GET e POST che sono contenuti nell'oggetto handlers.
// L'endpoint della sessione (session) utilizza il metodo GET.
export {handler as GET, handler as POST }
