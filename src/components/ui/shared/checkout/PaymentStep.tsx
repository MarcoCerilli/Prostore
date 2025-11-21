"use client";

import React, { useState, useEffect, useCallback } from "react"; 
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
// Importazione del Server Action per Stripe (che ora deve accettare baseUrl)
// Non è necessario importarla qui per il funzionamento, ma solo per promemoria

// Definizioni delle Props
interface PaymentStepProps {
  onSave: (details: PaymentDetails) => void;
  // 🔑 NECESSARIO per notificare il successo al genitore e svuotare il carrello
  onPaymentSuccess:() => void; 
  totalPrice: number;
  cartId: string; // ID del carrello (chiave per il reset)
  items: CartItemFrontend[];
  userId: string | null | undefined;
  shippingAddress: shippingAddress;
  shippingCost: number;
  vatRate: number;
  itemsPrice: number;
  shippingPrice: number;
  taxPrice: number;
}

export default function PaymentStep({
  onSave,
  onPaymentSuccess, // 🔑 Aggiunto e destrutturato qui
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
  
  const [selectedMethod, setSelectedMethod] = useState<string>(
    "Carta di Credito / Debito"
  );
  
  const [stripeClientSecret, setStripeClientSecret] = useState<string | null>(
    null
  );
  // 🔑 STATO PRINCIPALE: L'UUID dell'ordine nel DB (null finché non viene creato)
  const [orderId, setOrderId] = useState<string | null>(null);
  // 🔑 CRUCIALE: Blocco per la creazione dell'ordine (previene doppi ordini)
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  // Stato per il caricamento del Client Secret di Stripe
  const [isLoadingSecret, setIsLoadingSecret] = useState(false);
  // 🆕 CRUCIALE: Flag che indica se l'inizializzazione Stripe è già stata tentata per il carrello corrente
  const [hasStripeInitialized, setHasStripeInitialized] = useState(false); 

  const { toast } = useToast();

  // ----------------------------------------------------------------------
  // 🔑 LOGICA 1: Funzione Imperativa per la richiesta del Client Secret (chiamata solo dopo la creazione dell'ordine)
  // ----------------------------------------------------------------------

  // 🎯 Avvolta in useCallback per stabilità nell'useEffect
  const fetchClientSecret = useCallback(async (
    total: number,
    currentOrderId: string, 
    cartItems: CartItemFrontend[]
  ) => {
    
    if (total <= 0 || !currentOrderId) { 
      console.error("STRIPE FE ERROR: Carrello non valido o ID Ordine mancante.");
      return;
    }
    
    // 🛑 GUARDA: Blocca il refetch se stiamo già caricando
    if (isLoadingSecret) return;

    console.log(`--- STRIPE DEBUG FE: Avvio chiamata API Route per Client Secret per Ordine ${currentOrderId} ---`);

    try {
      setIsLoadingSecret(true); 
      
      const response = await fetch("/api/stripe/intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          totalAmount: total, 
          orderId: currentOrderId, 
          cartItems: cartItems, 
          userId: userId, 
          // baseUrl NON necessario, viene calcolato nell'API Route
        }),
      });

      const data = await response.json();

      if (response.ok && data.clientSecret) {
        setStripeClientSecret(data.clientSecret);
        console.log("DEBUG FE SUCCESS: Client Secret salvato via API.");
      } else {
        console.error("DEBUG FE ERRORE: Fallimento API.", data.error); 
        toast({
          title: "Errore Stripe",
          description: data.error || "Impossibile creare Payment Intent.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("DEBUG FE ERRORE CATCH: Errore di connessione API Stripe:", error);
      toast({
        title: "Errore di Rete",
        description: "Errore nel contattare l'API Stripe. Riprova.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingSecret(false); 
    }
  }, [toast, userId, isLoadingSecret]);


  // ----------------------------------------------------------------------
  // 🔑 EFFETTO: Reset Stati all'aggiornamento del carrello (chiave)
  // ----------------------------------------------------------------------
  useEffect(() => {
    // Resetta tutti gli stati se il carrello cambia, forzando un re-init
    console.log(`DEBUG FE RESET: cartId è cambiato in ${cartId}.`);
    setOrderId(null);
    setStripeClientSecret(null);
    setHasStripeInitialized(false); // 👈 RESETTA IL FLAG DI INIZIALIZZAZIONE
    setIsCreatingOrder(false); // 👈 ASSICURATI che il blocco sia rilasciato
  }, [cartId]);


  // ----------------------------------------------------------------------
  // 🔑 FUNZIONE: Inizializzazione Atomica Stripe (Creazione Ordine + Richiesta Secret)
  // ----------------------------------------------------------------------
  const handleStripeInitialization = useCallback(async () => {
    // 🛑 GUARDA 1: Se è già in fase di creazione, usciamo immediatamente (PREVENZIONE DOPPIA ESECUZIONE 1)
    if (isCreatingOrder) {
      console.log("DEBUG FE: Inizializzazione già in corso. Blocco.");
      return;
    }
    
    // 🛑 GUARDA 2: Se abbiamo già completato l'inizializzazione (e abbiamo orderId e secret), usciamo.
    if (hasStripeInitialized && orderId && stripeClientSecret) {
        console.log("DEBUG FE: Inizializzazione completata e dati validi. Nessuna azione.");
        return;
    }


    // 🚀 Inizio Inizializzazione
    setHasStripeInitialized(true); // Imposta il flag di tentativo completato (PREVENZIONE DOPPIA ESECUZIONE 2)
    setIsCreatingOrder(true); // 🚀 Blocca la creazione
    
    let currentOrderId: string | null = orderId;

    // 1. CREAZIONE DELL'ORDINE (Esegui sempre se non esiste)
    if (!currentOrderId) {
      console.log("STRIPE DEBUG FE: Avvio Creazione Ordine Unica nel DB...");
      try {
        const createResult = await createOrderAction({
          userId, cartId, totalPrice, itemsPrice, shippingPrice, taxPrice, shippingAddress, items
        });
        
        if (createResult.success && createResult.orderId) {
          currentOrderId = createResult.orderId;
          setOrderId(currentOrderId); // Salva l'UUID nello stato
          console.log(`STRIPE DEBUG FE: Ordine creato. UUID: ${currentOrderId}.`);
        } else {
          console.error("Errore Creazione Ordine:", createResult.error);
          toast({ title: "Errore Checkout", description: createResult.error || "Errore nella creazione dell'ordine.", variant: "destructive" });
          setIsCreatingOrder(false); // Rilascia il blocco in caso di fallimento
          return; // Blocca se l'ordine non è creato
        }
      } catch(e) {
        console.error("DEBUG FE ERRORE CATCH: Errore Server Action:", e);
        toast({ title: "Errore di Sistema", description: "Errore critico durante la creazione dell'ordine.", variant: "destructive" });
        setIsCreatingOrder(false); // Rilascia il blocco in caso di errore
        return;
      }
    }
    
    // 2. OTTENIMENTO DEL CLIENT SECRET
    if (currentOrderId && !stripeClientSecret && !isLoadingSecret) {
      console.log("DEBUG FE: Ordine valido. Richiedo Client Secret.");
      // Chiamiamo il fetchClientSecret
      await fetchClientSecret(totalPrice, currentOrderId, items);
    }

    setIsCreatingOrder(false); // 🛑 Rilascia il blocco solo DOPO aver tentato tutte le operazioni
  }, [
    isCreatingOrder, orderId, stripeClientSecret, isLoadingSecret, hasStripeInitialized, // Stati
    totalPrice, items, userId, cartId, itemsPrice, shippingPrice, taxPrice, shippingAddress, // Props
    toast, fetchClientSecret
  ]);


  // ----------------------------------------------------------------------
  // 🔑 LOGICA 3: useEffect per Inizializzazione Stripe (Trigger)
  // ----------------------------------------------------------------------

  useEffect(() => {
    // Condizione di Esecuzione: Se Carta è selezionata E non abbiamo ancora completato il ciclo di inizializzazione
    if (selectedMethod === "Carta di Credito / Debito" && !hasStripeInitialized) {
      console.log("DEBUG FE: Trigger Inizializzazione Stripe.");
      handleStripeInitialization();
    }
    
    // Nota: Aggiungi tutte le dipendenze per l'esecuzione corretta
  }, [
    selectedMethod, 
    hasStripeInitialized, 
    handleStripeInitialization
  ]);

  // Funzione per gestire il cambio di metodo di pagamento
  const handleMethodChange = (value: string) => {
    console.log(`DEBUG FE: Metodo cambiato da ${selectedMethod} a ${value}`);
    setSelectedMethod(value);
    // Resetta TUTTI gli stati che forzano il re-fetch/re-creation
    setStripeClientSecret(null); 
    setOrderId(null); 
    setHasStripeInitialized(false); // 👈 RESETTA IL FLAG DI INIZIALIZZAZIONE PER POTER RIPROVARE
    setIsCreatingOrder(false); // Rilascia il blocco di creazione
    // NON CHIAMARE LOGICA ATTIVA QUI! Lascia che l'useEffect si attivi
  };


  // Logica per il Contrassegno: Simula un salvataggio immediato (DEVE CREARE L'ORDINE QUI)
  const handleCodSave = async () => {
    // 🛑 GUARDA: Se è già in fase di creazione, usciamo
    if (isCreatingOrder) return;

    // ⚠️ Per Contrassegno, l'ordine deve essere creato prima di passare allo step successivo
    if (!orderId) {
        setIsCreatingOrder(true);
        const createResult = await createOrderAction({
            userId, cartId, totalPrice, itemsPrice, shippingPrice, taxPrice, shippingAddress, items
        });
        setIsCreatingOrder(false);

        if (!createResult.success || !createResult.orderId) {
            toast({
                title: "Errore Contrassegno",
                description: createResult.error || "Impossibile creare l'ordine per Contrassegno.",
            });
            return;
        }
        setOrderId(createResult.orderId);
    }


    console.log("DEBUG FE: Procedi con Contrassegno.");
    const codDetails: PaymentDetails = {
      method: "Contrassegno",
      last4: "N/A",
      holder: `${shippingAddress.firstName} ${shippingAddress.lastName}`,
      clientSecret: null,
      paypalOrderId: null,
    };
    
    // 🔑 CORREZIONE 1: PRIMA salva i dettagli di pagamento
    onSave(codDetails); 
    
    // 🔑 CORREZIONE 2: DOPO notifica il successo (che svuota il carrello)
    onPaymentSuccess();
  };

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
          className="flex gap-4 flex-wrap"
        >
          <div className="flex items-center space-x-2 border p-4 rounded-lg flex-grow min-w-[200px]">
            <RadioGroupItem value="Carta di Credito / Debito" id="r1" />
            <Label htmlFor="r1" className="font-medium">
              Carta di Credito / Debito
            </Label>
          </div>
          <div className="flex items-center space-x-2 border p-4 rounded-lg flex-grow min-w-[200px]">
            <RadioGroupItem value="PayPal" id="r2" />
            <Label htmlFor="r2" className="font-medium">
              PayPal
            </Label>
          </div>
          <div className="flex items-center space-x-2 border p-4 rounded-lg flex-grow min-w-[200px]">
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
            {/* ⏳ Stato di Caricamento dell'Ordine O del Client Secret */}
            {(isLoadingSecret || isCreatingOrder) && (
              <p className="text-gray-500 italic font-semibold">
                Caricamento del modulo Stripe in corso...
              </p>
            )}
            {/* 💳 Componente Stripe (Renderizzato solo con il Secret e l'UUID) */}
            {stripeClientSecret &&
              orderId && ( 
                <StripePaymentComponent
                  client_secret={stripeClientSecret}
                  orderId={orderId} 
                  totalPrice={totalPrice}
                  onPaymentSuccess={(paymentIntentId) => {
                    console.log(
                      "DEBUG FE: Pagamento Stripe completato. Notifico il genitore."
                    );
                    
                    // 🔑 CORREZIONE 1: PRIMA salva i dettagli di pagamento
                    onSave({
                      method: "Carta di Credito / Debito",
                      last4: "0000",
                      holder: `${shippingAddress.firstName} ${shippingAddress.lastName}`,
                      clientSecret: stripeClientSecret, // Passa il Secret corretto
                      paypalOrderId: null,
                    });
                    
                    // 🔑 CORREZIONE 2: DOPO notifica il successo
                    onPaymentSuccess();
                  }}
                />
              )}
            {/* Messaggio di Errore se non abbiamo il Secret e non stiamo caricando */}
            {!isLoadingSecret && !isCreatingOrder && !stripeClientSecret && hasStripeInitialized && (
              <div className="p-4 bg-red-100 text-red-700 border border-red-300 rounded-md">
                ❌ **Errore di Pagamento:** Impossibile caricare il modulo
                Stripe. Se l'importo è corretto, controlla la console per gli
                errori.
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
                
                // 🔑 CORREZIONE 1: PRIMA salva i dettagli di pagamento
                onSave(paypalDetails);
                
                // 🔑 CORREZIONE 2: DOPO notifica il successo
                onPaymentSuccess();
              }}
              isPaid={false}
              // ⚠️ Passiamo l'orderId (se esiste) o il cartId. 
              // Se la logica PayPal lato server crea l'ordine, va bene.
              orderId={orderId ?? cartId} 
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
              disabled={isCreatingOrder} // Disabilita se stiamo creando l'ordine
              className="bg-green-600 hover:bg-green-700"
            >
              {isCreatingOrder ? "Creazione Ordine..." : "Procedi con Contrassegno"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}