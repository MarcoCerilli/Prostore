import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

// La configurazione `export const config = { api: { bodyParser: false } }` non è necessaria
// nell'App Router (route.ts), ma la lettura del body deve essere esplicita.

// Sostituisci con la tua chiave segreta
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);
// Sostituisci con il tuo segreto di firma Webhook
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET as string; 

// Rimuoviamo la funzione getRawBody e leggiamo il body direttamente come ArrayBuffer
// per la massima compatibilità con la documentazione Next.js App Router.

export async function POST(req: NextRequest) {
  let event: Stripe.Event;

  // 1. Ottieni il body RAW come ArrayBuffer
  const rawBodyBuffer = await req.arrayBuffer();
  const rawBody = Buffer.from(rawBodyBuffer);
  
  // 2. Ottieni la firma
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    console.error('WEBHOOK ERROR: Firma Stripe mancante.');
    return new NextResponse('Firma mancante', { status: 400 });
  }

  try {
    // 3. Verifica l'evento con la chiave segreta
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      webhookSecret
    );
  } catch (err: any) {
    // Se la verifica della firma fallisce, ritorna 400
    console.error(`WEBHOOK ERROR: Verifica firma fallita. ${err.message}`);
    // Messaggio di errore generico per sicurezza esterna
    return new NextResponse('Webhook Signature Verification Failed', { status: 400 }); 
  }

  // 4. Gestione degli eventi
  const dataObject: any = event.data.object;

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = dataObject as Stripe.PaymentIntent;
        console.log(`✅ Webhook: PaymentIntent Riuscito: ${paymentIntent.id}`);
        
        // Esempio: Recupera il tuo Order ID dai metadati
        const orderId = paymentIntent.metadata?.orderId;
        
        if (orderId) {
            // QUI la tua logica di aggiornamento dell'ordine in Prisma
            // Esempio: await prisma.order.update({ where: { orderNumber: orderId }, data: { status: 'PAID', stripePaymentIntentId: paymentIntent.id } });
            console.log(`Ordine ${orderId} aggiornato come PAGATO tramite Webhook.`);
        } else {
            console.error('ERRORE LOGICO WEBHOOK: Order ID mancante nei metadati del Payment Intent.');
            // Ritorna 200 per non far ritentare Stripe, ma logga l'errore.
            return new NextResponse('ID ordine mancante. Errore logico.', { status: 200 }); 
        }
        break;
      }
      case 'payment_intent.payment_failed': {
        const paymentIntent = dataObject as Stripe.PaymentIntent;
        console.warn(`❌ Webhook: PaymentIntent Fallito: ${paymentIntent.id}`);
        // Logica per aggiornare lo stato dell'ordine a FALLITO/CANCELLATO
        break;
      }
      // Aggiungi altri case come 'checkout.session.completed' se usi Checkout Session
      default: {
        // Ignora gli altri tipi di eventi
        console.log(`Evento Stripe non gestito: ${event.type}`);
      }
    }

    // 5. Risposta di successo (Obbligatorio per Stripe)
    return new NextResponse(JSON.stringify({ received: true }), { status: 200 });

  } catch (error: any) {
    // Se c'è un errore interno (es. DB) -> Ritorna 500 per far ritentare Stripe
    console.error(`❌ ERRORE INTERNO WEBHOOK per ${event.type}:`, error.message);
    return new NextResponse(`Internal Server Error: ${error.message}`, { status: 500 });
  }
}