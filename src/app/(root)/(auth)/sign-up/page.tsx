import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { APP_NAME } from "@/lib/constants";
import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import React from 'react'; // Potrebbe essere necessario importarlo

// Importa il Client Component del form di registrazione
import CredentialsSignUpForm from "./sign-up-form";

// --- Configurazione Server Side ---

export const metadata: Metadata = {
  title: "Registrazione Account",
};

// Interfaccia standard per le props della pagina
interface SignUpPageProps {
    searchParams: {
        callbackUrl?: string;
    };
}

/**
 * Pagina di Registrazione (Sign Up) - Server Component.
 * Gestisce il controllo della sessione utente e mostra il form.
 */
const SignUpPage = async ({ searchParams }: SignUpPageProps) => {

const cleanSearchParams = Object.fromEntries(
    Object.entries(await Promise.resolve(searchParams)).filter(([key, value]) => typeof key === 'string')
  );
  const urlParams = new URLSearchParams(cleanSearchParams as any);
const callbackUrl = urlParams.get('callbackUrl') ?? '/';


  // 2. Controllo Sessione (Server Side)
  const session = await auth();
  
  // Se l'utente è già autenticato, reindirizza all'URL di callback o alla homepage.
  if (session) {
    // Il reindirizzamento avviene prima che il client veda la pagina (performance e sicurezza)
    return redirect(callbackUrl || "/");
  }

  // --- Rendering del Contenitore del Form ---
  return (
    <div className="w-full max-w-md mx-auto">
      <Card>
        <CardHeader className="space-y-4">
          {/* Logo/Nome App */}
          <Link href="/" className="flex justify-center items-center">
            {/* Se non hai ancora un logo, usa il nome dell'app come fallback testuale */}
            {/* <Image
               src="/images/logo.svg"
               width={100}
               height={100}
               alt={`${APP_NAME}`}
             /> */}
            <span className="text-2xl font-bold">{APP_NAME || "ProStore"}</span>
          </Link>

          <CardTitle className="text-center">Crea un Account</CardTitle>
          <CardDescription className="text-center">
            Registrati per accedere a tutte le funzionalità.
          </CardDescription>
        </CardHeader>
        
        {/* CardContent contiene solo il form */}
        <CardContent className="space-y-4">
            {/* 3. Inietta il Client Component del Form, passandogli l'URL di callback */}
            <CredentialsSignUpForm callbackUrl={callbackUrl} />
        </CardContent>
      </Card>
    </div>
  );
};

export default SignUpPage;