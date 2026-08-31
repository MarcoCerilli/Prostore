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
  searchParams: Promise<{
    callbackUrl?: string;
  }>;
}) => {
  const resolvedSearchParams = await searchParams;
  const sessionCallbackUrl = resolvedSearchParams?.callbackUrl || "/";


   

  // 2. Controlla la sessione
  const session = await auth();

  // 3. LOGICA DI REINDIRIZZAMENTO:
  if (session) {
    // Se l'utente è già loggato come ADMIN, lo mandiamo direttamente all'area admin.
    if (session.user.role?.toLowerCase() === 'admin') {
      return redirect("/dashboard/admin");
    }
    if (sessionCallbackUrl === '/') {
      return redirect("/");
    } else {
      return redirect(sessionCallbackUrl);
    }
  }

  // 4. Se la sessione NON esiste (utente disconnesso), mostra il form.
  return (
   <div className="flex items-center justify-center min-h-screen p-4 bg-gray-50"> 
  {/* Aggiunta di bg-gray-50 per un migliore contrasto visivo */}
  <div className="w-full max-w-md">
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
      <CardContent className="space-y-4">
        <CredentialsSignInform callbackUrl="/" /> 
      </CardContent>
    </Card>
  </div>
</div>
  );
};

export default SignInPage;