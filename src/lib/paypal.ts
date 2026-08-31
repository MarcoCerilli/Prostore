// --- FUNZIONI DI UTILITÀ PER LA FORMATTAZIONE ---

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID || process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
const PAYPAL_APP_SECRET = process.env.PAYPAL_APP_SECRET || process.env.PAYPAL_SECRET;
const PAYPAL_API_URL = process.env.PAYPAL_API_URL || "https://api-m.sandbox.paypal.com";

/**
 * Assicura che un numero sia formattato come stringa a due decimali
 * per l'API di PayPal (es: 199.9 -> "199.90").
 */
function toPayPalFormat(value: number): string {
    return parseFloat(value.toFixed(2)).toFixed(2);
}

/**
 * Genera il token di accesso OAuth 2.0 per PayPal
 */
export async function generateAccessToken(): Promise<string> {
    const clientId = PAYPAL_CLIENT_ID;
    const appSecret = PAYPAL_APP_SECRET;

    if (!clientId || !appSecret) {
        if (process.env.NODE_ENV === "test") {
            return "mock_paypal_access_token_12345678901234567890";
        }
        throw new Error("Credenziali PayPal mancanti (PAYPAL_CLIENT_ID o PAYPAL_APP_SECRET).");
    }

    const auth = Buffer.from(`${clientId}:${appSecret}`).toString("base64");
    const response = await fetch(`${PAYPAL_API_URL}/v1/oauth2/token`, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${auth}`,
        },
        body: "grant_type=client_credentials",
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Generazione token PayPal fallita: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    return data.access_token;
}

/**
 * Costruisce il payload di PayPal per la creazione dell'Ordine, 
 * assicurando che il "breakdown" sia matematicamente corretto.
 */
export function buildPayPalPayload(
    cartTotals: { itemsPrice: number; shippingPrice: number; taxPrice: number }, 
    cartItems: { name: string; price: number; qty: number }[]
) {
    const items = cartItems.map(item => ({
        name: item.name,
        unit_amount: {
            currency_code: "EUR",
            value: toPayPalFormat(item.price),
        },
        quantity: item.qty.toString(),
    }));

    const breakdown = {
        item_total: {
            currency_code: "EUR",
            value: toPayPalFormat(cartTotals.itemsPrice),
        },
        shipping: {
            currency_code: "EUR",
            value: toPayPalFormat(cartTotals.shippingPrice),
        },
        tax_total: {
            currency_code: "EUR",
            value: toPayPalFormat(cartTotals.taxPrice),
        },
    };
    
    const totalAmount = cartTotals.itemsPrice + cartTotals.shippingPrice + cartTotals.taxPrice;

    return {
        intent: "CAPTURE",
        purchase_units: [{
            items: items.length > 0 ? items : undefined, 
            amount: {
                currency_code: "EUR",
                value: toPayPalFormat(totalAmount), 
                breakdown: items.length > 0 ? breakdown : undefined,
            },
        }],
    };
}

// --- OGGETTO SERVIZIO PAYPAL PRINCIPALE ---

export const paypal = {
    /**
     * Crea un ordine PayPal
     */
    async createOrder(
        tokenOrPrice: string | number, 
        cartTotals?: { itemsPrice: number; shippingPrice: number; taxPrice: number }, 
        cartItems?: { name: string; price: number; qty: number }[]
    ) {
        let accessToken: string;
        let payload: unknown;

        if (typeof tokenOrPrice === "number") {
            accessToken = await generateAccessToken();
            payload = {
                intent: "CAPTURE",
                purchase_units: [
                    {
                        amount: {
                            currency_code: "EUR",
                            value: toPayPalFormat(tokenOrPrice),
                        },
                    },
                ],
            };
        } else {
            accessToken = tokenOrPrice;
            payload = buildPayPalPayload(
                cartTotals || { itemsPrice: 0, shippingPrice: 0, taxPrice: 0 }, 
                cartItems || []
            );
        }

        const response = await fetch(`${PAYPAL_API_URL}/v2/checkout/orders`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`, 
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorBody = await response.json().catch(() => ({}));
            console.error("Creazione Ordine PayPal Fallita:", errorBody);
            throw new Error(`Errore API PayPal (Status ${response.status})`);
        }

        return response.json();
    },

    /**
     * Cattura un pagamento per un ordine completato
     */
    async capturePayment(orderId: string, accessToken?: string) {
        const token = accessToken || (await generateAccessToken());

        const response = await fetch(`${PAYPAL_API_URL}/v2/checkout/orders/${orderId}/capture`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            const errorBody = await response.json().catch(() => ({}));
            console.error("Cattura Pagamento PayPal Fallita:", errorBody);
            throw new Error(`Errore Cattura PayPal (Status ${response.status})`);
        }

        return response.json();
    },
};