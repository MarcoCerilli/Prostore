// File: src/components/order/PaypalButtonComponent.tsx

'use client';

import { PayPalButtons, usePayPalScriptReducer } from "@paypal/react-paypal-js"; 
import React from "react";
// Assicurati che CartItem sia importato o definito se necessario
// import { CartItem } from "@/types"; 

// --- Tipizzazione Props CORRETTA per PayPal ---
interface PaypalButtonProps {
    orderId: string;
    finalPrice: string;       // Totale FINALE (es. "110.90")
    itemsPrice: string;       // Subtotale Articoli (es. "85.90")
    shippingPrice: string;    // Costo Spedizione (es. "5.00")
    taxPrice: string;         // Totale Tasse (es. "20.00")
    items: any[];             // Potrebbe essere CartItem[] se tipizzato globalmente
    userId: string;
    isPaid: boolean;
    onPaymentSuccess: (details: any) => void;
    // Rimosse le vecchie props non tipizzate
}
// ---------------------------------------------------

const PayPalButtonComponent: React.FC<PaypalButtonProps> = ({
    orderId,
    finalPrice,
    itemsPrice, 
    shippingPrice, 
    taxPrice, 
    items,
    userId,
    isPaid,
    onPaymentSuccess,
}) => {
    const [{ isPending }] = usePayPalScriptReducer();
    
    // Convertiamo il prezzo finale in numero
    const finalPriceNumber = parseFloat(finalPrice);
    
    // 🛑 GUARDIA CRITICA PER PREVENIRE L'ERRORE PAYPAL 422
    if (finalPriceNumber <= 0 || isNaN(finalPriceNumber)) {
        return (
            <div className="w-full text-center p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 font-semibold">
                    Errore Pagamento: L'importo totale deve essere superiore a zero.
                </p>
            </div>
        );
    }
    // ----------------------------------------------------

    // Funzione per creare l'ordine (ORA CON IL CAMPO BREAKDOWN)
    const createOrder = (data: any, actions: any) => {
        
        return actions.order.create({
            intent: "CAPTURE",
            purchase_units: [
                {
                    description: `Acquisto carrello ${orderId}`,
                    amount: {
                        currency_code: "EUR",
                        value: finalPrice, 
                        
                        // ✅ SEZIONE BREAKDOWN CORRETTA
                        breakdown: {
                            item_total: { // Risolve ITEM_TOTAL_REQUIRED
                                currency_code: "EUR",
                                value: itemsPrice, 
                            },
                            shipping: {
                                currency_code: "EUR",
                                value: shippingPrice, 
                            },
                            tax_total: {
                                currency_code: "EUR",
                                value: taxPrice, 
                            },
                        },
                        // FINE BREAKDOWN
                    },
                    
                    items: items.map(item => ({
                        name: item.name,
                        unit_amount: {
                            currency_code: "EUR",
                            // Calcolo del prezzo unitario
                            value: (parseFloat(item.price) / item.quantity).toFixed(2), 
                        },
                        quantity: item.quantity.toString(),
                    }))
                },
            ],
            application_context: {
                shipping_preference: "NO_SHIPPING", 
            }
        });
    };

    // Funzione eseguita dopo l'approvazione del pagamento
    const onApprove = (data: any, actions: any) => {
        return actions.order.capture().then((details: any) => {
            onPaymentSuccess(details);
        });
    };
    
    // Funzione eseguita in caso di errore
    const onError = (err: any) => {
        console.error("Errore Pagamento PayPal:", err);
    }


    if (isPending) {
        return (
            <div className="w-full text-center p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-gray-600">Caricamento bottoni di PayPal...</p>
            </div>
        );
    }
    
    return (
        <div className="mt-4 w-full max-w-sm mx-auto">
             <h3 className="text-md font-semibold text-gray-700 mb-2">
                 Opzioni di Pagamento Sicuro
             </h3>
             
             <PayPalButtons
                 style={{
                     layout: "vertical",
                     color: "blue",
                     shape: "rect",
                     label: "paypal",
                 }}
                 createOrder={createOrder}
                 onApprove={onApprove}
                 onError={onError}
             />
        </div>
    );
};

export default PayPalButtonComponent;