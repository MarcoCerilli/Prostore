// 📁 File: src/auth.ts (COMPLETO E CORRETTO)
// Gestisce l'intera logica di autenticazione: Adapter, Providers e Callbacks.

import NextAuth, { User as NextAuthUser } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcrypt-ts-edge";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "@/db/prisma";

// Rimuoviamo la password dal tipo ExtendedUser per motivi di sicurezza
type ExtendedUser = NextAuthUser & {
  role: string;
  id: string;
};

// 🛑 DEFINIZIONE ED ESPORTAZIONE DELL'OGGETTO DI CONFIGURAZIONE (authOptions)
export const authOptions = {
    url: process.env.AUTH_URL || 'https://prostore-gamma-six.vercel.app',
  // 1. ADAPTER
  adapter: PrismaAdapter(prisma) as any,

  providers: [
    // ... (providers, authorize, callbacks - il codice è corretto e non ometto nulla)
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
          return null;
        }

        const isPasswordValid = await compare(
          credentials.password as string,
          user.password
        );

        if (isPasswordValid) {
          // ⭐ NON RESTITUIRE LA PASSWORD
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          } as ExtendedUser;
        }

        return null; // Password errata
      },
    }),
  ], // 3. CALLBACKS: Assicurano che i dati (come il ruolo) vengano inclusi nella sessione

  callbacks: {
    // 3a. JWT Callback: Iniettare le proprietà extra nel token JWT
    async jwt({ token, user, trigger, session }: any) {
      // Usiamo 'any' qui per semplicità di importazione NextAuth
      if (user) {
        const extendedUser = user as ExtendedUser;

        token.id = extendedUser.id;
        token.role = extendedUser.role; // --- Logica di Personalizzazione del Nome ---

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
    }, // 3b. Session Callback: Prelevare le proprietà dal token e aggiungerle alla sessione

    async session({ session, token }: any) {
      // Usiamo 'any' qui per semplicità di importazione NextAuth
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt" as const,
  },
  pages: {
    signIn: "/sign-in",
  },
} as const;

// Passiamo l'oggetto di configurazione all'istanza NextAuth
const nextAuthInstance = NextAuth(authOptions as any);

// Esporta l'oggetto handlers e le funzioni server-side per l'uso programmatico
export const handlers = nextAuthInstance.handlers;

// 🛑 CORREZIONE QUI: Rimuovi 'auth' dalla destrutturazione
export const { signIn, signOut } = nextAuthInstance;
export const { auth } = nextAuthInstance; // La funzione 'auth' è trattata separatamente