import { shippingAddress } from "@/types";

export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "Il Tuo Nome Default";
export const APP_DESCRIPTION =
  process.env.NEXT_PUBLIC_APP_DESCRIPTION ||
  "E-commerce moderno sviluppato NEXT.JS";
export const SERVER_URL =
  process.env.NEXT_PUBLIC_SERVER_URL || "https://prostore-gamma-six.vercel.app";

export const LATEST_PRODUCTS_LIMIT =
  Number(process.env.LATEST_PRODUCTS_LIMIT) || 4;

export const signInDefaultValues = {
  email: "",
  password: "",
};
export const signUpDefaultValues = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
};

export const shippingAddressValues: shippingAddress = {
  firstName: "",
  lastName: "",
  street: "",
  houseNumber: "",
  phoneNumber: "",
  city: "",
  postalCode: "",
  country: "Italia",
  latitude: null,
  longitude: null,
};

export const productDefaultValues = {
  name: "",
  slug: "",
  category: "",
  image: [],
  brand: "",
  description: "",
  price: 0,
  stock: 0,
  rating: 0,
  numReviews: 0,
  isFeatured: false,
  banner: null,
};


export const  USER_ROLES = process.env.USER_ROLES?.split(",") || ["user","admin"];

export const  reviewFormDefaultValues = {
    title: "",
    description: "",
    rating: 1,
};

export const SENDER_EMAIL = process.env.SENDER_EMAIL || "onboarding@resend.dev" 





/*
 * =================================================================================
 * NOTE DI RIPASSO CRITICHE PER PRISMA, NEXT.JS E TYPESCRIPT
 * =================================================================================
 * * 1. PROBLEMI DI CARICAMENTO AMBIENTE (DATABASE_URL)
 * ---------------------------------------------------
 * CAUSA: Il compilatore (o la CLI di Prisma/tsx) NON legge automaticamente il .env.
 * SOLUZIONE:
 * - ELIMINARE: il file 'prisma.config.ts' (interferisce con il caricamento CLI).
 * - MIGRAZIONE/SEEDING: Usare sempre il flag --env-file=.env per i comandi:
 * es. npx tsx --env-file=.env ./db/seed.ts
 * * ---------------------------------------------------
 * 2. RISOLUZIONE MODULI (TSCONFIG)
 * ---------------------------------------------------
 * PROBLEMA: Errori di 'Module not found: Can't resolve @/...' (Alias di percorso).
 * CAUSA: Manca la configurazione dell'alias '@/' o è deprecata.
 * SOLUZIONE NEL tsconfig.json:
 * - Rimuovere: "baseUrl": "." (obsoleto, causa avviso).
 * - Impostare: "moduleResolution": "bundler" (risolve deprecazione di 'node10').
 * - Aggiungere/Verificare: Alias '@/' nel blocco 'paths':
 * "paths": { "@/*": ["./*"] }
 * * ---------------------------------------------------
 * 3. ERRORE DI GENERAZIONE PRISMA (enums.js non trovato)
 * ---------------------------------------------------
 * CAUSA: I file auto-generati del Prisma Client non sono coerenti o non sono presenti.
 * SOLUZIONE: Forza la rigenerazione completa del Client:
 * - Eseguire: npx prisma generate
 * - (Se persiste, controllare 'output' nel blocco 'generator client' in schema.prisma).
 * * ---------------------------------------------------
 * 4. SERIALIZZAZIONE E PULIZIA OGGETTI (Funzione convertToPlainObject)
 * ---------------------------------------------------
 * SCOPO: Rende l'oggetto restituito da Prisma Client sicuro per l'utilizzo nel frontend
 * o nelle API, eliminando metodi e proxy interni per una corretta serializzazione JSON.
 * UTILIZZO: Richiesto quando si passano oggetti da Server Component a Client Component in Next.js.
 * * ---------------------------------------------------
 * 5. CONSTANTI E VARIABILI D'AMBIENTE
 * ---------------------------------------------------
 * SCOPO: Disaccoppiare la configurazione (es. LATEST_PRODUCTS_LIMIT) dal codice sorgente.
 * USO: export const LIMIT = Number(process.env.LIMIT) || DEFAULT_VALUE;
 * - process.env: Permette di cambiare il valore tramite file .env o hosting.
 * - || DEFAULT_VALUE: Fornisce un fallback sicuro per evitare crash.
 * =================================================================================
 */
