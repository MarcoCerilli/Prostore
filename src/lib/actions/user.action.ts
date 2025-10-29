"use server";

import { signInFormSchema, signUpFormSchema } from "../validators"; // CORREZIONE: Assumo sia 'schemas' e non 'validators'
import { signIn, signOut } from "@/auth";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { hashSync } from "bcrypt-ts-edge";
import prisma from "@/db/prisma";

// --- FUNZIONI DI AUTENTICAZIONE E REGISTRAZIONE ---

/**
 * Server Action per l'accesso utente con credenziali (Email/Password).
 * Utilizza la Server Action API di Next.js (`useActionState`).
 * @param prevState Lo stato precedente, fornito da useActionState.
 * @param formData I dati del form inviati.
 * @returns {Promise<{success: boolean, message: string}>} Oggetto stato.
 */
export async function signInWithCredentials(
  prevState: unknown,
  formData: FormData
) {
  try {
    // 1. Validazione con Zod: verifica che email e password siano formattate correttamente.
    // Usiamo `as string` per indicare a TypeScript che ci aspettiamo solo stringhe dai campi di input testuali.
    const { email, password } = signInFormSchema.parse({
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      // Il campo callbackUrl viene passato per reindirizzare l'utente dopo il successo
    });

    // 2. Tentativo di accesso: Chiama la funzione signIn di NextAuth.
    // Se l'accesso ha successo, NextAuth gestisce il reindirizzamento (se specificato nella configurazione).
    // Usiamo `as string | null` per `redirectTo` poiché potrebbe non essere fornito
    const redirectTo = formData.get("callbackUrl") as string | null;

    await signIn("credentials", {
      email,
      password,
      redirectTo: redirectTo || "/",
    });

    // Questa riga è teoricamente irraggiungibile in caso di successo (per via del redirect),
    // ma la manteniamo come fallback.
    return { success: true, message: "Loggato con successo" };
  } catch (error) {
    // 3. Gestione degli errori di autenticazione e reindirizzamento

    // Se l'errore è un reindirizzamento (lanciato dal successo di signIn), lo rilancia.
    // Questo è vitale per la gestione dei Server Component in Next.js.
    if (isRedirectError(error)) {
      throw error;
    }

    // Se l'errore è dovuto a credenziali non valide, restituisce un messaggio specifico.
    if ((error as any).type === "CredentialsSignin") {
      return { success: false, message: "Password o Email non valida" };
    }

    // Rilancia qualsiasi altro errore imprevisto.
    return { success: false, message: "Errore sconosciuto durante l'accesso." };
  }
}

// ---

/**
 * Server Action per il logout utente.
 * Utilizza la funzione signOut di NextAuth per terminare la sessione.
 */
export async function signOutUser() {
  await signOut();
  // NextAuth gestirà automaticamente il reindirizzamento dopo il logout.
}

// ---

/**
 * Server Action per la registrazione di un nuovo utente.
 * @param prev Lo stato precedente.
 * @param formData I dati del form inviati.
 * @returns {Promise<{success: boolean, message: string}>} Oggetto stato.
 */
export async function signUpUser(prev: unknown, formData: FormData) {
  try {
    // 1. Validazione con Zod
    // Usiamo `as string` per indicare a TypeScript che ci aspettiamo solo stringhe dai campi di input testuali.
    const rawUser = signUpFormSchema.parse({
      name: (formData.get("name") as string).trim(),
      email: (formData.get("email") as string).trim(),
      password: (formData.get("password") as string).trim(),
      confirmpassword: (formData.get("confirmpassword") as string).trim()
    });

    // 2. Controllo password
    if (rawUser.password !== rawUser.confirmpassword) {
      return { success: false, message: "Le password non corrispondono." };
    }

    // 3. Verifica esistenza email (Best Practice)
    const existingUser = await prisma.user.findUnique({
      where: { email: rawUser.email },
    });
    if (existingUser) {
      return { success: false, message: "Questa email è già registrata." };
    }

    // 4. Crittografia della password
    const plainPassword = rawUser.password;
    const hashedPassword = hashSync(rawUser.password, 10);

    // 5. Creazione dell'utente nel database
    await prisma.user.create({
      data: {
        name: rawUser.name,
        email: rawUser.email,
        password: hashedPassword, // Salva la password hashata
      },
    });

    // 6. Accesso automatico dopo la registrazione (UX)
    await signIn("credentials", {
      email: rawUser.email,
      password: plainPassword, // Usa la password non hashata per l'accesso
    });

    return { success: true, message: "Utente registrato con successo" };
  } catch (error) {
    // Se l'errore è un reindirizzamento, lo rilancia (come in signIn)
    if (isRedirectError(error)) {
      throw error;
    }

    // Gestione errori di validazione Zod o database.
    console.error("Errore di registrazione:", error);
    return {
      success: false,
      message: "Errore durante la registrazione. Riprova.",
    };
  }
}
