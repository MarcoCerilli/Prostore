"use client";

// Importazioni di React e Next.js
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { useSearchParams } from "next/navigation"; // Usato per ottenere callbackUrl se non passato come prop

// Importazioni di Componenti UI (shadcn/ui)
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react"; // Icona di caricamento
import { signUpUser } from "@/lib/actions/user.action"; // L'azione corretta per la registrazione

// Stato iniziale per l'hook useActionState
const initialState = {
  success: false,
  message: "",
  // Poiché stiamo passando callbackUrl tramite prop, non è strettamente necessario
  // recuperarlo qui con useSearchParams() se la prop è sempre definita.
};

// Definisco le props che riceve dal Server Component (page.tsx)
interface CredentialsSignUpFormProps {
    callbackUrl?: string; // URL di reindirizzamento dopo il successo
}

// Componente helper per mostrare lo stato di caricamento del bottone
const SignUpButton = () => {
  const { pending } = useFormStatus();

  return (
    <Button 
      type="submit" 
      className="w-full flex items-center justify-center" 
      disabled={pending} 
      variant="default"
    >
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Registrazione in corso...
        </>
      ) : (
        "Crea Account"
      )}
    </Button>
  );
};

/**
 * Form di Registrazione Credenziali (Client Component).
 * Utilizza Server Actions per la logica di backend.
 */
const CredentialsSignUpForm = ({ callbackUrl = "/" }: CredentialsSignUpFormProps) => {
  // Collega l'azione del server signUpUser con lo stato iniziale
  const [state, formAction] = useActionState(signUpUser, initialState);

  return (
    // L'attributo 'action' punta a formAction, che esegue signUpUser sul server
    <form action={formAction} className="w-full">
      {/* Campo nascosto per passare l'URL di reindirizzamento alla Server Action */}
      <input type="hidden" name="callbackUrl" value={callbackUrl} />
      
      <div className="space-y-4">
        
        {/* Campo Nome Completo */}
        <div>
          <Label htmlFor="name">Nome Completo</Label>
          <Input
            id="name"
            name="name"
            type="text"
            required
            autoComplete="name"
            placeholder="Il tuo nome"
          />
        </div>

        {/* Campo Email */}
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="nome@esempio.com"
          />
        </div>

        {/* Campo Password */}
        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="new-password"
          />
        </div>
        
        {/* Campo Conferma Password */}
        <div>
          <Label htmlFor="confirmpassword">Conferma Password</Label>
          <Input
            id="confirmpassword"
            name="confirmpassword"
            type="password"
            required
            autoComplete="new-password"
          />
        </div>
      </div>
      
      {/* Bottone di Invio */}
      <div className="mt-6">
        <SignUpButton />
      </div>

      {/* Messaggi di Stato (Errore/Successo) */}
      {state && state.message && (
        <div className={`text-center mt-6 p-2 rounded-md text-sm ${
            state.success
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}>
          {state.message}
        </div>
      )}

      {/* Link per l'Accesso */}
      <div className="text-sm text-center text-muted-foreground mt-4">
        Hai già un account?{" "}
        <Link 
            href={`/sign-in${callbackUrl !== '/' ? `?callbackUrl=${callbackUrl}` : ''}`} 
            target="_self" 
            className="font-semibold text-indigo-600 hover:text-indigo-500"
        >
          Accedi qui
        </Link>
      </div>
    </form>
  );
};

export default CredentialsSignUpForm;
