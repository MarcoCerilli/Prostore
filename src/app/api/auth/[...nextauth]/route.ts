// Importa l'oggetto 'handlers' dal tuo file di configurazione principale (src/auth.ts).
import { handlers } from "@/auth";

// src/app/api/auth/[...nextauth]/route.ts

// ⭐ 1. Esporta i gestori direttamente da auth.ts
// Questo è il modo corretto con Auth.js v5

export const { GET, POST } = handlers;

// Nota: A volte si vede la sintassi abbreviata:
// export { handler as GET, handler as POST } 
// Ma la versione estesa (funzioni asincrone) risolve i problemi di tipizzazione
// che stai incontrando con Next.js 16.0.3 e Turbopack.