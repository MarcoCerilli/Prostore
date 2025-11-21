"use server";

import { revalidatePath } from "next/cache";
import { BackendCartItem, Cart, CheckoutPayload, OrderStatus } from "@/types";
import { cookies } from "next/headers";
import { formatError } from "../utils";
import prisma from "@/db/prisma";
import { recalculateCartTotals } from "../utils";
import { getMyCart } from "./cart.queries";
import { paypal } from "../paypal";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

// --- FUNZIONI UTILITY ---
async function generateAccessToken(): Promise<string> {
    return `MOCK-ACCESS-TOKEN-${Date.now()}`;
}

function generateOrderNumber(): string {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 100).toString().padStart(2, "0");
    return `ORD-${timestamp}${random}`;
}

function ArrayOfItems(items: any): items is BackendCartItem[] {
    return Array.isArray(items);
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

console.log(`[DEBUG CART] Articolo ricevuto: ${JSON.stringify(data)}`);

  try {
    
    if (!data.productId) {
      return {
        success: false,
        message: "ID Prodotto mancante. Impossibile aggiungere al carrello.",
      };
    }

    // ⭐ Utilizzo diretto di cookies().get() per evitare l'errore di tipizzazione.
    const sessionCartId = (await cookies()).get("sessionCartId")?.value;

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
    }

    let currentItems: BackendCartItem[] = (cart.items || []) as BackendCartItem[];

    const existingItemIndex = currentItems.findIndex(
      (item) => item.productId === data.productId
    );

    if (existingItemIndex !== -1) {
      currentItems[existingItemIndex].qty += data.qty;
    } else {
      currentItems.push(data);
    }

    const updatedTotals = recalculateCartTotals(currentItems);

// ⭐ LOG DI DEBUG 2: Cosa viene salvato nel DB
        console.log(`[DEBUG CART] Totale articoli prima del salvataggio: ${currentItems.length}`);
        console.log(`[DEBUG CART] Totale carrello aggiornato: ${updatedTotals.totalPrice}`);

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
    // ⭐ Utilizzo diretto di cookies().get() per evitare l'errore di tipizzazione.
    const sessionCartId = (await cookies()).get("sessionCartId")?.value;

    if (!sessionCartId) {
      return { success: false, message: "ID sessione carrello non trovato." };
    }

    let cart = await prisma.cart.findUnique({
      where: { sessionCartId: sessionCartId },
    });

    if (!cart) {
      return { success: false, message: "Carrello non trovato." };
    }

    let currentItems: BackendCartItem[] = (cart.items || []) as BackendCartItem[];

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

    // La logica di re-impostazione del cookie è stata rimossa, in quanto ridondante
    // dato che il sessionCartId non è cambiato in questa azione.

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


// 🔒 Nuova Action: Finalizzazione dell'Ordine (Post-Pagamento)

/**
 * Funzione da chiamare DOPO che Stripe/PayPal ha confermato il pagamento, 
 * oppure DOPO l'azione 'Contrassegno' se la logica lo richiede.
 * - Aggiorna lo stato.
 * - Decrementa lo stock.
 * - Svuota il carrello (risolvendo il problema del carrello vuoto).
 */
export async function finalizeOrder(
    orderId: string, // ID del carrello DB da eliminare
    cartId: string, // ID del carrello DB da eliminare
    paymentResult: any,
    status: OrderStatus = 'PAID'
) {
    try {
        const order = await prisma.order.findUnique({ where: { id: orderId } });
        const cart = await prisma.cart.findUnique({ where: { id: cartId } });

        if (!order || !cart) {
            return { success: false, message: "Ordine o carrello non trovati per la finalizzazione." };
        }
        
        // Impedisce la doppia finalizzazione (protezione essenziale)
        if (order.status === 'PAID' || order.status === 'SHIPPED') {
            return { success: true, message: "Ordine già finalizzato." };
        }

        const cartItems = cart.items as BackendCartItem[];

        await prisma.$transaction(async (tx) => {
            // 1. Aggiorna lo stato dell'ordine e il risultato del pagamento
            await tx.order.update({
                where: { id: orderId },
                data: {
                    status: status, 
                    paidAt: new Date(),
                    paymentResult: paymentResult,
                },
            });

            // 2. Decrementa lo stock
            for (const item of cartItems) {
                await tx.product.update({
                    where: { id: item.productId },
                    data: { stock: { decrement: item.qty } },
                });
            }

            // 3. Cancella il carrello (USA deleteMany per sicurezza)
            // Questo è il punto in cui il carrello viene rimosso dal DB.
            await tx.cart.deleteMany({
                where: { id: cartId },
            });
        });

        revalidatePath(`/dashboard/orders/${order.orderNumber}`);
        return { success: true, message: "Ordine finalizzato con successo." };

    } catch (error) {
        console.error("ERRORE CRITICO NELLA finalizzazione dell'ordine:", error);
        return { success: false, message: "Errore durante la finalizzazione." };
    }
}

// 💸 Logica PayPal (Senza Modifiche Logiche)

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
    const currentCartItems = cart.items as BackendCartItem[]; 
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