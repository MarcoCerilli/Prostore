"use server";

import prisma from "@/db/prisma";
import { auth } from "@/auth";
import { orderStatus, Prisma } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { OrderSummary, OrderItem } from "@/types/order";
import { sendPurchaseReceiptEmail } from "../email";

// --- Tipizzazione per l'Aggiornamento Post-Stripe ---
interface UpdateOrderAfterStripeParams {
  orderId: string;
  stripePaymentIntentId: string;
}

// --- Tipizzazione per la Creazione dell'Ordine ---
interface CreateOrderParams {
  // 🔑 CORREZIONE: Accetta null/undefined per l'utente ospite
  userId: string | undefined | null;
  cartId: string;
  totalPrice: number;
  itemsPrice: number;
  shippingPrice: number;
  taxPrice: number;
  paymentMethod?: string;
  shippingAddress: Prisma.InputJsonValue;
  items: any[];
}

// --- Tipo di Ritorno per createOrderAction ---
export type CreateOrderResult =
  | {
      success: true;
      orderId: string;
      orderNumber: string;
      message: string;
      error?: undefined;
    }
  | {
      success: false;
      error: string;
      orderId?: undefined;
      orderNumber?: undefined;
      message?: undefined;
    };

// =============================================================
// ## 🔑 Server Action 0: ensureUserExistsAction
// =============================================================

export async function ensureUserExistsAction(): Promise<{
  success: boolean;
  userId?: string;
  error?: string;
}> {
  // Logica invariata, usata per garantire l'esistenza del record utente se loggato.
  const session = await auth();

  if (!session?.user?.email || !session.user.id) {
    return { success: false, error: "Dati di sessione mancanti." };
  }

  const { id, name, email } = session.user;

  try {
    const dbUser = await prisma.user.upsert({
      where: { id: id },
      update: {
        name: name || "User",
        email: email,
      },
      create: {
        id: id,
        name: name || "User",
        email: email,
        role: "user",
      },
      select: { id: true },
    });

    return { success: true, userId: dbUser.id };
  } catch (error) {
    console.error("ERRORE ensureUserExistsAction:", error);
    return { success: false, error: "Impossibile sincronizzare l'utente." };
  }
}

