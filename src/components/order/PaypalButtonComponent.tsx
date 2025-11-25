"use client";

import { PayPalButtons, usePayPalScriptReducer } from "@paypal/react-paypal-js";
import React from "react";
import { CartItemFrontend, shippingAddress } from "@/types";

// --- Tipizzazione Props CORRETTA per PayPal ---
interface PaypalButtonProps {
  orderId: string;
  finalPrice: string; // Totale FINALE (es. "110.90")
  itemsPrice: string; // Subtotale Articoli (es. "85.90")
  shippingPrice: string; // Costo Spedizione (es. "5.00")
  taxPrice: string; // Totale Tasse (es. "20.00")
  items: CartItemFrontend[]; // Array tipizzato (usiamo CartItemFrontend dall'altro file)
  userId: string | null | undefined;
  isPaid: boolean;
  shippingAddress: shippingAddress; // Non usato direttamente in createOrder ma utile per i metadati
  onPaymentSuccess: (paypalOrderId: string, transactionId: string) => void;
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
  shippingAddress,
  onPaymentSuccess,
}) => {
  const [{ isPending }] = usePayPalScriptReducer();
  // 🔑 SUGGERIMENTO: Aggiungere uno stato locale per i messaggi di errore/successo
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

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

  // Funzione per creare l'ordine (ORA CON CORREZIONE FORMATTAZIONE)
  const createOrder = (data: any, actions: any) => {
    // Resetta il messaggio di errore prima di un nuovo tentativo
    setErrorMessage(null); // 🔑 1. ARROTONDAMENTO PERFETTO: Assicuriamo che tutti i totali siano stringhe con due decimali

    const formattedItemsPrice = parseFloat(itemsPrice).toFixed(2);
    const formattedShippingPrice = parseFloat(shippingPrice).toFixed(2);
    const formattedTaxPrice = parseFloat(taxPrice).toFixed(2);
    const formattedFinalPrice = parseFloat(finalPrice).toFixed(2);

    console.log("DEBUG PAYPAL: BreakDown Totale (Final):", formattedFinalPrice);
    console.log("DEBUG PAYPAL: Item Total (Sum items):", formattedItemsPrice);

    return actions.order.create({
      intent: "CAPTURE",
      purchase_units: [
        {
          description: `Acquisto carrello ${orderId}`, // Metadati aggiuntivi utili
          custom_id: orderId,
          soft_descriptor: "MIO_STORE_ACQUISTO",
          amount: {
            currency_code: "EUR", // 🛑 USA IL VALORE ARROTONDATO/FORMATTATO
            value: formattedFinalPrice,
            breakdown: {
              item_total: {
                // Risolve ITEM_TOTAL_REQUIRED
                currency_code: "EUR", // 🛑 USA IL VALORE ARROTONDATO/FORMATTATO
                value: formattedItemsPrice,
              },
              shipping: {
                currency_code: "EUR", // 🛑 USA IL VALORE ARROTONDATO/FORMATTATO
                value: formattedShippingPrice,
              },
              tax_total: {
                currency_code: "EUR", // 🛑 USA IL VALORE ARROTONDATO/FORMATTATO
                value: formattedTaxPrice,
              },
            },
          },
          // 🔑 2. CORREZIONE ITEMS MAP
          items: items.map((item) => ({
            name: item.name,
            unit_amount: {
              currency_code: "EUR",
              value: parseFloat(item.price as unknown as string).toFixed(2),
            },
            quantity: item.quantity.toString(),
            sku: item.id, // ID Prodotto/SKU
          })),
        },
      ],
      application_context: {
        shipping_preference: "NO_SHIPPING",
        cancel_url: `${window.location.origin}/checkout?step=payment`,
        return_url: `${window.location.origin}/checkout?step=review`,
      },
    });
  };

  // Funzione eseguita dopo l'approvazione del pagamento
  const onApprove = (data: any, actions: any) => {
    return actions.order.capture().then((details: any) => {
      // Chiama la funzione di successo con l'ID ordine PayPal e l'ID transazione
      const paypalOrderId = details.id;
      const transactionId = details.purchase_units[0].payments.captures[0].id;
      console.log("PAYPAL SUCCESS DETAILS:", details);
      // Pulisce l'errore se presente e notifica il successo
      setErrorMessage(null);
      onPaymentSuccess(paypalOrderId, transactionId);
    });
  };

  // Funzione eseguita in caso di errore
  const onError = (err: any) => {
    console.error("Errore Pagamento PayPal:", err);
    // ❌ CORREZIONE CRUCIALE: Sostituito alert() con la gestione dello stato
    setErrorMessage(
      "Errore di pagamento: Controlla la console per i dettagli o riprova."
    );
  };

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
      {/* Visualizzazione dell'errore sopra i bottoni */}
      {errorMessage && (
        <div className="p-3 mb-3 text-sm rounded-lg bg-red-100 text-red-700 font-medium">
          {errorMessage}
        </div>
      )}

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
