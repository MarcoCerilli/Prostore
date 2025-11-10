// src/lib/actions/cart.queries.ts
// Questa funzione sarà utilizzata da Server Components (es. page.tsx)

import { cookies } from "next/headers"; // Importazione corretta
import prisma from "@/db/prisma"; // Assumi che l'import di Prisma sia questo
import { Cart as PrismaCartModel } from "@prisma/client"; // Alias per il tipo Cart di Prisma (con Decimal)
import { unstable_noStore } from "next/cache";

// Importiamo il tipo front-end (con i prezzi come 'number')
import { Cart, BackendCartItem } from "@/types"; 
// NOTA: Assumiamo che il tuo file "@/types" contenga l'interfaccia Cart
// che definisce i campi price come number.

// TIPIZZAZIONE INTERMEDIA: Estendiamo il tipo base di Prisma per tipizzare correttamente l'array 'items'
// e per preparare i campi Decimali alla conversione.
export interface CartWithDecimalItems extends PrismaCartModel { 
    // I campi Price sono ancora Decimal qui.
    items: BackendCartItem[]; // Lo array items è il tipo corretto del frontend
}

/**
 * Funzione helper per convertire i campi Decimal di Prisma in 'number' di JavaScript.
 * @param rawCart L'oggetto carrello grezzo con tipi Decimali.
 * @returns L'oggetto Cart del frontend con tipi 'number'.
 */
function convertDecimalsToNumbers(rawCart: CartWithDecimalItems): Cart {
    // Si crea una copia dell'oggetto e si convertono le proprietà Decimal.
    return {
        ...rawCart,
        // Esegui la conversione di ogni campo Decimal in Number
        itemsPrice: rawCart.itemsPrice.toNumber(),
        totalPrice: rawCart.totalPrice.toNumber(),
        shippingPrice: rawCart.shippingPrice.toNumber(),
        taxPrice: rawCart.taxPrice.toNumber(),
        // Gestiamo userId: se null nel DB, diventa undefined nel frontend (se Cart lo richiede)
        userId: rawCart.userId || undefined, 
    } as Cart; // Castiamo al tipo finale Cart del frontend
}


/**
 * Recupera l'intero oggetto carrello dal database basandosi sull'ID della sessione.
 * NOTA: Questa è una funzione Server-only e può essere chiamata SOLO da Server Components o da Server Actions.
 * @returns L'oggetto Cart (pulito con 'number') o null se non trovato.
 */
export async function getMyCart(): Promise<Cart | null> { // <-- Ora restituisce Promise<Cart | null>
    // Questo forza Next.js a rieseguire la query al database ad ogni richiesta GET.
    unstable_noStore();

    // 1. Recupera l'ID Sessione Carrello
    
    
    const sessionCartId = (await cookies()).get("sessionCartId")?.value;

    if (!sessionCartId) {
        console.log("[Query] Sessione carrello non trovata.");
        return null;
    }

    // 2. Cerca il carrello (risultato conterrà i tipi Decimal)
    const rawCart = (await prisma.cart.findUnique({
        where: { sessionCartId: sessionCartId },
    })) as CartWithDecimalItems | null; // Usiamo il tipo che contiene i Decimal

    if (!rawCart) {
        console.log(
            `[Query] Carrello non trovato per sessione ID: ${sessionCartId}`
        );
        return null;
    } 
    
    // 3. CONVERSIONE: Convertiamo i campi Decimal in number
    const finalCart = convertDecimalsToNumbers(rawCart);

    console.log(
        `[Query] Carrello letto: ${finalCart.id}. Articoli trovati: ${finalCart.items.length}`
    );

    return finalCart; // Restituiamo il tipo 'Cart' pulito (con 'number')
}
