"use server";

import { revalidatePath } from "next/cache";
import { BackendCartItem, Cart, CheckoutPayload, OrderStatus } from "@/types";
import { cookies } from "next/headers";
import { formatError } from "../utils";
import prisma from "@/db/prisma";
import { recalculateCartTotals } from "../utils";
import { getMyCart } from "./cart.queries";
import { paypal } from "../paypal"; // Import del servizio PayPal

// --- FUNZIONE PER OTTENERE TOKEN (NECESSARIA PER LA SERVER ACTION) ---
// In un ambiente reale, questa funzione chiamerebbe l'API /v1/oauth2/token
async function generateAccessToken(): Promise<string> {
    // SIMULAZIONE DEL TOKEN:
    return `MOCK-ACCESS-TOKEN-${Date.now()}`;
}
// ---------------------------------------------------------------------

/**
 * Server Action per recuperare i dettagli del carrello.
 */
export async function getMyCartAction(): Promise<Cart | null> {
  return getMyCart();
}

/**
 * Aggiunge un articolo (BackendCartItem) al carrello.
 */
export async function addItemToCart(data: BackendCartItem) {
  try {
    // ⭐ CORREZIONE ESSENZIALE: Verifica che il productId sia presente
    if (!data.productId) {
      return {
        success: false,
        message: "ID Prodotto mancante. Impossibile aggiungere al carrello.",
      };
    }

    const cookiesInstance = await cookies();
    const sessionCartId = cookiesInstance.get("sessionCartId")?.value;

    if (!sessionCartId) {
      return {
        success: false,
        message: "ID sessione carrello non trovato. Ricarica la pagina",
      };
    }

    if (isNaN(data.qty) || data.qty <= 0) {
      return {
        success: false,
        message: "La quantità del prodotto deve essere maggiore di zero.",
      };
    }

    let cart = await prisma.cart.findUnique({
      where: { sessionCartId: sessionCartId },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: {
          sessionCartId: sessionCartId,
          itemsPrice: 0,
          totalPrice: 0,
          shippingPrice: 0,
          taxPrice: 0,
          items: [],
        },
      });
      console.log("[DEBUG 1] Nuovo carrello creato con ID:", sessionCartId);
    } else {
      console.log("[DEBUG 1] Carrello esistente trovato:", sessionCartId);
    }

    // ✅ CORREZIONE: Cast a BackendCartItem[]
    let currentItems: BackendCartItem[] = (cart.items ||
      []) as BackendCartItem[];

    const existingItemIndex = currentItems.findIndex(
      (item) => item.productId === data.productId
    );

    if (existingItemIndex !== -1) {
      currentItems[existingItemIndex].qty += data.qty;
    } else {
      // Qui 'data' contiene productId grazie al controllo iniziale
      currentItems.push(data);
    }

    const updatedTotals = recalculateCartTotals(currentItems);

    // Rimuovi i log di debug se non necessari in produzione
    console.log(
      "[DEBUG FINALE] Articoli da salvare:",
      JSON.stringify(currentItems)
    );
    console.log("[DEBUG FINALE] Articoli ricevuti:", JSON.stringify(data));

    await prisma.cart.update({
      where: { sessionCartId: sessionCartId },
      data: {
        items: currentItems as any,
        itemsPrice: updatedTotals.itemsPrice,
        totalPrice: updatedTotals.totalPrice,
        shippingPrice: updatedTotals.shippingPrice,
        taxPrice: updatedTotals.taxPrice,
      },
    });

    revalidatePath("/");
    revalidatePath("/checkout");
    revalidatePath("/cart");

    return {
      success: true,
      message: "Articolo aggiunto al carrello con successo",
    };
  } catch (error) {
    console.error("Errore critico durante l'aggiunta al carrello:", error);
    return {
      success: false,
      message: formatError(error),
    };
  }
}

/**
 * Rimuove o decrementa un articolo dal carrello di sessione.
 */