// =============================================================
// ## 🚀 Server Action 1: createOrderAction (MASTER FUNCTION)
// =============================================================
export async function createOrderAction({
  userId,
  cartId,
  totalPrice,
  itemsPrice,
  shippingPrice,
  taxPrice,
  shippingAddress,
  items,
  paymentMethod = "Stripe",
}: CreateOrderParams): Promise<CreateOrderResult> {
  // console.log(`SERVER ACTION: Creazione ordine User: ${userId || 'GUEST'} - Carrello: ${cartId}`);

  if (!cartId || totalPrice <= 0) {
    return { success: false, error: "Dati essenziali mancanti." };
  }

  try {
    // 1. Logica Anti-Duplicazione / Riutilizzo
    const recentOrder = await prisma.order.findFirst({
      where: {
        cartId: cartId, // Usa l'ID del carrello come chiave unica
        createdAt: {
          // Cerca un ordine creato negli ultimi 30 secondi
          gt: new Date(Date.now() - 30 * 1000),
        },
      },
      // ✅ CORREZIONE: Includo paymentmethod nella selezione per evitare l'errore
      select: {
        id: true,
        orderNumber: true,
        status: true,
        paymentmethod: true,
      },
      orderBy: { createdAt: "desc" },
    });

    if (recentOrder) {
      const existingOrderNumber = recentOrder.orderNumber || recentOrder.id;

      let updatedStatus = recentOrder.status;
      let updatedPaymentMethod = recentOrder.paymentmethod;

      // Contrassegno: Forzo lo stato a PROCESSING e aggiorno il metodo di pagamento se necessario
      if (
        paymentMethod === "Contrassegno" &&
        // Aggiorno se non è già PROCESSING O il metodo di pagamento è sbagliato
        (recentOrder.status !== orderStatus.PROCESSING ||
          recentOrder.paymentmethod !== paymentMethod)
      ) {
        console.log(
          `🔄 Aggiornamento stato Ordine riutilizzato ${existingOrderNumber} a PROCESSING (Contrassegno).`
        );

        await prisma.order.update({
          where: { id: recentOrder.id },
          data: {
            status: orderStatus.PROCESSING,
            paymentmethod: paymentMethod,
          },
        });

        updatedStatus = orderStatus.PROCESSING;
        updatedPaymentMethod = paymentMethod;

        // 🎯 INIZIO CORREZIONE: LOGICA EMAIL PER ORDINE RIUTILIZZATO
        // Questa parte è cruciale per catturare il tuo scenario di test!

        // 1. Carichiamo l'ordine completo per l'email (usando recentOrder.id)
        const fullOrder = await prisma.order.findUnique({
          where: { id: recentOrder.id }, // Usa l'ID dell'ordine riutilizzato
          include: {
            user: { select: { email: true, name: true } },
            OrderItem: true,
          },
        });

        if (
          fullOrder &&
          fullOrder.user?.email &&
          fullOrder.OrderItem.length > 0
        ) {
          // 2. Mappatura necessaria per convertire Decimal in Number per il template
          const orderForEmail = {
            ...fullOrder,
            totalPrice: fullOrder.totalPrice.toNumber(),
            itemsPrice: fullOrder.itemsPrice.toNumber(),
            shippingPrice: fullOrder.shippingPrice.toNumber(),
            taxPrice: fullOrder.taxPrice.toNumber(),
            orderItems: fullOrder.OrderItem.map((item) => ({
              ...item,
              price: item.price.toNumber(),
            })),
            shippingAddress: fullOrder.shippingAddress as any,
          };

          try {
            // 3. Invio Email
            await sendPurchaseReceiptEmail({ order: orderForEmail as any });
            console.log(
              `✅ Email Contrassegno (riutilizzo) inviata per ordine ${recentOrder.id}`
            );
          } catch (e) {
            console.error(
              "⚠️ Errore invio email Contrassegno (riutilizzo):",
              e
            );
          }
        } else {
          console.log(
            "⚠️ Email Contrassegno NON INVIATA (riutilizzo): Dati mancanti (Ordine, Email Utente, o Articoli nell'Ordine).",
            {
              hasOrder: !!fullOrder,
              hasEmail: !!fullOrder?.user?.email,
              itemCount: fullOrder?.OrderItem.length,
            }
          );
        }
        // 🎯 FINE CORREZIONE
      }

      console.log(
        `♻️ Ordine già esistente trovato (${existingOrderNumber}) nello stato: ${updatedStatus}. Riutilizzo ID.`
      );

      // Usiamo updatedStatus per un messaggio più accurato per il Contrassegno
      const message =
        updatedPaymentMethod === "Contrassegno" &&
        updatedStatus === orderStatus.PROCESSING
          ? `Ordine Contrassegno ${existingOrderNumber} confermato e in lavorazione.`
          : `Ordine ${existingOrderNumber} già in attesa di pagamento. Riutilizza ID.`; // Messaggio generico per Stripe/PENDING

      return {
        success: true,
        orderId: recentOrder.id,
        orderNumber: existingOrderNumber,
        message: message,
      };
    }

    // 2. Creazione Transazionale (Ordine + Items + Eliminazione Carrello)
    const newOrder = await prisma.$transaction(async (tx) => {
      // 2.1 Crea Ordine
      const createdOrder = await tx.order.create({
        data: {
          userId: userId,
          cartId: cartId,
          totalPrice: new Decimal(totalPrice),
          itemsPrice: new Decimal(itemsPrice),
          shippingPrice: new Decimal(shippingPrice),
          taxPrice: new Decimal(taxPrice),
          status:
            // ✅ CORRETTO: Contrassegno va in PROCESSING, altri (Stripe) in PENDING
            paymentMethod === "Contrassegno"
              ? orderStatus.PROCESSING
              : orderStatus.PENDING_PAYMENT,
          shippingAddress: shippingAddress,
          paymentmethod: paymentMethod,
          orderNumber: `ORD-${Date.now()}`,
        },
        select: { id: true, orderNumber: true },
      });

      // 2.2 Prepara gli Items
      const orderItemsData = items.map((item) => {
        if (!item.productId) throw new Error(`Item "${item.name}" senza ID.`);

        return {
          orderId: createdOrder.id,
          productId: item.productId,
          name: item.name,
          price: new Decimal(item.price),
          qty: item.quantity,
          image: item.image,
          slug: item.slug ?? item.name.toLowerCase().replace(/\s+/g, "-"),
        };
      });

      // 2.3 Salva gli Items
      if (orderItemsData.length > 0) {
        await tx.orderItem.createMany({ data: orderItemsData });
      }

      // 🔑 PASSO CRUCIALE: ELIMINA IL CARRELLO E I SUOI ARTICOLI DAL DB
      try {
        await tx.cart.delete({
          where: { id: cartId },
        });
      } catch (deleteError) {
        console.warn(
          `ATTENZIONE: Errore nell'eliminazione del carrello (${cartId}). Potrebbe essere già stato eliminato o mancare la chiave.`,
          deleteError
        );
        // Continua, non bloccare la transazione per un carrello mancante
      }

      return createdOrder;
    });

    // 🔑 CORREZIONE: Gestione sicura di orderNumber per i messaggi
    const newOrderNumber = newOrder.orderNumber || newOrder.id;

    console.log(`✅ NUOVO Ordine creato: ${newOrder.id} (${newOrderNumber})`);

    // Gestione email per Contrassegno
    if (paymentMethod === "Contrassegno") {
      // 1. Carichiamo l'ordine completo per l'email
      const fullOrder = await prisma.order.findUnique({
        where: { id: newOrder.id },
        include: {
          user: { select: { email: true, name: true } },
          OrderItem: true,
        },
      });

      if (
        fullOrder &&
        fullOrder.user?.email &&
        fullOrder.OrderItem.length > 0
      ) {
        // 👈 AGGIUNTO IL CONTROLLO
        //2. Mappatura necessaria per convertire Decimal in Number per il template
        const orderForEmail = {
          ...fullOrder,
          totalPrice: fullOrder.totalPrice.toNumber(),
          itemsPrice: fullOrder.itemsPrice.toNumber(),
          shippingPrice: fullOrder.shippingPrice.toNumber(),
          taxPrice: fullOrder.taxPrice.toNumber(),
          orderItems: fullOrder.OrderItem.map((item) => ({
            ...item,
            price: item.price.toNumber(),
          })),
          shippingAddress: fullOrder.shippingAddress as any,
        };

        try {
          // 3. Invio Email
          await sendPurchaseReceiptEmail({ order: orderForEmail as any });
          console.log(
            `✅ Email Contrassegno inviata per ordine ${newOrder.id}`
          );
        } catch (e) {
          console.error("⚠️ Errore invio email Contrassegno:", e);
        }
      } else {
        // 🎯 Nuovo log per debug
        console.log(
          "⚠️ Email Contrassegno NON INVIATA: Dati mancanti (Ordine, Email Utente, o Articoli nell'Ordine).",
          {
            hasOrder: !!fullOrder,
            hasEmail: !!fullOrder?.user?.email,
            itemCount: fullOrder?.OrderItem.length,
          }
        );
      }
    }

    // 🎯 Messaggio finale dinamico
    const finalMessage =
      paymentMethod === "Contrassegno"
        ? `Ordine ${newOrderNumber} confermato e in lavorazione. Pagherai alla consegna.`
        : `Ordine ${newOrderNumber} creato con successo. Procedi al pagamento.`;

    return {
      success: true,
      orderId: newOrder.id,
      orderNumber: newOrderNumber,
      message: finalMessage, // ✅ Usa il messaggio dinamico corretto
    };
  } catch (error) {
    console.error("❌ ERRORE createOrderAction:", error);
    if ((error as any).code === "P2003") {
      return {
        success: false,
        error: "Errore Utente: Fai logout e login per aggiornare il database.",
      };
    }
    return { success: false, error: "Errore creazione ordine." };
  }
}

