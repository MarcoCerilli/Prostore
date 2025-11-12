// 📁 app/sign-in/page.tsx
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
// Importa il Client Component del form.
import CredentialsSignInform from "./credentials-signin-form"; 
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Accesso",
};

// Il Server Component riceve i parametri di ricerca
const SignInPage = async ({
  searchParams,
}: {
  searchParams: {
    callbackUrl?: string; // Può essere opzionale
  };
}) => {
 
     // ✅ CORREZIONE CRITICA PER ERRORE PROMISE
  // Nel tuo ambiente, i searchParams sono trattati come un oggetto Promise.
  // Usiamo l'await per forzare la risoluzione del Promise (tipo Next.js 13/14).
  // Nota: Dobbiamo usare 'as any' qui perché TypeScript non si aspetta 'await' su questo tipo.
  const resolvedSearchParams = await (searchParams as any);
  
  // 1. LEGGI IL CALLBACK URL PER LA LOGICA DI REINDIRIZZAMENTO DELLA SESSIONE
  // Manteniamo la lettura da resolvedSearchParams per gestire il caso "utente già loggato"
  const sessionCallbackUrl = resolvedSearchParams.callbackUrl || "/";


   

  // 2. Controlla la sessione
  const session = await auth();

  // 3. LOGICA DI REINDIRIZZAMENTO:
  if (session) {
    // Se l'utente è già loggato come ADMIN, lo mandiamo direttamente all'area admin.
    if (session.user.role === 'admin') {
        return redirect("/admin/orders");
    }
   if (sessionCallbackUrl === '/') {
        return redirect("/"); // Reindirizza a Home se non c'è un target specifico
    } else {
        return redirect(sessionCallbackUrl); // Torna alla pagina protetta
    }
  }

  // 4. Se la sessione NON esiste (utente disconnesso), mostra il form.
  return (
    <div className="w-full max-w-md mx-auto">
      <Card>
        <CardHeader className=" space-y-4">
          <Link href="/" className="flex-center">
            <Image
              src="/images/logo.svg"
              width={100}
              height={100}
              alt={`${APP_NAME}`}
            />
          </Link>
          <CardTitle className="text-center">Accesso</CardTitle>
          <CardDescription className="text-center">
            Accedi al tuo account
          </CardDescription>
        </CardHeader>
        {/* Passa il valore di fallback. La lettura reale avverrà nel Client Component. */}
        <CardContent className="space-y-4">
          <CredentialsSignInform callbackUrl="/" /> 
        </CardContent>
      </Card>
    </div>
  );
};

export default SignInPage;