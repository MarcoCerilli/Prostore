"use server"; // Direttiva: Assicura che la funzione venga eseguita solo sul lato server.

// 💡 NUOVA IMPORTAZIONE
import { revalidatePath } from "next/cache"; 

// Importazioni esistenti
import { CartItem, Cart, CheckoutPayload } from "@/types"; // Importiamo il tipo Cart del frontend
import { cookies } from "next/headers"; // API per l'accesso ai cookie di richiesta/risposta.
import { formatError } from "../utils"; // Funzione di utilità per formattare gli errori.
import prisma from "@/db/prisma"; // Istanza del client Prisma per l'interazione con il database.
import { recalculateCartTotals } from "../utils";
// import { success } from "zod"; // Rimosso l'importazione non utilizzata
import { getMyCart } from "./cart.queries"; // Importiamo la funzione server-only

/**
 * Server Action per recuperare i dettagli del carrello.
 * Questo è l'unico punto che DEVE essere importato dai Client Components (es. CheckoutSummary).
 */
export async function getMyCartAction(): Promise<Cart | null> {
    // La Server Action chiama la funzione Server-only 'getMyCart'
    return getMyCart();
}

/**
 * Aggiunge un articolo (CartItem) al carrello, cercando o creando la sessione carrello nel database.
 * @param data L'oggetto CartItem da aggiungere (Prodotto, quantità, ecc.).
 * @returns Un oggetto con 'success' e 'message' (risultato dell'operazione).
 */
export async function addItemToCart(data: CartItem) {
  try {
    // 1. Recupero dell'ID Sessione Carrello
    const cookiesInstance = await cookies();
    const sessionCartId = cookiesInstance.get("sessionCartId")?.value;

    if (!sessionCartId) {
      return {
        success: false,
        message: "ID sessione carrello non trovato. Ricarica la pagina",
      };
    }
    
    // ✅ FIX MINORE: Assicura che la quantità sia un numero valido e positivo
    if (isNaN(data.qty) || data.qty <= 0) {
        return { success: false, message: "La quantità del prodotto deve essere maggiore di zero." };
    }

    // 💡 TEST 3: Log dei dati iniziali (Già presente)
    console.log({
      ACTION_START: true,
      SessionID: sessionCartId,
      ItemToAdd: data.name,
      Qty: data.qty,
    });

    // 2. Cerca o Crea il Carrello nel DB tramite sessionCartId
    let cart = await prisma.cart.findUnique({
      where: { sessionCartId: sessionCartId },
    });

    // Se il carrello non esiste, creane uno nuovo
    if (!cart) {
      cart = await prisma.cart.create({
        data: {
          /* ... dati di inizializzazione ... */ sessionCartId: sessionCartId,
          itemsPrice: 0,
          totalPrice: 0,
          shippingPrice: 0,
          taxPrice: 0,
          items: [],
        },
      });
      console.log("[DEBUG 1] Nuovo carrello creato con ID:", sessionCartId); // ⬅️ DEBUG 1: Nuovo carrello
    } else {
      console.log("[DEBUG 1] Carrello esistente trovato:", sessionCartId); // ⬅️ DEBUG 1: Carrello esistente
    }

    // 3. Logica di Aggiornamento degli Articoli
    let currentItems: CartItem[] = (cart.items || []) as CartItem[];

    const existingItemIndex = currentItems.findIndex(
      (item) => item.productId === data.productId
    );

    if (existingItemIndex !== -1) {
      currentItems[existingItemIndex].qty += data.qty;
      console.log(
        `[DEBUG 2] Quantità incrementata per: ${data.name}. Nuova Qty: ${currentItems[existingItemIndex].qty}`
      ); // ⬅️ DEBUG 2: Incremento
    } else {
      currentItems.push(data);
      console.log(`[DEBUG 2] Nuovo articolo aggiunto: ${data.name}`); // ⬅️ DEBUG 2: Aggiunto
    }

    // ✅ CHIAMATA ALLA NUOVA FUNZIONE
    const updatedTotals = recalculateCartTotals(currentItems);

    // ⬅️ DEBUG 3: Verifica Totali e Articoli finali
    console.log("[DEBUG 3] Totali ricalcolati:", updatedTotals);
    console.log("[DEBUG 3] Carrello articoli (dopo modifica):", currentItems);

    // 4. Aggiorna il Carrello nel Database
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

    // 5. AGGIORNAMENTO UI LATO SERVER
    // ✅ FIX: Invalida esplicitamente le pagine che mostrano i totali
    revalidatePath("/");
    revalidatePath("/checkout"); 
    revalidatePath("/cart"); // Invalida la pagina carrello dedicata, se esiste
    
    // Risposta di Successo
    console.log("[DEBUG 4] Aggiornamento DB riuscito."); // ⬅️ DEBUG 4: Successo
    return {
      success: true,
      message: "Articolo aggiunto al carrello con successo",
    };
  } catch (error) {
    // Gestione degli Errori
    console.error("Errore critico durante l'aggiunta al carrello:", error); // ⬅️ Errore con dettaglio
    return {
      success: false,
      message: formatError(error),
    };
  }
}

