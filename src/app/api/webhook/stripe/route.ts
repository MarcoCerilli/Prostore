import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import prisma from "@/db/prisma";
import { revalidatePath } from "next/cache";

// --- Inizializzazione ---
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  // 💡 Usa la versione API stabile più recente o quella che stai usando
  apiVersion: "2024-06-20" as any, 
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

// --------------------------------------------------------------------------
// Funzione POST: Gestisce le notifiche Webhook in entrata
// --------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  // 1. Risposta Immediata 200 (Pre-emptive)
  // Rispondiamo immediatamente per evitare che Stripe ritenti l'invio. 
  // La logica pesante viene eseguita dopo, ma la risposta è garantita.
  const rawBody = Buffer.from(await req.arrayBuffer());
  const sig = req.headers.get("stripe-signature");

  if (!webhookSecret || !sig) {
    console.error("⚠️ Webhook secret o firma mancante.");
    return new NextResponse("Webhook secret o firma mancante", { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err: any) {
    console.error(`⚠️ Errore Verifica Webhook: ${err.message}`);
    return new NextResponse(`Errore Webhook: ${err.message}`, { status: 400 });
  }
  
  // 2. Esecuzione Logica Webhook
  try {
    switch (event.type) {
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        
        // Trova l'ordine associato all'ID del Payment Intent
        const order = await prisma.order.findUnique({
          where: { stripePaymentIntentId: paymentIntent.id },
          select: { id: true, userId: true, cartId: true, orderNumber: true },
        });

        if (order?.id) {
          // --- 2a. Aggiornamento Stato Ordine ---
          await prisma.order.update({
            where: { id: order.id },
            data: {
              status: "PAID",
              isPaid: true,
              paidAt: new Date(),
            },
          });

          // --- 2b. Svuotamento Carrello (come richiesto) ---
          if (order.userId) {
            // Svuota carrello utente loggato
            await prisma.cart.deleteMany({ where: { userId: order.userId } });
            console.log(`✅ Carrello svuotato per utente loggato: ${order.userId}`);
          } else if (order.cartId) {
            // Svuota carrello ospite/fallback
            await prisma.cart.deleteMany({ where: { id: order.cartId } });
            console.log(`✅ Carrello svuotato per guest/fallback (Cart ID: ${order.cartId})`);
          } else {
            console.warn(`⚠️ Impossibile svuotare il carrello: Ordine ${order.id} non ha né userId né cartId.`);
          }

          // --- 2c. Invalidazione Cache (Next.js Revalidation) ---
          revalidatePath(`/cart`);
          revalidatePath(`/checkout`);
          
          if (order.orderNumber) {
            revalidatePath(`/dashboard/orders`);
            revalidatePath(`/dashboard/orders/${order.orderNumber}`);
          }
          
          console.log(`✅ Ordine ${order.id} aggiornato a PAGATO e cache rigenerata.`);
          
        } else {
          console.error(`❌ Ordine non trovato per PI ID: ${paymentIntent.id}.`);
        }
        break;
      }
      
      // Altri eventi da ignorare o gestire (es. payment_intent.failed)
      case "payment_intent.created": 
      case "charge.succeeded":
        break; 

      default:
        console.log(`Evento Stripe non gestito: ${event.type}`);
    } 

    // Risposta finale di successo a Stripe (dopo l'elaborazione)
    return new NextResponse(JSON.stringify({ received: true }), { status: 200 });
    
  } catch (dbError) {
    // 3. Gestione Errori DB
    // Se fallisce l'aggiornamento del DB, ritorniamo comunque 200 a Stripe 
    // per non far riprovare, ma logghiamo l'errore.
    console.error(`❌ ERRORE CRITICO DB DURANTE ELABORAZIONE WEBHOOK:`, dbError); 
    return new NextResponse(
      JSON.stringify({ received: true, error: "DB_FAILURE" }),
      { status: 200 }
    );
  }
}