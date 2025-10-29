"use server";

import { signInFormSchema } from "../validators";
import { signIn, signOut } from "@/auth";
import { email, success } from "zod"; 

// Sign in user with con credentials
export async function signInWithCredentials(
  prevState: unknown,
  formData: FormData
) {
  try {
    const user = signInFormSchema.parse({
      email: formData.get("email"),
      password: formData.get("password"),
    });

    // Prova ad accedere. Se ha successo, NextAuth reindirizza (se configurato in src/auth.ts).
    await signIn("credentials", user); 

    // Questa riga non verrà raggiunta se il login ha successo e reindirizza:
    return { success: true, message: "Loggato con successo" }; 
    
  } catch (error) {
    // Gestisci solo gli errori lanciati da NextAuth per credenziali non valide.
    // Gli errori di reindirizzamento vengono rilanciati implicitamente.

    if ((error as any).type === 'CredentialsSignin') {
        return { success: false, message: "Password o Email non valida" };
    }
    
    // Rilancia qualsiasi altro errore (inclusi i reindirizzamenti, se la logica interna 
    // di signIn li lancia e non li gestisce).
    throw error;
  }
}

// Sign user out
export async function signOutUser() {
  await signOut();
}