/**
 * Rimuove o decrementa un articolo dal carrello di sessione.
 * @param productId L'ID del prodotto da rimuovere/decrementare.
 * @param qtyToRemove La quantità da decrementare (es. 1).
 * @returns Un oggetto con 'success' e 'message'.
 */
export async function removeItemFromCart(
  productId: string,
  qtyToRemove: number = 1
) {
  try {
    // 1. Recupero dell'ID Sessione Carrello (Stessa logica di addItemToCart)
    const cookiesInstance = await cookies();
    const sessionCartId = cookiesInstance.get("sessionCartId")?.value;

    if (!sessionCartId) {
      return { success: false, message: "ID sessione carrello non trovato." };
    }

    // 2. Cerca il Carrello nel DB (Non serve creare se non esiste, in questo caso)
    let cart = await prisma.cart.findUnique({
      where: { sessionCartId: sessionCartId },
    });

    if (!cart) {
      return { success: false, message: "Carrello non trovato." };
    }

    // 3. Logica di Rimozione/Decremento
    let currentItems: CartItem[] = (cart.items || []) as CartItem[];

    // Trova l'indice dell'articolo da modificare
    const existingItemIndex = currentItems.findIndex(
      (item) => item.productId === productId
    );

    if (existingItemIndex === -1) {
      return { success: false, message: "Articolo non presente nel carrello." };
    }

    // Riferimento all'articolo da modificare
    const existingItem = currentItems[existingItemIndex];

    // A. DECREMENTO: Se la quantità da rimuovere è minore della quantità corrente
    if (existingItem.qty > qtyToRemove) {
      existingItem.qty -= qtyToRemove;

      // Manteniamo l'articolo nell'array con la quantità aggiornata
      currentItems[existingItemIndex] = existingItem;

      // B. RIMOZIONE TOTALE: Se la quantità da rimuovere è uguale o maggiore della quantità corrente
    } else {
      // Filtriamo l'array per rimuovere completamente l'articolo
      currentItems = currentItems.filter(
        (_, index) => index !== existingItemIndex
      );
    }

    // 4. Ricalcolo dei Totali e Aggiornamento del Database

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


      // Questo è il workaround per il 'cookie lag' in Next.js, assicurando che l'ID corretto 
      // sia disponibile per la richiesta di rinfresco successiva.
    cookiesInstance.set("sessionCartId", sessionCartId, {
        path: '/', 			
        maxAge: 60 * 60 * 24 * 7, 
        // ⚠️ Deve corrispondere all'impostazione del middleware, quindi senza httpOnly
        secure: process.env.NODE_ENV === 'production', 
        sameSite: 'lax',
    });

    
    // 5. AGGIORNAMENTO UI LATO SERVER
    // ✅ FIX: Invalida esplicitamente le pagine che mostrano i totali
    revalidatePath("/");
    revalidatePath("/checkout"); 
    revalidatePath("/cart"); // Invalida la pagina carrello dedicata, se esiste

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

/*
**
 * Funzione di utilità per generare un numero d'ordine leggibile e progressivo.
 * NOTA: Per un uso in produzione, usa una logica di incremento sequenziale
 * o un servizio esterno per prevenire collisioni. Qui usiamo un random semplice.
 */
function generateOrderNumber(): string {
    const timestamp = Date.now().toString().slice(-6); // Ultimi 6 cifre del timestamp
    const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    return `ORD-${timestamp}${random}`;
}

/**
 * 🛑 NUOVA SERVER ACTION: Crea l'Ordine e i suoi Articoli nel DB, poi svuota il carrello.
 * Questa funzione deve essere chiamata dal componente client dopo il pagamento.
 * @param payload I dati finali dell'ordine.
 */
export async function createOrderAction(payload: CheckoutPayload) {
    // 1. Recupera il carrello e i suoi articoli (che sono nel campo JSON 'items')
    const cart = await prisma.cart.findUnique({
        where: { id: payload.cartId },
        // Potresti voler includere i dati dell'utente se devi mandarli all'esterno
        include: { user: { select: { name: true, email: true } } }, 
    });

    if (!cart || (cart.items as CartItem[]).length === 0) {
        return { success: false, message: "Carrello non trovato o vuoto." };
    }
    
    // I tuoi articoli del carrello sono memorizzati come JSON/Json[],
    // dobbiamo mapparli nel formato richiesto da OrderItem (che è una relazione 1:N)
    const currentCartItems = cart.items as CartItem[];

    // 2. Trasforma gli articoli del carrello nel formato 'OrderItem' per la scrittura annidata
    const orderItemsForPrisma = currentCartItems.map(item => ({
        qty: item.qty,
        price: item.price,
        name: item.name,
        slug: item.slug,
        image: item.image,
        // Collega OrderItem al Product (Assicurati che item.productId esista e sia corretto)
        product: {
            connect: { id: item.productId } 
        }
    }));
    
    // 3. Esegui la Transazione (Atomicità: Crea Ordine + Elimina Carrello)
    try {
        const orderNumber = generateOrderNumber(); // Genera il numero leggibile

        const transactionResult = await prisma.$transaction(async (tx) => {
            // A. Crea l'Ordine e i suoi Articoli (SCRITTURA ANNIDATA)
            const newOrder = await tx.order.create({
                data: {
                    userId: payload.userId,
                    orderNumber: orderNumber, // ✅ CAMPO RISOLUTIVO
                    shippingAddress: payload.shippingAddress as any,
                    paymentmethod: payload.paymentmethod,
                    itemsPrice: payload.itemsPrice,
                    shippingPrice: payload.shippingPrice,
                    taxPrice: payload.taxPrice,
                    totalPrice: payload.totalPrice,
                    isPaid: true,
                    paidAt: new Date(),
                    
                    // 🛑 SCRITTURA ANNIDATA: Crea TUTTI gli OrderItem collegati al nuovo Ordine
                    OrderItem: { 
                        create: orderItemsForPrisma 
                    }
                },
                select: { id: true, orderNumber: true }
            });

            // B. Svuota o Elimina il Carrello (per completare l'acquisto)
            await tx.cart.delete({
                where: { id: payload.cartId },
            });
            
            return newOrder;
        });
        
        // 4. Invalida le cache
        revalidatePath("/");
        revalidatePath("/dashboard/orders"); // Aggiorna la lista ordini nel pannello
        revalidatePath(`/dashboard/orders/${transactionResult.orderNumber}`); // Aggiorna la nuova pagina

        return { 
            success: true, 
            message: "Ordine creato e carrello svuotato con successo.",
            orderNumber: transactionResult.orderNumber,
        };

    } catch (error) {
        console.error("ERRORE CRITICO NELLA CREAZIONE DELL'ORDINE:", error);
        return { 
            success: false, 
            message: formatError(error) || "Errore sconosciuto nella creazione dell'ordine." 
        };
    }
}
