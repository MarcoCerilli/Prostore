// 📁 components/sign-in/credentials-signin-form.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signInDefaultValues } from "@/lib/constants";
import Link from "next/link";

// Usiamo l'hook per leggere i parametri e la funzione signIn per l'accesso client-side
import { useSearchParams } from "next/navigation"; 
import { signIn } from "next-auth/react"; 
import { useState } from "react"; // Per gestire lo stato di caricamento/errore

// Definiamo le props, ma sappiamo che la prop passata dal Server è sempre "/" (placeholder)
const CredentialsSignInform = ({ callbackUrl }: { callbackUrl: string }) => { 
  
  // STATI LOCALI PER ERRORE E CARICAMENTO
  // ✅ CORREZIONE: Usiamo un URLSearchParams per leggere l'errore se presente nell'URL
  const searchParams = useSearchParams();
  const initialError = searchParams.get("error");
  
  const [error, setError] = useState<string | null>(initialError);
  const [isLoading, setIsLoading] = useState(false);

  // Leggiamo il callbackUrl reale dai parametri di ricerca
  const actualCallbackUrl = searchParams.get("callbackUrl") || "/";
  
  // Gestione dell'invio del form tramite funzione Client-side
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null); // Pulisce l'errore precedente, compreso quello nell'URL

    const formData = new FormData(event.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    // 1. Chiamiamo la funzione client-side signIn di NextAuth
    // Usando redirect: true, NextAuth gestisce l'errore reindirizzando a /sign-in?error=...
    await signIn('credentials', {
      email,
      password,
      // 2. Passiamo il callbackUrl reale
      callbackUrl: actualCallbackUrl,
      redirect: true, 
    });
    
    // ✅ CORREZIONE CRITICA: Se signIn fallisce (e non reindirizza) o in caso di bug,
    // dobbiamo ASSICURARCI che isLoading venga reimpostato su false.
    // Nella maggior parte dei casi, questo codice non verrà raggiunto se redirect: true funziona correttamente
    // (perché il client viene reindirizzato prima che il codice qui sotto venga eseguito).
    // Tuttavia, aggiungerlo è un buon fallback di sicurezza.
    setIsLoading(false);
  };
  
  const SignInButton = () => (
      <Button disabled={isLoading} className="w-full" variant="default">
        {isLoading ? "Signing In..." : "Accedi"}
      </Button>
    );
  
  // Helper per mostrare un messaggio di errore leggibile
  const getErrorMessage = (errorCode: string | null) => {
    if (!errorCode) return null;
    return errorCode === 'CredentialsSignin' ? 'Credenziali non valide.' : `Errore: ${errorCode}`;
  }

  return (
    <form onSubmit={handleSubmit}> 
      <div className="space-y-6">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            defaultValue={signInDefaultValues.email}
          />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="password"
            defaultValue={signInDefaultValues.password}
          />
        </div>
      </div>
      <div className="mt-6">
        <SignInButton />
      </div>
      
      {/* Visualizzazione degli errori da stato locale o URL */}
      {getErrorMessage(error) && (
        <div className="text-center text-destructive mt-6">
            {getErrorMessage(error)}
        </div>
      )}

      <div className="text-sm text-center text-muted-foreground mt-6">
        Non hai un account?{" "}
        <Link
          href="sign-up"
          target="_self"
          className="font-semibold text-indigo-600 hover:text-indigo-500"
        >
          Registrati
        </Link>
      </div>
    </form>
  );
};

export default CredentialsSignInform;