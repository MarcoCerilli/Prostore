"use server";

import prisma from "@/db/prisma";
import Stripe from "stripe";

import { CartItemFrontend } from "@/types";

// Inizializza Stripe (usa la chiave segreta)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  // La versione API deve corrispondere ai tipi installati o a quella del tuo account.
  // @ts-ignore
  apiVersion: "2023-10-16", // Puoi anche provare a impostare la tua versione Stripe preferita qui
});

// 🛠️ FUNZIONE DI GUARDA DI TIPO (Type Guard) per StripeError
function isStripeError(err: any): err is Stripe.StripeRawError {
  return err && typeof err === "object" && (err.type || err.rawType);
}

// Tipizzazione per l'input della Server Action
interface CreateStripePaymentIntentParams {
  orderId: string;
  totalAmount: number;
  cartItems: CartItemFrontend[];
  userId: string;
  baseUrl: string; // Cruciale per il reindirizzamento di Stripe
}

// Tipizzazione per la risposta della Server Action
interface StripePaymentIntentResult {
  success: boolean;
  clientSecret?: string | null;
  message?: string;
}

/**
 * Crea un Payment Intent (PI) di Stripe o restituisce il PI esistente per un dato ordine (Deduplicazione).
 * @param params Dettagli dell'ordine e del carrello.
 * @returns {StripePaymentIntentResult} Risultato con clientSecret o messaggio di errore.
 */
export async function createStripePaymentIntentAction({
  orderId,
  totalAmount,
  cartItems,
  userId,
  baseUrl,
}: CreateStripePaymentIntentParams): Promise<StripePaymentIntentResult> {
  // 🎯 Validazione anticipata dell'importo totale
  if (typeof totalAmount !== "number" || isNaN(totalAmount)) {
    console.error(
      `SERVER DEBUG STRIPE ACTION ERROR: Importo totale mancante o non valido: ${totalAmount}`
    );
    return {
      success: false,
      message:
        "L'importo totale per il pagamento non è stato fornito o non è valido.",
    };
  }

  try {
    // 1. DEDUPLICAZIONE: Controlla se l'Ordine esiste già e ha un PI associato.
    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
      select: { stripePaymentIntentId: true, isPaid: true },
    });

    if (!existingOrder) {
      console.error(
        `SERVER DEBUG STRIPE ACTION ERROR: Ordine non trovato per ID ${orderId}`
      );
      return {
        success: false,
        message: `Ordine con ID ${orderId} non trovato.`,
      };
    }

    if (existingOrder.stripePaymentIntentId) {
      console.log(
        `SERVER DEBUG STRIPE ACTION DUPLICATION CHECK: PI esistente (${existingOrder.stripePaymentIntentId}) trovato per l'Ordine ID: ${orderId}.`
      );
      
      const existingPi = await stripe.paymentIntents.retrieve(
        existingOrder.stripePaymentIntentId
      );

      // Se è già pagato o in uno stato finale, restituiamo il secret.
      if (
        existingPi.status === "succeeded" ||
        existingPi.status === "canceled" ||
        existingOrder.isPaid
      ) {
        return { success: true, clientSecret: existingPi.client_secret };
      }

      // Se non è in uno stato finale, è ancora valido. Restituiamo il suo secret.
      // La riga problematica del return_url nell'aggiornamento è stata rimossa, come richiesto.
      return { success: true, clientSecret: existingPi.client_secret };
    } 
    
    // 2. CREAZIONE NUOVO PI: Se non ne esiste uno, procedi

    const amountInCents = Math.round(totalAmount * 100);

    if (amountInCents <= 0) {
      console.error(
        `SERVER DEBUG STRIPE ACTION ERROR: Importo non valido per Stripe: ${totalAmount}`
      );
      return {
        success: false,
        message:
          "L'importo totale deve essere maggiore di zero per procedere con il pagamento.",
      };
    }

    // Costruzione dell'URL di ritorno (usato nella creazione, dove è supportato)
    const returnUrl = `${baseUrl}/checkout/successo?order_id=${orderId}`;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: "eur",
      metadata: {
        orderId: orderId,
        userId: userId,
      },
      
      automatic_payment_methods: { enabled: true },
    }); 

    // 3. AGGIORNA IL DB con il nuovo PI ID
    await prisma.order.update({
      where: { id: orderId },
      data: {
        stripePaymentIntentId: paymentIntent.id,
      },
    });

    console.log(
      `SERVER DEBUG STRIPE ACTION SUCCESS: Nuovo PI creato e salvato. ID: ${paymentIntent.id}`
    );
    return { success: true, clientSecret: paymentIntent.client_secret };
  } catch (error) {
    console.error(
      "SERVER DEBUG STRIPE ACTION ERROR: Errore durante la creazione del Payment Intent.",
      error
    );

    let errorMessage =
      "Errore sconosciuto durante il Payment Intent. Si prega di riprovare.";

    if (isStripeError(error)) {
      errorMessage = `Errore Stripe [${error.type} - ${error.code}]: ${error.message}`;
    } else if (error instanceof Error) {
      errorMessage = `Errore di sistema: ${error.message}`;
    }
    return { success: false, message: errorMessage };
  }
}