export async function removeItemFromCart(
  productId: string,
  qtyToRemove: number = 1
) {
  try {
    const cookiesInstance = await cookies();
    const sessionCartId = cookiesInstance.get("sessionCartId")?.value;

    if (!sessionCartId) {
      return { success: false, message: "ID sessione carrello non trovato." };
    }

    let cart = await prisma.cart.findUnique({
      where: { sessionCartId: sessionCartId },
    });

    if (!cart) {
      return { success: false, message: "Carrello non trovato." };
    }

    // ✅ CORREZIONE: Cast a BackendCartItem[]
    let currentItems: BackendCartItem[] = (cart.items ||
      []) as BackendCartItem[];

    const existingItemIndex = currentItems.findIndex(
      (item) => item.productId === productId
    );

    if (existingItemIndex === -1) {
      return { success: false, message: "Articolo non presente nel carrello." };
    }

    const existingItem = currentItems[existingItemIndex];

    if (existingItem.qty > qtyToRemove) {
      existingItem.qty -= qtyToRemove;
      currentItems[existingItemIndex] = existingItem;
    } else {
      currentItems = currentItems.filter(
        (_, index) => index !== existingItemIndex
      );
    }

    const updatedTotals = recalculateCartTotals(currentItems);

    await prisma.cart.update({
      where: { sessionCartId: sessionCartId },
      data: {
        items: currentItems as any,
        itemsPrice: updatedTotals.itemsPrice,
        totalPrice: updatedTotals.totalPrice,
        shippingPrice: updatedTotals.shippingPrice,
        taxPrice: updatedTotals.taxPrice,
      },
    });

    cookiesInstance.set("sessionCartId", sessionCartId, {
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    revalidatePath("/");
    revalidatePath("/checkout");
    revalidatePath("/cart");

    return {
      success: true,
      message: "Articolo rimosso/decrementato con successo.",
    };
  } catch (error) {
    console.error("Errore durante la rimozione dal carrello:", error);
    return {
      success: false,
      message: formatError(error),
    };
  }
}

function generateOrderNumber(): string {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 100)
    .toString()
    .padStart(2, "0");
  return `ORD-${timestamp}${random}`;
}

/**
 * Crea l'Ordine e i suoi articoli nel DB, poi svuota il carrello.
 */
export async function createOrderAction(
  payload: CheckoutPayload & { paypalOrderId?: string }
) {
  try {
    const cart = await prisma.cart.findUnique({
      where: { id: payload.cartId },
      include: { user: { select: { name: true, email: true } } },
    });

    console.log(`[ORDINE CHECKOUT] Carrello ID ricevuto: ${payload.cartId}`);
    console.log(`[ORDINE CHECKOUT] Articoli nel carrello DB: ${(cart?.items as any)?.length || 0}`);

    // ⭐ CORREZIONE CRITICA: Aggiunto controllo robusto su cart.items
    if (!cart || !cart.items || !Array.isArray(cart.items) || (cart.items as BackendCartItem[]).length === 0) {
      return { success: false, message: "Carrello non trovato o vuoto." };
    }

    const currentCartItems = cart.items as BackendCartItem[];
    const finalTotals = recalculateCartTotals(currentCartItems);

    const isCOD = payload.paymentmethod === "Contrassegno";
    const orderNumber = generateOrderNumber();

    let initialStatus: OrderStatus;
    let paidAtDate: Date | null;

    if (isCOD) {
      initialStatus = "PENDING_PAYMENT" as OrderStatus;
      paidAtDate = null;
    } else {
      // Si presume che la chiamata sia successiva a un pagamento PayPal/Stripe andato a buon fine
      initialStatus = "PAID" as OrderStatus;
      paidAtDate = new Date();
    }

    const transactionResult = await prisma.$transaction(async (tx) => {

      // 1. CREA L'ORDINE PRINCIPALE
      const newOrder = await tx.order.create({
        data: {
          userId: payload.userId,
          orderNumber: orderNumber,
          shippingAddress: payload.shippingAddress as any,
          paymentmethod: payload.paymentmethod,
          itemsPrice: finalTotals.itemsPrice,
          shippingPrice: finalTotals.shippingPrice,
          taxPrice: finalTotals.taxPrice,
          totalPrice: finalTotals.totalPrice,

          status: initialStatus,
          paidAt: paidAtDate,

          paypalOrderId: payload.paypalOrderId,
          paymentResult: isCOD ? { method: "COD" } : undefined,
        },
        select: { id: true, orderNumber: true },
      });

      // 2. PREPARA E CREA GLI ARTICOLI ORDINE (Operazione separata)
      const itemsToCreate = currentCartItems
        .filter((item) => item.productId)
        .map((item) => ({
          orderId: newOrder.id, // 💡 Collega all'ID appena creato!
          // ⭐ CONVERSIONE ESPLICITA per prevenire errori di tipo Decimal/Int
          qty: Number(item.qty),
          price: Number(item.price),
          name: item.name,
          slug: item.slug,
          image: item.image,
          productId: item.productId,
        }));

      // 🛑 DEBUG CRITICO: Controlla i dati che stai per inviare
      console.log("[DEBUG ITEMS] Dati OrderItem da inviare:", JSON.stringify(itemsToCreate, null, 2));


      if (itemsToCreate.length > 0) {

        // 🛑 DEBUG CRITICO: Controlla l'ID del nuovo ordine
        console.log(`[DEBUG ITEMS] Tentativo createMany con Order ID: ${newOrder.id}`);

        const createManyResult = await tx.orderItem.createMany({ // ⬅️ Creazione esplicita e robusta
          data: itemsToCreate,
        });

        // 🛑 DEBUG CRITICO: Controlla quanti record sono stati creati
        console.log("[DEBUG ITEMS] Risultato createMany (Count):", createManyResult.count);
      }


      // 3. LOGICA DI STOCK E CANCELLAZIONE CARRELLO (Rimane INTATTA)

      if (isCOD || payload.paymentmethod.toLowerCase().includes("paypal")) {
        const validItemsToUpdate = currentCartItems.filter(item => item.productId && item.qty > 0);

        for (const item of validItemsToUpdate) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.qty } },
          });
        }
      }

      await tx.cart.delete({
        where: { id: payload.cartId },
      });

      return newOrder;
    });

    // ... (Revalidate paths e return di successo)
    revalidatePath("/");
    revalidatePath("/dashboard/orders");
    revalidatePath("/admin/orders"); // 
    revalidatePath(`/dashboard/orders/${transactionResult.orderNumber}`);

    return {
      success: true,
      message: "Ordine creato e carrello svuotato con successo.",
      orderNumber: transactionResult.orderNumber,
    };

  } catch (error) {
    console.error("ERRORE CRITICO NELLA CREAZIONE DELL'ORDINE:", error);
    return {
      success: false,
      message:
        formatError(error) || "Errore sconosciuto nella creazione dell'ordine.",
    };
  }
}
/**
 * Crea un ordine di pagamento su PayPal (non un ordine DB).
 */
export async function createPaypalOrder(cartId: string) {
  try {
    const cart = await prisma.cart.findUnique({
      where: { id: cartId },
    });

    if (!cart) {
      return { success: false, message: "Carrello non trovato." };
    }

    // 1. Genera il token di accesso
    const accessToken = await generateAccessToken(); 

    // 2. Calcola i totali finali e ottieni gli articoli
    const currentCartItems = cart.items as BackendCartItem[]; // Cast corretto
    const finalTotals = recalculateCartTotals(currentCartItems); 

    // 3. CHIAMA createOrder CON I 3 ARGOMENTI CORRETTI
    const paypalOrder = await paypal.createOrder(
        accessToken, 
        finalTotals, 
        currentCartItems
    );

    return {
      success: true,
      message: "Ordine PayPal creato con successo",
      data: paypalOrder.id,
    };
  } catch (error) {
    console.error("Errore nella creazione dell'ordine PayPal:", error);
    return { success: false, message: formatError(error) };
  }
}