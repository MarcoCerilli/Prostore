"use server";

import prisma from "@/db/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
// Assicurati che questi tipi esistano e siano corretti
import { OrderItem, OrderSummary } from "@/types/order"; 
import { orderStatus } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

// --- Tipizzazione per l'Aggiornamento Post-Stripe ---
interface UpdateOrderAfterStripeParams {
  orderId: string;
  stripePaymentIntentId: string;
}

// --- Tipizzazione per la Creazione dell'Ordine ---
interface CreateOrderParams{
  userId: string;
  cartId: string;
  totalPrice: number;
  itemsPrice: number;
  shippingPrice: number;
  taxPrice: number;
  shippingAddress: any; // Usa il tipo specifico Address
  items: any[]; // Usa il tipo specifico CartItemFrontend (che include productId, name, price, quantity, image, slug)
}

// =============================================================
// ## 🚀 Server Action 1: createOrderAction
// =============================================================

/**
 * Crea un nuovo ordine nel database con stato PENDING_PAYMENT.
 * Include le correzioni per il tuo schema (qty, slug, product: connect).
 * @returns {orderId} L'UUID del nuovo ordine creato.
 */
export async function createOrderAction({
    userId,
    cartId,
    totalPrice,
    itemsPrice,
    shippingPrice,
    taxPrice,
    shippingAddress,
    items,
}: CreateOrderParams) {
    console.log(`SERVER ACTION: Tentativo di creare l'ordine per l'utente ${userId} dal carrello ${cartId}`);

    if (!userId || !cartId || totalPrice <= 0) {
        return { success: false, error: "Dati essenziali mancanti per la creazione dell'ordine." };
    }

    try {
        // 1. Creazione dell'Ordine (Record principale)
        const newOrder = await prisma.order.create({
            data: {
                userId: userId,
                totalPrice: new Decimal(totalPrice), 
                itemsPrice: new Decimal(itemsPrice),
                shippingPrice: new Decimal(shippingPrice),
                taxPrice: new Decimal(taxPrice),
                // ⭐ Correzione Stato: Deve essere PENDING_PAYMENT
                status: orderStatus.PENDING_PAYMENT, 
                shippingAddress: shippingAddress,
                // Aggiungiamo i campi Order/Payment come richiesto dal tuo schema/log
                paymentmethod: "Pending", 
                orderNumber: `ORD-${Date.now()}`, 

                // 2. Creazione degli OrderItem correlati
                OrderItem: {
                    create: items.map(item => {
                        // Verifica essenziale per evitare l'errore 'productId: undefined'
                        if (!item.productId) {
                            throw new Error(`Item del carrello "${item.name}" mancante di ID Prodotto.`);
                        }
                        
                        return {
                            name: item.name,
                            price: new Decimal(item.price),
                            // ✅ Correzione 1: Mappa 'quantity' su 'qty'
                            qty: item.quantity, 
                            image: item.image,
                            // ✅ Correzione 2: Aggiunge 'slug' (usa name come fallback)
                            slug: item.slug ?? item.name.toLowerCase().replace(/\s+/g, '-'), 
                            // ✅ Correzione 3: Soddisfa la relazione 'product' obbligatoria
                            product: {
                                connect: {
                                    id: item.productId, 
                                },
                            },
                        };
                    }),
                },
            },
            select: {
                id: true,
            },
        });
        
      /*   // 3. Pulizia del carrello (Assumendo che il carrello vada eliminato)
        await prisma.cart.deleteMany({ where: { id: cartId } }); */

        console.log(`SERVER ACTION SUCCESS: Ordine creato con ID: ${newOrder.id}`);
        return { success: true, orderId: newOrder.id };
    } catch (error) {
        console.error("ERRORE CRITICO NELLA createOrderAction:", error);
        return { success: false, error: "Errore durante la creazione dell'ordine nel database." };
    }
}

// -------------------------------------------------------------
// ## ✅ Server Action 2: updateOrderAfterStripeSuccess
// -------------------------------------------------------------

/**
 * Aggiorna lo stato di un ordine a PAGATO dopo il successo del pagamento Stripe.
 * SALVA l'ID del Payment Intent e imposta isPaid: true.
 */
export async function updateOrderAfterStripeSuccess({
  orderId,
  stripePaymentIntentId,
}: UpdateOrderAfterStripeParams) {

  try {
    console.log(
      `SERVER ACTION: Tentativo di aggiornare l'ordine ${orderId} con PI ID ${stripePaymentIntentId}`
    );
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        isPaid: true, 
        paidAt: new Date(),
        stripePaymentIntentId: stripePaymentIntentId, 
        paymentmethod: "Carta di Credito / Debito (Stripe)",
        status: orderStatus.PROCESSING, // Stato dopo il pagamento
      },
    });

    console.log(
      `SERVER ACTION: Ordine ${updatedOrder.id} aggiornato con successo.`
    );

    return { success: true, orderId: updatedOrder.id };
  } catch (error) {
    console.error(
      "ERRORE CRITICO nell'aggiornamento dell'ordine dopo Stripe:",
      error
    );
    return {
      success: false,
      error: "Aggiornamento database fallito dopo Stripe.",
    };
  }
}

// -------------------------------------------------------------
// ## ⭐ Server Action 3: getMyOrdersSummaryAction (Richiesta)
// -------------------------------------------------------------

/**
 * Server Action per recuperare il riepilogo degli ordini dell'utente autenticato.
 */
export async function getMyOrdersSummaryAction(): Promise<OrderSummary[]> {
  const session = await auth();
  const userId = session?.user.id;

  if (!userId) {
    redirect("/login");
  }

  try {
    // 1. Query Prisma: Selezioniamo solo i campi necessari.
    const orders = await prisma.order.findMany({
      where: {
        userId: userId,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        orderNumber: true,
        createdAt: true,
        totalPrice: true,
        status: true, // Usiamo solo l'ENUM status
        OrderItem: {
          select: {
            productId: true, 
            name: true,
          },
        },
        user: {
          select: {
            name: true,
          },
        },
      },
    }); 

    // 2. Mappatura: Convertiamo i tipi e mappiamo i nomi.
    const sanitizedOrders: OrderSummary[] = orders.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      createdAt: order.createdAt,
      totalPrice: order.totalPrice.toNumber(),
      // Rimosso 'orderStatus' ridondante se usi solo 'status'
      status: order.status as orderStatus, 

      user: order.user,
      orderItems: order.OrderItem.map((item) => ({
        id: item.productId, 
        name: item.name,
      })) as Pick<OrderItem, "id" | "name">[],
    }));

    return sanitizedOrders;
  } catch (error) {
    console.error("Errore nel recupero degli ordini personali:", error);
    return [];
  }
}