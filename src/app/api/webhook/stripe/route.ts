import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import prisma from "@/db/prisma";
import { revalidatePath } from "next/cache";

// --- Inizializzazione ---
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  // Usa la versione API più recente o quella che stai usando
  apiVersion: "2024-06-20" as Stripe.LatestApiVersion, 
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

// --------------------------------------------------------------------------
// Funzione POST: Gestisce le notifiche Webhook in entrata
// --------------------------------------------------------------------------
export async function POST(req: NextRequest) {
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
    // 🔑 CORREZIONE: Gestione rigorosa solo degli eventi necessari (ignora created)
    if (event.type !== "payment_intent.succeeded") {
        console.log(`Webhook ricevuto: Tipo di evento ignorato ${event.type}`);
        // Restituisce 200 immediatamente a Stripe
        return new NextResponse(`Ignored event type ${event.type}`, { status: 200 }); 
    }

    const paymentIntent = event.data.object as Stripe.PaymentIntent;

    // Trova l'ordine associato all'ID del Payment Intent
    const order = await prisma.order.findUnique({
      where: { stripePaymentIntentId: paymentIntent.id },
      // Aggiunto 'status' per il controllo di doppia esecuzione
      select: { id: true, userId: true, cartId: true, orderNumber: true, status: true },
    });

    if (order?.id) {
      // 🔑 CORREZIONE: Prevenire la doppia esecuzione del webhook
      if (order.status === 'PAID') {
          console.log(`⚠️ Ordine ${order.id} già PAGATO. Webhook ignorato.`);
          return new NextResponse(JSON.stringify({ received: true, message: "Already paid" }), { status: 200 });
      }

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
        await prisma.cart.deleteMany({ where: { userId: order.userId } });
        console.log(`✅ Carrello svuotato per utente loggato: ${order.userId}`);
      } else if (order.cartId) {
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

    // Risposta finale di successo a Stripe (dopo l'elaborazione)
    return new NextResponse(JSON.stringify({ received: true }), { status: 200 });
    
  } catch (dbError) {
    // 3. Gestione Errori DB: Ritorna 200 per non far riprovare Stripe
    console.error(`❌ ERRORE CRITICO DB DURANTE ELABORAZIONE WEBHOOK:`, dbError); 
    return new NextResponse(
      JSON.stringify({ received: true, error: "DB_FAILURE" }),
      { status: 200 }
    );
  }
}