import { NextRequest, NextResponse } from "next/server";
import prisma from "@/db/prisma";
import { revalidatePath } from "next/cache";

// Questo endpoint è chiamato dal frontend dopo che PayPal restituisce "COMPLETED"
export async function POST(req: NextRequest) {
  try {
    const { orderNumber, paypalOrderId } = await req.json();

    if (!orderNumber || !paypalOrderId) {
      return new NextResponse(
        JSON.stringify({ error: "Missing Order Number or PayPal ID" }),
        { status: 400 }
      );
    }

    // 1. Cerca l'ordine in base al tuo orderNumber interno
    const order = await prisma.order.findUnique({
      where: { orderNumber: orderNumber },
      select: { id: true, status: true, userId: true, cartId: true },
    });

    if (!order) {
      console.error(`❌ Ordine non trovato per orderNumber: ${orderNumber}`);
      return new NextResponse(
        JSON.stringify({ error: "Order not found" }),
        { status: 404 }
      );
    }

    // 2. Prevenire la doppia esecuzione
    if (order.status === "PAID") {
      console.warn(`⚠️ Ordine ${order.id} già PAGATO. Aggiornamento PayPal ignorato.`);
      return new NextResponse(
        JSON.stringify({ received: true, message: "Already paid" }),
        { status: 200 }
      );
    }

    // 3. Aggiornamento Stato Ordine nel DB (Stato di Successo PayPal)
    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: "PAID",
        isPaid: true,
        paidAt: new Date(),
        paymentmethod: "PayPal", // Imposta il metodo di pagamento corretto!
        paypalOrderId: paypalOrderId, // Salva l'ID di PayPal per tracciamento
        // Rimuovi stripePaymentIntentId o lascialo nullo se non usato in questo flusso
      },
    });

    // 4. Svuotamento Carrello e Revalidation
    const targetId = order.userId ? { userId: order.userId } : order.cartId ? { id: order.cartId } : null;
      
    if (targetId) {
      await prisma.cart.deleteMany({ where: targetId });
      console.log(`✅ Carrello svuotato.`);
    }

    revalidatePath(`/cart`);
    revalidatePath(`/checkout`);
    revalidatePath(`/dashboard/orders`);
    revalidatePath(`/dashboard/orders/${orderNumber}`);

    console.log(`✅ Ordine ${orderNumber} aggiornato a PAGATO tramite PayPal.`);

    return new NextResponse(JSON.stringify({ success: true }), {
      status: 200,
    });
  } catch (error) {
    console.error(`❌ ERRORE ELABORAZIONE PAGAMENTO PAYPAL:`, error);
    return new NextResponse(
      JSON.stringify({ error: "Internal Server Error" }),
      { status: 500 }
    );
  }
}