import { redirect } from "next/navigation";
import { shippingAddress } from "@/types";
import { shippingAddressValues } from "@/lib/constants";
import { getUserById } from "@/lib/actions/user.action";
import { auth } from "@/auth";
import "server-only"; // IMPORTANTE: Forza Next.js a trattare questo come Server Component esclusivo

// Componenti Client
import CheckoutClientWrapper from "./CheckoutClientWrapper";

/**
 * Funzione placeholder per recuperare i dettagli dell'utente.
 */
async function fetchUserAddress(
  userId: string
): Promise<shippingAddress | null> {
  const user = await getUserById(userId);

  if (user && user.address) {
    return user.address as shippingAddress;
  }
  return null;
}

// ✅ Server Component (Async)
// Questo componente gestisce solo i dati lato server (autenticazione e recupero indirizzo).
// La logica di routing (searchParams) è delegata a CheckoutClientWrapper.
export default async function CheckoutPage() {
  
  // 1. Verifica Autenticazione e Ottieni userId
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    // Redirige al login se non autenticato
    redirect("/sign-in?callbackUrl=/checkout");
  }

  // 2. Recupera l'Indirizzo Salvato
  const existingAddress = await fetchUserAddress(userId);

  // Normalizza l'indirizzo per passarlo al componente client
  const cleanedAddress = existingAddress
    ? Object.fromEntries(
        Object.entries(existingAddress).map(([key, value]) => [
          key,
          value === null || value === undefined
            ? shippingAddressValues[key as keyof typeof shippingAddressValues]
            : value,
        ])
      )
    : shippingAddressValues;

  // 3. Renderizza il wrapper client, passandogli i dati asincroni recuperati
  return (
    <CheckoutClientWrapper 
      userId={userId} 
      existingAddress={cleanedAddress as shippingAddress} 
    />
  );
}

// -------------------------------------------------------------
// Creiamo un nuovo file per il Client Component: CheckoutClientWrapper.tsx
// (Questo file non può essere generato qui, ma è necessario per il funzionamento)
// -------------------------------------------------------------
