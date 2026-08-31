import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { updateOrderAfterStripeSuccess } from '@/lib/actions/order.actions';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET as string; 

export async function POST(req: NextRequest) {
  let event: Stripe.Event;

  const rawBodyBuffer = await req.arrayBuffer();
  const rawBody = Buffer.from(rawBodyBuffer);
  
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    console.error('WEBHOOK ERROR: Firma Stripe mancante.');
    return new NextResponse('Firma mancante', { status: 400 });
  }

  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      webhookSecret
    );
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Errore sconosciuto";
    console.error(`WEBHOOK ERROR: Verifica firma fallita. ${errorMsg}`);
    return new NextResponse('Webhook Signature Verification Failed', { status: 400 }); 
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log(`✅ Webhook: PaymentIntent Riuscito: ${paymentIntent.id}`);
        
        const orderId = paymentIntent.metadata?.orderId;
        
        if (orderId) {
          const res = await updateOrderAfterStripeSuccess({
            orderId,
            stripePaymentIntentId: paymentIntent.id,
          });
          if (!res.success) {
            console.error(`Errore nell'aggiornamento ordine ${orderId}:`, res.error);
            return new NextResponse(`Errore aggiornamento ordine: ${res.error}`, { status: 500 });
          }
          console.log(`✅ Ordine ${orderId} aggiornato con successo a PAGATO.`);
        } else {
          console.error('ERRORE LOGICO WEBHOOK: Order ID mancante nei metadati del Payment Intent.');
          return new NextResponse('ID ordine mancante. Errore logico.', { status: 200 }); 
        }
        break;
      }
      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.warn(`❌ Webhook: PaymentIntent Fallito: ${paymentIntent.id}`);
        break;
      }
      default: {
        console.log(`Evento Stripe non gestito: ${event.type}`);
      }
    }

    return new NextResponse(JSON.stringify({ received: true }), { status: 200 });

  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Errore interno sconosciuto";
    console.error(`❌ ERRORE INTERNO WEBHOOK per ${event.type}:`, errorMsg);
    return new NextResponse(`Internal Server Error: ${errorMsg}`, { status: 500 });
  }
}