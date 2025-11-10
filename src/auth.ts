// Gestisce l'intera logica di autenticazione: Adapter, Providers e Callbacks.

import NextAuth, { User as NextAuthUser } from "next-auth"; 
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcrypt-ts-edge";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "@/db/prisma";

// *NOTA*: Aggiungiamo 'password' al tipo esteso qui per consistenza e tipizzazione
type ExtendedUser = NextAuthUser & {
    role: string;
    id: string;
    // ⭐ AGGIUNTO: Incluso nel tipo per NextAuth
    password: string | null; 
};


const nextAuthInstance = NextAuth({
  // 1. ADAPTER
  adapter: PrismaAdapter(prisma) as any, 

  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      }, 

      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          return null;
        } 

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        }); 

        if (!user || !user.password) {
          // Ritorna l'utente se esiste ma la password è null (es. Login tramite Google)
            // Se l'utente non ha password, non può loggare con credentials, quindi return null
            return null;
        } 

        const isPasswordValid = await compare(
          credentials.password as string,
          user.password
        );

        if (isPasswordValid) {
          // ⭐ AGGIUNTO: Ritorna l'oggetto utente COMPLETO, inclusa la password
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role, 
            password: user.password, // ⭐ DEVE essere incluso qui per essere disponibile in JWT
          } as ExtendedUser; // Cast all'ExtendedUser
        }

        return null; // Password errata
      },
    }),
  ], // 3. CALLBACKS: Assicurano che i dati (come il ruolo) vengano inclusi nella sessione

  callbacks: {
    // 3a. JWT Callback: Iniettare le proprietà extra nel token JWT
    async jwt({ token, user }) {
      if (user) {
        // Cast all'ExtendedUser (che ora include la password)
        const extendedUser = user as ExtendedUser; 

        token.id = extendedUser.id;
        token.role = extendedUser.role;
        // ⭐ AGGIUNTO: Aggiungi la password al token
        token.password = extendedUser.password; 

        // --- Logica di Personalizzazione del Nome ---

        let userName = extendedUser.name;

        if (!userName || userName === "NO_NAME") {
          const nameFromEmail = extendedUser.email!.split("@")[0];
          userName = nameFromEmail;

          await prisma.user.update({
            where: { id: extendedUser.id },
            data: { name: nameFromEmail },
          });
        }

        token.name = userName;
      }

      return token;
    },

    // 3b. Session Callback: Prelevare le proprietà dal token e aggiungerle alla sessione
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        // ⭐ AGGIUNTO: Trasferisci la password dal token alla sessione
        session.user.password = token.password as string | null;
        // console.log(token)
      }
      return session;
    },
  }, // 4. ALTRE IMPOSTAZIONI

  session: {
    strategy: "jwt", 
  },
  pages: {
    signIn: "/login", 
  },
});

// *NUOVA ESPORTAZIONE*: Esporta l'oggetto handlers in modo esplicito
export const handlers = nextAuthInstance.handlers;

// *NUOVA ESPORTAZIONE*: Esporta le funzioni server-side per l'uso programmatico
export const { auth, signIn, signOut } = nextAuthInstance;