import { PrismaClient } from "@prisma/client";

// Inizializza il client di Prisma una sola volta

// In Next.js, creiamo una variabile globale per riutilizzare l'istanza di Prisma
// tra i re-compile del server, evitando avvertimenti fastidiosi.
// Tuttavia, questa variabile non dovrebbe esistere in produzione.

const prismaClientSingleton = () => {
  // Garantisce che l'istanza abbia sempre il DATABASE_URL corretto
  // Se la variabile non è definita nell'ambiente, utilizza quella del .env.local
  const url = process.env.DATABASE_URL; 
  if (!url) {
      console.error("ERRORE: DATABASE_URL non trovato. Controllare il file .env.local.");
  }
  
  return new PrismaClient({
    datasources: {
      db: {
        // Se URL è undefined, Prisma fallirà (come desiderato),
        // ma in questo modo forziamo l'uso della variabile d'ambiente
        url: url, 
      },
    },
  });
};

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

export const prisma = globalThis.prismaGlobal ?? prismaClientSingleton(); // Modificato in export nominata

if (process.env.NODE_ENV !== "production") globalThis.prismaGlobal = prisma;
