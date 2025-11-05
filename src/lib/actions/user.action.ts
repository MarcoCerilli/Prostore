"use server";

import {
  signInFormSchema,
  signUpFormSchema,
  shippingAddressSchema,
  paymentMethodSchema,
} from "../validators";
import { signIn, signOut } from "@/auth";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { hashSync } from "bcrypt-ts-edge";
import prisma from "@/db/prisma";
import { formatError } from "../utils";
import { auth } from "@/auth"; // Per la sessione
import { z } from "zod"; // Per la validazione Zod
import { redirect } from "next/navigation"; // 💡 Importazione per il reindirizzamento

// Tipi per la risposta delle Server Actions
type ActionResponse = {
  success: boolean;
  message: string;
};

// --- FUNZIONI DI AUTENTICAZIONE E REGISTRAZIONE ---

/**
 * Server Action per l'accesso utente con credenziali (Email/Password).
 * @param prevState Lo stato precedente, fornito da useActionState.
 * @param formData I dati del form inviati.
 * @returns {Promise<{success: boolean, message: string}>} Oggetto stato.
 */
export async function signInWithCredentials(
  prevState: unknown,
  formData: FormData
) {
  try {
    const { email, password } = signInFormSchema.parse({
      email: formData.get("email") as string,
      password: formData.get("password") as string,
    });

    const redirectTo = formData.get("callbackUrl") as string | null;

    await signIn("credentials", {
      email,
      password,
      redirectTo: redirectTo || "/",
    });

    return { success: true, message: "Loggato con successo" };
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

    if ((error as any).type === "CredentialsSignin") {
      return { success: false, message: "Password o Email non valida" };
    }

    return { success: false, message: "Errore sconosciuto durante l'accesso." };
  }
}

/**
 * Server Action per il logout utente.
 */
export async function signOutUser() {
  await signOut();
}

/**
 * Server Action per la registrazione di un nuovo utente.
 * @param prev Lo stato precedente.
 * @param formData I dati del form inviati.
 * @returns {Promise<{success: boolean, message: string}>} Oggetto stato.
 */
export async function signUpUser(prev: unknown, formData: FormData) {
  try {
    const validationResult = signUpFormSchema.safeParse({
      name: (formData.get("name") as string).trim(),
      email: (formData.get("email") as string).trim(),
      password: (formData.get("password") as string).trim(),
      confirmpassword: (formData.get("confirmpassword") as string).trim(),
    });

    if (!validationResult.success) {
      throw validationResult.error;
    }

    const rawUser = validationResult.data;

    if (rawUser.password !== rawUser.confirmpassword) {
      return { success: false, message: "Le password non corrispondono." };
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: rawUser.email },
    });
    if (existingUser) {
      return { success: false, message: "Questa email è già registrata." };
    }

    const plainPassword = rawUser.password;
    const hashedPassword = hashSync(rawUser.password, 10);

    await prisma.user.create({
      data: {
        name: rawUser.name,
        email: rawUser.email,
        password: hashedPassword,
      },
    });

    await signIn("credentials", {
      email: rawUser.email,
      password: plainPassword,
    });

    return { success: true, message: "Utente registrato con successo" };
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

    const detailedMessage = await formatError(error);
    return {
      success: false,
      message:
        detailedMessage ||
        "Errore sconosciuto durante la registrazione. Riprova.",
    };
  }
}

// --- FUNZIONI UTENTE E CHECKOUT ---

/**
 * Salva l'indirizzo di spedizione nel campo 'address' del modello User.
 * 💡 FIX: Rimosso il tipo di ritorno Promise<ActionResponse> per consentire il redirect.
 * @param formData - Dati del form validati dallo schema Zod
 */
export async function saveShippingAddress(
  formData: z.infer<typeof shippingAddressSchema>
) {
  // 1. VERIFICA AUTENTICAZIONE E RECUPERO ID UTENTE
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    // Lanciamo un errore per la gestione client-side (useFormState)
    throw new Error("Autenticazione richiesta per salvare l'indirizzo.");
  }

  // 2. VALIDAZIONE DEI DATI
  const validation = shippingAddressSchema.safeParse(formData);

  if (!validation.success) {
    // Gestione degli errori Zod e lancio
    const errors = validation.error.issues
      .map(
        (issue: { path: any[]; message: any }) =>
          `${issue.path[0]}: ${issue.message}`
      )
      .join(", ");
    throw new Error(`Errore di validazione: ${errors}`);
  }

  const validatedData = validation.data;

  try {
    // 3. SALVATAGGIO DEI DATI
    await prisma.user.update({
      where: { id: userId },
      data: {
        address: validatedData, // Salviamo l'oggetto validato direttamente nel campo Json
      },
    });

    // 4. ✅ FIX CRUCIALE: REINDIRIZZAMENTO allo step successivo (Payment)
    // Questo è il comando che risolve il problema del bottone.
    redirect("/checkout?step=payment");
  } catch (error) {
    // Se l'errore è un reindirizzamento (lanciamo sempre i redirect)
    if (isRedirectError(error)) {
      throw error;
    }
    console.error("Errore nel salvataggio dell'indirizzo:", error);
    // Lanciamo un errore generico
    throw new Error(
      "Si è verificato un errore durante il salvataggio dell'indirizzo."
    );
  }
}

/**
 * Recupera i dettagli di un utente, includendo l'indirizzo di spedizione.
 * @param userId L'ID dell'utente.
 * @returns L'oggetto utente con il campo 'address' come JSON, o null.
 */
export async function getUserById(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      address: true,
    },
  });

  if (!user) {
    console.error(
      `Tentativo di recuperare i dettagli di un utente inesistente: ${userId}`
    );
    return null;
  }

  return user;
}

// Aggiornamento del metodo di pagamento dell' Utente

export async function updateUserPaymentMethod(
  data: z.infer<typeof paymentMethodSchema>
) {
  try {
    const session = await auth();
    const currentUser = await prisma.user.findFirst({
      where: { id: session?.user?.id },
    });
    if (!currentUser) throw new Error("Utente non trovato");

    // Una volta ottenuto l'utente ricaviamo il metodo di pagamento
    // 💡 NOTA: Il tuo schema ha un campo 'paymentMethod', non 'type'. Assumo che 'data' sia l'oggetto intero.
    const validation = paymentMethodSchema.parse(data);

    // Aggiorniamo il database
    await prisma.user.update({
      where: { id: currentUser.id },
      // Assumendo che il campo DB sia `paymentMethod` e prenda una stringa.
      data: { paymentMethod: validation.paymentMethod },
    });

    // ✅ FIX: Aggiunto redirect per passare allo step 'place-order'
    redirect("/checkout?step=place-order");
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }
    console.error("Errore nell'aggiornamento del metodo di pagamento:", error);
    throw new Error(
      "Si è verificato un errore durante l'aggiornamento del metodo di pagamento."
    );
  }
}
