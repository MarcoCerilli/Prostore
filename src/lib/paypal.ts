// --- FUNZIONI DI UTILITÀ PER LA FORMATTAZIONE ---

/**
 * Assicura che un numero sia formattato come stringa a due decimali
 * per l'API di PayPal (es: 199.9 -> "199.90").
 */
function toPayPalFormat(value: number): string {
    return parseFloat(value.toFixed(2)).toFixed(2);
}

/**
 * Costruisce il payload di PayPal per la creazione dell'Ordine, 
 * assicurando che il "breakdown" sia matematicamente corretto.
 * @param cartTotals - I totali del carrello (itemsPrice, taxPrice, shippingPrice).
 * @param cartItems - L'array di articoli con price e qty.
 * @returns Il payload completo per l'API /v2/checkout/orders
 */
export function buildPayPalPayload(cartTotals: any, cartItems: any[]): any {
    // 1. Prepara la lista di articoli (Items Array)
    const items = cartItems.map(item => ({
        name: item.name,
        unit_amount: {
            currency_code: "EUR",
            value: toPayPalFormat(item.price) // Prezzo unitario formattato
        },
        quantity: item.qty.toString() 
    }));

    // 2. Costruisce la sezione "breakdown"
    const breakdown = {
        item_total: {
            currency_code: "EUR",
            value: toPayPalFormat(cartTotals.itemsPrice) // Somma degli articoli
        },
        shipping: {
            currency_code: "EUR",
            value: toPayPalFormat(cartTotals.shippingPrice)
        },
        tax_total: {
            currency_code: "EUR",
            value: toPayPalFormat(cartTotals.taxPrice)
        },
    };
    
    // 3. Calcola il totale complessivo
    const totalAmount = cartTotals.itemsPrice + cartTotals.shippingPrice + cartTotals.taxPrice;

    return {
        intent: "CAPTURE",
        purchase_units: [{
            items: items, 
            amount: {
                currency_code: "EUR",
                value: toPayPalFormat(totalAmount), 
                breakdown: breakdown
            }
        }]
    };
}


// --- OGGETTO SERVIZIO PAYPAL PRINCIPALE ---

export const paypal = {
    /**
     * Crea un ordine PayPal usando i dati del carrello e un token fornito.
     * @param accessToken - Il token di accesso PayPal generato dal router.
     * @param cartTotals - I totali dell'ordine.
     * @param cartItems - Gli articoli dell'ordine.
     * @returns La risposta JSON dall'API di PayPal.
     */
    async createOrder(accessToken: string, cartTotals: any, cartItems: any[]) {
        // Usa la funzione di utilità per costruire il payload
        const payload = buildPayPalPayload(cartTotals, cartItems);
        
        const apiUrl = process.env.PAYPAL_API_URL || "https://api-m.sandbox.paypal.com"; 

        const response = await fetch(`${apiUrl}/v2/checkout/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Usa il token di accesso passato come argomento
                'Authorization': `Bearer ${accessToken}`, 
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorBody = await response.json();
            console.error("Creazione Ordine PayPal Fallita:", errorBody);
            throw new Error(`Errore API PayPal (Status ${response.status}): ${errorBody.name}`);
        }

        return response.json();
    },

    async capturePayment(accessToken: string, orderId: string) {
        // Avrebbe bisogno del token anche questa
        // ...
        return { status: "COMPLETED" };
    },
};