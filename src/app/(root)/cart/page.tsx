import CartTable from "./cart-table";
import { getMyCart } from "@/lib/actions/cart.queries";

export const metadata = {
    title: "Shopping Cart",
};

// Definisce la funzione per convertire i tipi di dati specifici di Prisma 
// (Decimal, JsonValue, null) in tipi compatibili con il frontend (number, undefined).
/**
 * Funzione di utilità per convertire i tipi Prisma (Decimal) in tipi JS standard (number)
 * e convertire userId: null in userId: undefined per la compatibilità con il frontend.
 * @param rawCart L'oggetto carrello ritornato direttamente da Prisma (usa 'any' per i tipi Decimal/JsonValue).
 * @returns L'oggetto carrello con i tipi convertiti.
 */
const cleanCartData = (rawCart: any): any => { // Usiamo 'any' per semplicità di tipizzazione qui
    if (!rawCart) return null;

    // Converte tutti i campi Decimal in number e null -> undefined
    const cleanedCart = {
        ...rawCart,
        // Conversione esplicita da Decimal a number
        itemsPrice: Number(rawCart.itemsPrice),
        totalPrice: Number(rawCart.totalPrice),
        shippingPrice: Number(rawCart.shippingPrice),
        taxPrice: Number(rawCart.taxPrice),
        
        // CONVERSIONE CRUCIALE: userId da null a undefined, se necessario
        userId: rawCart.userId === null ? undefined : rawCart.userId,
    };

    return cleanedCart; 
};

const CartPage = async () => {
    // 1. Ottieni il carrello da Prisma
    const rawCart = await getMyCart(); 

    // 2. ESEGUI la funzione e salva il RISULTATO PULITO nella variabile 'cart'
    const cart = cleanCartData(rawCart); 

    return (
        <>
            {/* 3. Passiamo la variabile 'cart' che ora è tipizzata correttamente. */}
            <CartTable cart={cart}/> 
        </>
    );
};

export default CartPage;
