"use client";

import { PayPalButtons, usePayPalScriptReducer } from "@paypal/react-paypal-js";
import React from "react";
// Assicurati che questi tipi siano importati correttamente
import { CartItemFrontend, shippingAddress } from "@/types";

// --- Tipizzazione Props CORRETTA per PayPal ---
interface PaypalButtonProps {
  orderId: string;
  finalPrice: string; // Totale FINALE (es. "110.90")
  itemsPrice: string; // Subtotale Articoli (es. "85.90")
  shippingPrice: string; // Costo Spedizione (es. "5.00")
  taxPrice: string; // Totale Tasse (es. "20.00")
  items: CartItemFrontend[]; // Array tipizzato
  userId: string | null | undefined;
  isPaid: boolean;
  shippingAddress: shippingAddress;
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
  onPaymentSuccess,
}) => {
  const [{ isPending }] = usePayPalScriptReducer();
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

  // Funzione per creare l'ordine
  const createOrder = (data: any, actions: any) => {
    // 🔑 ARROTONDAMENTO PERFETTO: Essenziale per PayPal
    const formattedItemsPrice = parseFloat(itemsPrice).toFixed(2);
    const formattedShippingPrice = parseFloat(shippingPrice).toFixed(2);
    const formattedTaxPrice = parseFloat(taxPrice).toFixed(2);
    const formattedFinalPrice = parseFloat(finalPrice).toFixed(2);

    console.log("DEBUG PAYPAL: BreakDown Totale (Final):", formattedFinalPrice);

    return actions.order.create({
      intent: "CAPTURE",
      purchase_units: [
        {
          description: `Acquisto carrello ${orderId}`,
          custom_id: orderId,
          soft_descriptor: "MIO_STORE_ACQUISTO",
          amount: {
            currency_code: "EUR",
            value: formattedFinalPrice,
            breakdown: {
              item_total: {
                currency_code: "EUR",
                value: formattedItemsPrice,
              },
              shipping: {
                currency_code: "EUR",
                value: formattedShippingPrice,
              },
              tax_total: {
                currency_code: "EUR",
                value: formattedTaxPrice,
              },
            },
          },
          items: items.map((item) => ({
            name: item.name,
            unit_amount: {
              currency_code: "EUR",
              // Prezzo unitario formattato a 2 decimali
              value: parseFloat(item.price as unknown as string).toFixed(2),
            },
            // La quantità DEVE essere una stringa
            quantity: item.quantity.toString(),
            sku: item.id,
          })),
        },
      ],
      application_context: {
        shipping_preference: "NO_SHIPPING",
        // Qui potresti voler usare l'URL di successo per reindirizzare,
        // ma tipicamente lo gestiamo nel frontend dopo onApprove
        cancel_url: `${window.location.origin}/checkout?step=payment`,
        return_url: `${window.location.origin}/checkout?step=review`, 
      },
    });
  };

  // Funzione eseguita dopo l'approvazione del pagamento
  const onApprove = (data: any, actions: any) => {
    // 🔑 CORREZIONE CRITICA: Await sul capture per assicurare il successo lato PayPal
    return actions.order.capture().then(async (details: any) => {
      // DEBUG LOG
      console.log("PAYPAL SUCCESS DETAILS:", details);

      const paypalOrderId = details.id;
      // Nota: l'ID della transazione è nel primo elemento della cattura
      const capture = details.purchase_units?.[0].payments.captures?.[0];
      const transactionId = capture ? capture.id : 'N/A';
      
      console.log("DEBUG FE: Pagamento PayPal completato. Order ID:", paypalOrderId);
      
      // Chiamiamo la funzione esterna. 
      // Se onPaymentSuccess gestisce il reindirizzamento, l'errore "Target window is closed" dovrebbe
      // essere risolto perché la funzione `actions.order.capture()` avrà avuto il tempo di completare.
      
      // ⚠️ ASSICURATI CHE onPaymentSuccess GESTISCA CORRETTAMENTE L'AGGIORNAMENTO DB 
      // e poi il reindirizzamento. Il problema era il conflitto tra l'SDK PayPal e il reindirizzamento.
      
      onPaymentSuccess(paypalOrderId, transactionId);

      // NON mettere qui il reindirizzamento diretto (es. router.push()), 
      // deve essere gestito dalla funzione onPaymentSuccess nel componente genitore
    });
  }; 

  // Funzione eseguita in caso di errore
  const onError = (err: any) => {
    console.error("Errore Pagamento PayPal:", err);
    // ⚠️ NON USARE ALERT() - usa un meccanismo UI personalizzato se possibile
    // Poiché non ho il tuo sistema di notifica, lascio l'alert ma ricorda di cambiarlo.
    alert("Errore di pagamento: Controlla la console per i dettagli.");
  };

  if (isPending) {
    return (
      <div className="w-full text-center p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <p className="text-gray-600">Caricamento bottoni di PayPal...</p>
      </div>
    );
  }

  // Se l'ordine è già pagato, non mostriamo il bottone
  // Anche se non è specificato nel codice, è una best practice
  // if (isPaid) {
  //     return (
  //         <div className="mt-4 w-full max-w-sm mx-auto p-4 text-center bg-green-50 rounded-lg text-green-700 font-semibold">
  //             Ordine già pagato.
  //         </div>
  //     );
  // }


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