/**
 * Struttura di OrderItem basata su OrderItemSchema di Zod.
 */
export type OrderItem = {
    productId: string;
    name: string;
    quantity: number;
    price: number;
    imageUrl?: string;
};

/**
 * Struttura di ShippingAddress basata su shippingAddressSchema di Zod.
 * Uso i nomi dei campi che hai nel tuo Zod: street e postalCode
 */
export type ShippingAddress = {
    firstName: string;
    lastName: string;
    street: string; 
    houseNumber: string;
    city: string;
    postalCode: string; 
    country: string;
    phoneNumber?: string; 
    notes?: string | null;
    latitude?: string | null;
    longitude?: string | null;
};


/**
 * Struttura di Order basata su OrderSchema di Zod.
 */
export type Order = {
    _id: string; 
    userId: string;
    shippingAddress: ShippingAddress;
    paymentMethod: { paymentMethod: 'Paypal' | 'Stripe' | 'Contrassegno' };
    subtotal: number;
    shippingCost: number;
    tax: number;
    totalAmount: number;
    items: OrderItem[];
    createdAt: string; 
    isPaid: boolean; 
    paidAt?: string; 
    isDelivered: boolean; 
    deliveredAt?: string; 
};

// -----------------------------------------------------------
// Funzioni di Utilità (Rimosse da qui e spostate nel componente per semplificare l'import)
// -----------------------------------------------------------

/**
 * Funzione di utilità per formattare i numeri in valuta italiana.
 * @param amount L'importo numerico.
 * @returns Una stringa formattata come valuta EUR.
 */
export const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('it-IT', {
        style: 'currency',
        currency: 'EUR',
    }).format(amount);
};

/**
 * Formatta un indirizzo di spedizione in una singola stringa leggibile.
 * @param address L'oggetto ShippingAddress.
 * @returns Una stringa formattata per l'indirizzo.
 */
export const formatAddress = (address: ShippingAddress): string => {
    // Uso i nomi dei campi che hai nel tuo Zod: street e postalCode
    const fullStreet = `${address.street}, ${address.houseNumber}`;
    const location = `${address.postalCode} ${address.city}, ${address.country}`;
    
    // Gestisco la possibilità che phoneNumber sia mancante
    const phone = address.phoneNumber ? `Telefono: ${address.phoneNumber}` : '';

    return `${address.firstName} ${address.lastName}\n${fullStreet}\n${location}\n${phone}`;
}
