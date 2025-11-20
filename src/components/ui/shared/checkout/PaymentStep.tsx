"use client";

import React, { useState, useEffect } from "react";
import { CheckoutPayload, CartItemFrontend, shippingAddress } from "@/types";
import { PaymentDetails } from "./payment-form-placeholder";
import StripePaymentComponent from "@/components/order/StripePaymentComponent";
import PayPalButtonComponent from "@/components/order/PaypalButtonComponent";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Button } from "../../button";
// Importazione della Server Action per la creazione dell'ordine
import { createOrderAction } from "@/lib/actions/order.actions"; 

// Definizioni delle Props
interface PaymentStepProps {
 onSave: (details: PaymentDetails) => void;
 totalPrice: number;
 cartId: string;
 items: CartItemFrontend[];
 userId: string;
 shippingAddress: shippingAddress;
 shippingCost: number;
 vatRate: number;
 itemsPrice: number;
 shippingPrice: number;
 taxPrice: number;
}

export default function PaymentStep({
 onSave,
 totalPrice,
 cartId,
 items,
 userId,
 shippingAddress,
 shippingCost,
 vatRate,
 itemsPrice,
 shippingPrice,
 taxPrice,
}: PaymentStepProps) {
 // Stato per il metodo di pagamento selezionato
 const [selectedMethod, setSelectedMethod] = useState<string>(
  "Carta di Credito / Debito"
 );
 // Stato per il Client Secret di Stripe
 const [stripeClientSecret, setStripeClientSecret] = useState<string | null>(
  null
 );
 // 🔑 NUOVO STATO: L'UUID dell'ordine nel DB (null finché non viene creato)
 const [orderId, setOrderId] = useState<string | null>(null);
 // Stato di caricamento
 const [isLoadingSecret, setIsLoadingSecret] = useState(false);
 const { toast } = useToast();

 // ----------------------------------------------------------------------
 // 🔑 LOGICA CHIAVE: Funzione Imperativa per la creazione del Payment Intent
 // ----------------------------------------------------------------------

 const fetchClientSecret = async (
  total: number,
  id: string, // Questo è il cartId originale
  cartItems: CartItemFrontend[]
 ) => {
  // Previene chiamate doppie
  if (stripeClientSecret || isLoadingSecret) return;

  if (total <= 0 || !id) {
   console.error("STRIPE FE ERROR: Carrello non valido o prezzo a zero.");
   toast({
    title: "Errore Checkout",
    description: "Carrello non valido o importo a zero.",
    variant: "destructive",
   });
   return;
  }

  setIsLoadingSecret(true);
  console.log("--- STRIPE DEBUG FE: Avvio chiamata API Route ---");

    // 🚨 PASSO 1: CREAZIONE ORDINE PRELIMINARE NEL DB 🚨
    let currentOrderId = orderId; 

    if (!currentOrderId) {
        console.log("STRIPE DEBUG FE: Creazione Ordine Preliminare nel DB...");
        
        const createResult = await createOrderAction({
            userId: userId, 
            cartId: cartId, 
            totalPrice,
            itemsPrice,
            shippingPrice,
            taxPrice,
            shippingAddress,
            items: cartItems,
        });

        if (createResult.success && createResult.orderId) {
            setOrderId(createResult.orderId); // Salva l'UUID nello stato
            currentOrderId = createResult.orderId; // Usa l'UUID per l'Intent
            console.log(`STRIPE DEBUG FE: Ordine creato. UUID: ${currentOrderId}`);
        } else {
            console.error("Errore Creazione Ordine:", createResult.error);
            toast({ title: "Errore Checkout", description: createResult.error, variant: "destructive" });
            setIsLoadingSecret(false);
            return;
        }
    }


  try {
    // 🚨 PASSO 2: CHIAMATA API PER CREARE IL PAYMENT INTENT CON L'UUID CORRETTO 🚨
  const response = await fetch('/api/stripe/intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // ⭐ PASSAGGIO CORRETTO: Rinomina la chiave in 'orderId' e passa l'UUID
      body: JSON.stringify({ 
             amount: total, 
             orderId: currentOrderId,
             items: cartItems // <-- Passa l'ID dell'Ordine qui
             // Non è necessario passare l'array intero degli items qui, 
             // dato che l'ordine è già creato nel DB.
         }), 
    });

const data = await response.json();


   if (response.ok && data.clientSecret) {
      setStripeClientSecret(data.clientSecret);
      console.log("DEBUG FE SUCCESS: Client Secret salvato via API.");
    } else {
      console.error("DEBUG FE ERRORE: Fallimento API. Messaggio:", data.error);
    toast({ title: "Errore Stripe", description: data.error || "Impossibile creare Payment Intent.", variant: "destructive" });
   }
  } catch (error) {
   console.error("DEBUG FE ERRORE CATCH: Errore di connessione Server Action:", error);
   toast({ title: "Errore di Rete", description: "Errore nel contattare il server. Riprova.", variant: "destructive" });
  } finally {
   setIsLoadingSecret(false);
   console.log("--- STRIPE DEBUG FE: Chiamata imperativa completata ---");
  }
 };

 // Funzione per gestire il cambio di metodo di pagamento
 const handleMethodChange = (value: string) => {
  console.log(`DEBUG FE: Metodo cambiato da ${selectedMethod} a ${value}`);
  setSelectedMethod(value); 
  setStripeClientSecret(null); // Resetta il Secret

  // 🛑 CHIAMA SOLO SE SELEZIONIAMO LA CARTA
  if (value === "Carta di Credito / Debito") {
   fetchClientSecret(totalPrice, cartId, items);
  }
 };
 
 // Logica per il Contrassegno: Simula un salvataggio immediato
 const handleCodSave = () => {
  console.log("DEBUG FE: Procedi con Contrassegno.");
    // ⚠️ NOTA: Qui dovrai implementare la logica per creare l'ordine se usi il Contrassegno.
  const codDetails: PaymentDetails = {
   method: "Contrassegno",
   last4: "N/A",
   holder: `${shippingAddress.firstName} ${shippingAddress.lastName}`,
   clientSecret: null,
   paypalOrderId: null,
  };
  onSave(codDetails); // Avanza allo step 'review'
 };
 
 // NUOVO useEffect: Attiva il fetch al primo caricamento se la Carta è il default
 useEffect(() => {
  if (selectedMethod === "Carta di Credito / Debito" && !stripeClientSecret) {
    console.log("DEBUG FE: Attivazione fetch al montaggio (metodo default).");
    fetchClientSecret(totalPrice, cartId, items);
  }
 }, [selectedMethod, stripeClientSecret, totalPrice, cartId, items]); // Dipendenze importanti!


 // ---------------------------------------------------------------------- 
 // MARKUP DI RENDERING 
 // ----------------------------------------------------------------------

 return (
  <div className="flex flex-col gap-8">
   {/* Sezione 1. Scegli il Metodo */}
   <div className="bg-white p-6 rounded-xl shadow-xl border border-gray-200">
    <h2 className="text-2xl font-bold mb-4 text-gray-800">
     1. Scegli il Metodo
    </h2>
    <RadioGroup
     value={selectedMethod}
     onValueChange={handleMethodChange}
     className="flex gap-4"
    >
     <div className="flex items-center space-x-2 border p-4 rounded-lg w-1/3">
      <RadioGroupItem value="Carta di Credito / Debito" id="r1" />
      <Label htmlFor="r1" className="font-medium">
       Carta di Credito / Debito
      </Label>
     </div>
     <div className="flex items-center space-x-2 border p-4 rounded-lg w-1/3">
      <RadioGroupItem value="PayPal" id="r2" />
      <Label htmlFor="r2" className="font-medium">
       PayPal
      </Label>
     </div>
     <div className="flex items-center space-x-2 border p-4 rounded-lg w-1/3">
      <RadioGroupItem value="Contrassegno" id="r3" />
      <Label htmlFor="r3" className="font-medium">
       Contrassegno
      </Label>
     </div>
    </RadioGroup>
    
   </div>
   {/* Sezione 2. Inserisci Dettagli (Contenuto Dinamico) */}
   <div className="bg-white p-6 rounded-xl shadow-xl border border-gray-200">
    <h2 className="text-2xl font-bold mb-4 text-gray-800">
     2. Dettagli Pagamento ({selectedMethod})
    </h2>
    {selectedMethod === "Carta di Credito / Debito" && (
     <div className="min-h-[150px]">
      {/* ⏳ Stato di Caricamento del Client Secret */}
      {isLoadingSecret && (
       <p className="text-gray-500 italic font-semibold">
        Caricamento del modulo Stripe in corso...
       </p>
      )}
      {/* 💳 Componente Stripe (Renderizzato solo con il Secret e l'UUID) */}
      {stripeClientSecret && orderId && ( // 👈 CONTROLLA ANCHE orderId
       <StripePaymentComponent
        client_secret={stripeClientSecret}
        orderId={orderId} // 🚀 PASSAGGIO DELL'UUID CORRETTO
        totalPrice={totalPrice}
        // Funzione per notificare il genitore quando il pagamento è successo
        onPaymentSuccess={(paymentIntentId) => {
         console.log(
          "DEBUG FE: Pagamento Stripe completato. Notifico il genitore."
         );
         onSave({
          method: "Carta di Credito / Debito",
          last4: "0000",
          holder: `${shippingAddress.firstName} ${shippingAddress.lastName}`,
          clientSecret: null,
          paypalOrderId: null,
         });
        }}
       />
      )}
      {/* Messaggio di Errore se non abbiamo il Secret */}
      {!isLoadingSecret && !stripeClientSecret && (
       <div className="p-4 bg-red-100 text-red-700 border border-red-300 rounded-md">
        ❌ **Errore di Pagamento:** Impossibile caricare il modulo
        Stripe. Se l'importo è corretto, controlla la console per gli errori.
       </div>
      )}
     </div>
    )}
    {/* Contenuto PayPal */}
    {selectedMethod === "PayPal" && (
     <div className="min-h-[150px]">
      <p className="mb-4">
       Sarai reindirizzato a PayPal per completare il pagamento di **€
       {formatCurrency(totalPrice)}**.
      </p>
      <PayPalButtonComponent
       onPaymentSuccess={(paypalOrderId, transactionId) => {
        console.log(
         `DEBUG FE: Pagamento PayPal completato. Order ID: ${paypalOrderId}`
        );
        const paypalDetails: PaymentDetails = {
         method: "PayPal",
         last4: "N/A",
         holder: `${shippingAddress.firstName} ${shippingAddress.lastName}`,
         clientSecret: null,
         paypalOrderId: paypalOrderId,
        };
        onSave(paypalDetails);
       }}
       // ⚠️ Qui devi usare orderId (stato) se implementi la logica di creazione ordine
       isPaid={false}
       orderId={orderId ?? cartId} // Usa l'ordine se esiste, altrimenti usa il cartId (TEMP)
       finalPrice={totalPrice.toString()}
       itemsPrice={itemsPrice.toString()}
       shippingPrice={shippingPrice.toString()}
       taxPrice={taxPrice.toString()}
       items={items}
       userId={userId}
       shippingAddress={shippingAddress}
      />
     </div>
    )}
    {/* Contenuto Contrassegno */}
    {selectedMethod === "Contrassegno" && (
     <div>
      <p className="mb-6 text-gray-700">
       Pagherai **€{formatCurrency(totalPrice)}** in contanti alla
       consegna.
      </p>
      <Button
       onClick={handleCodSave}
       className="bg-green-600 hover:bg-green-700"
      >
       Procedi con Contrassegno
      </Button>
     </div>
    )}
   </div>
  </div>
 );
}