// -------------------------------------------------------------
// ## ✅ Server Action 2: updateOrderAfterStripeSuccess
// -------------------------------------------------------------
export async function updateOrderAfterStripeSuccess({
  orderId,
  stripePaymentIntentId,
}: UpdateOrderAfterStripeParams) {
  try {
    console.log(
      `💳 Aggiornamento Ordine ${orderId} -> PAGATO (Stripe: ${stripePaymentIntentId})`
    );

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        isPaid: true,
        paidAt: new Date(),
        stripePaymentIntentId: stripePaymentIntentId,
        paymentmethod: "Carta di Credito (Stripe)",
        // Lasciamo PROCESSING qui per coerenza con il flusso (se vuoi "PAID" modificalo)
        status: orderStatus.PAID,
      },
      include: {
        user: { select: { email: true, name: true } },
        OrderItem: true,
      },
    });

    // 2. Mappatura e Conversione dei Dati
    const orderForEmail = {
      ...updatedOrder,
      totalPrice: updatedOrder.totalPrice.toNumber(),
      itemsPrice: updatedOrder.itemsPrice.toNumber(),
      shippingPrice: updatedOrder.shippingPrice.toNumber(),
      taxPrice: updatedOrder.taxPrice.toNumber(),

      // Mappa e coverti gli articoli
      orderItems: updatedOrder.OrderItem.map((item) => ({
        ...item,
        price: item.price.toNumber(), // Decimal -> Number
      })),

      shippingAddress: updatedOrder.shippingAddress as any,
    };

    // 🛑 LOG DI VERIFICA DEI DATI UTENTE
    console.log("Dati utente per Email:", {
      email: orderForEmail.user?.email,
      name: orderForEmail.user?.name,
      totalPrice: orderForEmail.totalPrice,
      itemCount: orderForEmail.orderItems.length,
    });

    // 3. 📧 INVIA L'EMAIL DI RICEVUTA (CORREZIONE CRITICA: USARE await)
    try {
      // 🔑 Passiamo l'oggetto orderForEmail all'interno di un oggetto { order: ... }
      await sendPurchaseReceiptEmail({ order: orderForEmail as any });
      console.log(`✅ Email ricevuta per Ordine ${orderId} inviata.`);
    } catch (e) {
      // Catturiamo solo l'errore di invio, senza bloccare l'aggiornamento DB
      console.error("⚠️ Errore CRITICO nell'invio email DOPO il pagamento:", e);
    }

    // 4. Svuotamento carrello e revalidate
    // ... AGGIUNGI QUI LOGICA PER SVUOTARE CARRELLO E REVALIDATE ...

    return { success: true, orderId: updatedOrder.id };
  } catch (error) {
    console.error("❌ ERRORE updateOrderAfterStripeSuccess:", error);
    return { success: false, error: "Aggiornamento stato pagamento fallito." };
  }
}

