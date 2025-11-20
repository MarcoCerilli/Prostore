"use server";

import Stripe from "stripe";
import { CartItemFrontend } from "@/types"; // Assumendo che tu abbia importato i tipi necessari

// ⚠️ CONTROLLO CRITICO CHIAVE AMBIENTE: Legge la chiave una volta sola
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

if (!STRIPE_SECRET_KEY) {
  console.error(
    "ERRORE CRITICO CONFIGURAZIONE STRIPE: Variabile d'ambiente STRIPE_SECRET_KEY non è definita."
  );
}

// Inizializza Stripe SDK
const stripe = new Stripe(STRIPE_SECRET_KEY as string, {
  apiVersion: "2023-10-16" as any,
});

// * DEFINIZIONE DEI TIPI
type CreatePaymentIntentParams = {
  amount: number; // Importo totale in EUR (es. 29.39)
  cartId: string; // ID del carrello o dell'ordine temporaneo
  items: CartItemFrontend[]; // Dettagli degli articoli per i metadati
};

type PaymentIntentResponse = {
  success: boolean;
  clientSecret?: string;
  message?: string;
};

/**
 * Crea un nuovo Payment Intent su Stripe e ne restituisce il client_secret.
 * @param params Dati necessari per il pagamento.
 * @returns {Promise<PaymentIntentResponse>} Oggetto contenente il clientSecret in caso di successo.
 */
export async function createStripePaymentIntentAction({
  amount,
  cartId,
  items,
}: CreatePaymentIntentParams): Promise<PaymentIntentResponse> {
  console.log(
    `SERVER DEBUG: Tentativo di creare PI per Cart ID: ${cartId}, Totale: ${amount}`
  ); // 🛑 CONTROLLO CRITICO PRIMARIO

  const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY; 

  if (STRIPE_SECRET_KEY) {
    console.log(`STRIPE ENV CHECK: Chiave segreta caricata (Lunghezza: ${STRIPE_SECRET_KEY.length})`); 
  }

  if (!STRIPE_SECRET_KEY) {
    console.error(
      "STRIPE ERROR: Chiave segreta mancante all'interno dell'azione."
    );
    return { success: false, message: "Chiave segreta di Stripe mancante." };
  } // ✅ Inizializza Stripe QUI, dove la chiave è garantita


  const stripe = new Stripe(STRIPE_SECRET_KEY as string, {
    apiVersion: "2023-10-16" as any,
  });
  if (amount <= 0) {
    return {
      success: false,
      message: "L'importo del pagamento deve essere positivo.",
    };
  }

  try {
    // 1. Calcolo dell'importo: Stripe usa centesimi
    const amountInCents = Math.round(amount * 100); // 2. Creazione del Payment Intent

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: "eur",
      payment_method_types: ["card"], // Esplicita per evitare problemi con la configurazione automatica // Metadati utili per il dashboard di Stripe
      metadata: {
        cart_id: cartId,
        items_count: items.length.toString(),
        description: `Acquisto carrello #${cartId}`,
      }, // Impostazioni per i metodi di pagamento automatici (opzionale, ma utile)
   
    }); // 3. Restituzione del Client Secret al Frontend

    if (paymentIntent.client_secret) {
      console.log("SERVER DEBUG SUCCESS: PI creato. Client Secret restituito.");
      return {
        success: true,
        clientSecret: paymentIntent.client_secret,
      };
    } else {
      return {
        success: false,
        message: "Stripe non ha restituito un client_secret valido.",
      };
    }
  } catch (error) {
    console.error("ERRORE CRITICO nella creazione del Payment Intent:", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Errore sconosciuto nella creazione dell'Intent.";
    return {
      success: false,
      message: `Errore Stripe API: ${errorMessage}. Controlla il terminale del server.`,
    };
  }
}
