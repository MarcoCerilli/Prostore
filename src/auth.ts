// Gestisce l'intera logica di autenticazione: Adapter, Providers e Callbacks.

import NextAuth, { User as NextAuthUser } from "next-auth"; // Importa User come NextAuthUser per evitare conflitti
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcrypt-ts-edge";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "@/db/prisma";


// Cattura l'intero oggetto NextAuth configurato per esportare gli handler e le funzioni server-side.
const nextAuthInstance = NextAuth({
  // 1. ADAPTER: Collega l'autenticazione a Prisma
  // USO 'as any' QUI PER AGGIRARE IL CONFLITTO DI TIPIZIONE DELLE DIPENDENZE
  adapter: PrismaAdapter(prisma) as any,

  // 2. PROVIDERS: Definisce i metodi di login (Credentials = email/password)
  providers: [
    Credentials({
      // Definisce i campi che NextAuth si aspetta (email e password)
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },

      // La funzione di autorizzazione, dove verifichiamo le credenziali
      async authorize(credentials) {
        // Verifica preliminare delle credenziali
        if (!credentials?.email || !credentials.password) {
          return null;
        }

        // 1. Cerca l'utente nel database
        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        // 2. Gestisce il caso in cui l'utente non esista o non abbia una password hashata
        if (!user || !user.password) {
          return null;
        }

        // 3. Verifica la password hashata con bcrypt
        const isPasswordValid = await compare(
          credentials.password as string,
          user.password
        );

        if (isPasswordValid) {
          // Ritorna l'oggetto utente esteso (ID, email, name, role)
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role, // Aggiunto per il controllo di autorizzazione
          };
        }

        return null; // Password errata
      },
    }),
  ],

  // 3. CALLBACKS: Assicurano che i dati (come il ruolo) vengano inclusi nella sessione
  callbacks: {
    // 3a. JWT Callback: Iniettare le proprietà extra nel token JWT
    async jwt({ token, user }) {
      if (user) {
        // CORREZIONE: Usiamo il casting per dire a TypeScript che questo utente ha la proprietà 'role'
        const extendedUser = user as NextAuthUser & {
          role: string;
          id: string;
        };

        // Aggiungiamo ID e Role al token
        token.id = extendedUser.id;
        token.role = extendedUser.role;
      }
      return token;
    },

    // 3b. Session Callback: Prelevare le proprietà dal token e aggiungerle alla sessione
    async session({ session, token }) {
      if (session.user) {
        // Prendiamo l'ID e Role dal token (tipo JWT) e li assegniamo alla sessione
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },

  // 4. ALTRE IMPOSTAZIONI
  session: {
    strategy: "jwt", // Usiamo la strategia JWT, necessaria per i callback sopra
  },
  pages: {
    signIn: "/login", // Pagina di login personalizzata (se ne hai una)
  },
});

// *NUOVA ESPORTAZIONE*: Esporta l'oggetto handlers in modo esplicito
export const handlers = nextAuthInstance.handlers; 

// *NUOVA ESPORTAZIONE*: Esporta le funzioni server-side per l'uso programmatico
export const { auth, signIn, signOut } = nextAuthInstance;