// =============================================================
// ## 3. updateOrderAfterPayPalSuccess (QUELLA CHE MANCAVA!) 🅿️
// =============================================================
export async function updateOrderAfterPayPalSuccess(
  orderId: string,
  paypalTransactionId: string
) {
  try {
    console.log(
      `🅿️ Aggiornamento PayPal Ordine ${orderId} -> PAGATO (Tx: ${paypalTransactionId})`
    );

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        isPaid: true,
        paidAt: new Date(),
        paymentmethod: "PayPal",
        // Salviamo l'ID transazione di PayPal nel campo stripePaymentIntentId
        // (o in un campo dedicato se lo hai aggiunto al DB, es. paypalOrderId)
        stripePaymentIntentId: paypalTransactionId,
        status: orderStatus.PAID,
      },
      include: {
        user: { select: { email: true, name: true } },
        OrderItem: true,
      },
    });

    // Preparazione dati Email
    const orderForEmail = {
      ...updatedOrder,
      totalPrice: updatedOrder.totalPrice.toNumber(),
      itemsPrice: updatedOrder.itemsPrice.toNumber(),
      shippingPrice: updatedOrder.shippingPrice.toNumber(),
      taxPrice: updatedOrder.taxPrice.toNumber(),
      orderItems: updatedOrder.OrderItem.map((item) => ({
        ...item,
        price: item.price.toNumber(),
      })),
      shippingAddress: updatedOrder.shippingAddress as any,
    };

    // Invio Email
    try {
      await sendPurchaseReceiptEmail({ order: orderForEmail as any });
      console.log(`✅ Email PayPal inviata per ordine ${orderId}`);
    } catch (e) {
      console.error("⚠️ Errore invio email PayPal:", e);
    }

    return { success: true };
  } catch (error) {
    console.error("❌ ERRORE updateOrderAfterPayPalSuccess:", error);
    return { success: false, error: "Aggiornamento PayPal fallito." };
  }
}

// -------------------------------------------------------------
// ## ⭐ Server Action 3: getMyOrdersSummaryAction
// -------------------------------------------------------------
export async function getMyOrdersSummaryAction(): Promise<OrderSummary[]> {
  const session = await auth();
  const userId = session?.user.id;

  if (!userId) return [];

  try {
    const orders = await prisma.order.findMany({
      where: { userId: userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        orderNumber: true,
        createdAt: true,
        totalPrice: true,
        status: true,
        // ✅ CORREZIONE: Includi la relazione 'user'
        user: {
          select: {
            name: true,
          },
        },
        OrderItem: {
          select: {
            productId: true,
            name: true,
          },
        },
      },
    });

    // Mappatura sicura per il frontend
    const sanitizedOrders: OrderSummary[] = orders.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      createdAt: order.createdAt,
      totalPrice: order.totalPrice.toNumber(),
      status: order.status,
      user: order.user,
      orderItems: order.OrderItem.map((item) => ({
        id: item.productId, // Usa productId come ID dell'item
        name: item.name,
      })),
    }));

    return sanitizedOrders;
  } catch (error) {
    console.error("Errore getMyOrdersSummaryAction:", error);
    return [];
  }
}
