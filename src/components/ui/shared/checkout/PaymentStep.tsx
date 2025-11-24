"use client";

import React, { useState, useEffect, useCallback } from "react"; 
import { CartItemFrontend, shippingAddress } from "@/types";
import { PaymentDetails } from "./payment-form-placeholder";
import StripePaymentComponent from "@/components/order/StripePaymentComponent";
import PayPalButtonComponent from "@/components/order/PaypalButtonComponent";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Button } from "../../button";
import { createOrderAction } from "@/lib/actions/order.actions";
import {  updateOrderAfterPayPalSuccess } from "@/lib/actions/order.actions";

interface PaymentStepProps {
  onSave: (details: PaymentDetails) => void;
  onPaymentSuccess: () => void; 
  totalPrice: number;
  cartId: string;
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
  onPaymentSuccess,
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
  
  const [selectedMethod, setSelectedMethod] = useState<string>("Carta di Credito / Debito");
  const [stripeClientSecret, setStripeClientSecret] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [isLoadingSecret, setIsLoadingSecret] = useState(false);
  const [hasStripeInitialized, setHasStripeInitialized] = useState(false); 

  const { toast } = useToast();

  // ... (Il tuo codice Stripe fetchClientSecret rimane uguale) ...
  const fetchClientSecret = useCallback(async (
    total: number,
    currentOrderId: string, 
    cartItems: CartItemFrontend[]
  ) => {
    if (total <= 0 || !currentOrderId || isLoadingSecret) return;

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
        }),
      });

      const data = await response.json();

      if (response.ok && data.clientSecret) {
        setStripeClientSecret(data.clientSecret);
      } else {
        toast({
          title: "Errore Stripe",
          description: data.error || "Impossibile creare Payment Intent.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Errore di Rete",
        description: "Errore nel contattare l'API Stripe.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingSecret(false); 
    }
  }, [toast, userId, isLoadingSecret]);


  // Effect Reset
  useEffect(() => {
    setOrderId(null);
    setStripeClientSecret(null);
    setHasStripeInitialized(false);
    setIsCreatingOrder(false);
  }, [cartId]);

  // ... (Il tuo codice handleStripeInitialization rimane uguale) ...
  const handleStripeInitialization = useCallback(async () => {
    if (isCreatingOrder) return;
    if (hasStripeInitialized && orderId && stripeClientSecret) return;

    setHasStripeInitialized(true);
    setIsCreatingOrder(true);
    
    let currentOrderId: string | null = orderId;

    if (!currentOrderId) {
      try {
        const createResult = await createOrderAction({
          userId, cartId, totalPrice, itemsPrice, shippingPrice, taxPrice, shippingAddress, items
        });
        
        if (createResult.success && createResult.orderId) {
          currentOrderId = createResult.orderId;
          setOrderId(currentOrderId);
        } else {
          toast({ title: "Errore Checkout", description: createResult.error || "Errore creazione ordine.", variant: "destructive" });
          setIsCreatingOrder(false);
          return; 
        }
      } catch(e) {
        toast({ title: "Errore Sistema", description: "Errore critico creazione ordine.", variant: "destructive" });
        setIsCreatingOrder(false);
        return;
      }
    }
    
    if (currentOrderId && !stripeClientSecret && !isLoadingSecret) {
      await fetchClientSecret(totalPrice, currentOrderId, items);
    }
    setIsCreatingOrder(false);
  }, [isCreatingOrder, orderId, stripeClientSecret, isLoadingSecret, hasStripeInitialized, totalPrice, items, userId, cartId, itemsPrice, shippingPrice, taxPrice, shippingAddress, toast, fetchClientSecret]);


  // Trigger Stripe Initialization
  useEffect(() => {
    if (selectedMethod === "Carta di Credito / Debito" && !hasStripeInitialized) {
      handleStripeInitialization();
    }
  }, [selectedMethod, hasStripeInitialized, handleStripeInitialization]);

  const handleMethodChange = (value: string) => {
    setSelectedMethod(value);
    setStripeClientSecret(null); 
    setOrderId(null); 
    setHasStripeInitialized(false);
    setIsCreatingOrder(false);
  };

  // =====================================================================
  // 🆕 LOGICA PAYPAL AGGIORNATA
  // =====================================================================
  const handlePayPalSuccess = async (paypalTransactionId: string) => {
    if (isCreatingOrder) return;
    setIsCreatingOrder(true);

    let currentOrderId = orderId;

    // 1. Crea l'ordine se non esiste
    if (!currentOrderId) {
        try {
            const createResult = await createOrderAction({
                userId, cartId, totalPrice, itemsPrice, shippingPrice, taxPrice, shippingAddress, items,
                paymentMethod: "PayPal" // 🔑 FONDAMENTALE: Passiamo il metodo!
            });

            if (!createResult.success || !createResult.orderId) {
                // ... errori
                setIsCreatingOrder(false);
                return;
            }
            currentOrderId = createResult.orderId;
            setOrderId(currentOrderId);
        } catch (error) {
            // ... errori
            setIsCreatingOrder(false);
            return;
        }
    }

    // 2. 🚀 CRUCIALE: Segna l'ordine come PAGATO nel DB
    if (currentOrderId) {
        await updateOrderAfterPayPalSuccess(currentOrderId, paypalTransactionId);
    }

    // 3. Finalizza Frontend
    const paypalDetails: PaymentDetails = {
      method: "PayPal",
      last4: "N/A",
      holder: `${shippingAddress.firstName} ${shippingAddress.lastName}`,
      clientSecret: null,
      paypalOrderId: paypalTransactionId,
    };
    
    onSave(paypalDetails);
    onPaymentSuccess();
    setIsCreatingOrder(false);
  };

  // =====================================================================
  // 🆕 LOGICA CONTRASSEGNO AGGIORNATA
  // =====================================================================
  const handleCodSave = async () => {
    if (isCreatingOrder) return;

    if (!orderId) {
        setIsCreatingOrder(true);
        const createResult = await createOrderAction({
            userId, cartId, totalPrice, itemsPrice, shippingPrice, taxPrice, shippingAddress, items,
            paymentMethod: "Contrassegno" // 🔑 FONDAMENTALE: Passiamo il metodo!
        });
        setIsCreatingOrder(false);

        if (!createResult.success || !createResult.orderId) {
             // ... gestisci errore
            return;
        }
        setOrderId(createResult.orderId);
    }

    const codDetails: PaymentDetails = {
      method: "Contrassegno",
      last4: "N/A",
      holder: `${shippingAddress.firstName} ${shippingAddress.lastName}`,
      clientSecret: null,
      paypalOrderId: null,
    };
    
    onSave(codDetails); 
    onPaymentSuccess();
  };
  return (
    <div className="flex flex-col gap-8">
      {/* Sezione 1: Scelta Metodo */}
      <div className="bg-white p-6 rounded-xl shadow-xl border border-gray-200">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">1. Scegli il Metodo</h2>
        <RadioGroup value={selectedMethod} onValueChange={handleMethodChange} className="flex gap-4 flex-wrap">
          <div className="flex items-center space-x-2 border p-4 rounded-lg flex-grow min-w-[200px]">
            <RadioGroupItem value="Carta di Credito / Debito" id="r1" />
            <Label htmlFor="r1">Carta di Credito / Debito</Label>
          </div>
          <div className="flex items-center space-x-2 border p-4 rounded-lg flex-grow min-w-[200px]">
            <RadioGroupItem value="PayPal" id="r2" />
            <Label htmlFor="r2">PayPal</Label>
          </div>
          <div className="flex items-center space-x-2 border p-4 rounded-lg flex-grow min-w-[200px]">
            <RadioGroupItem value="Contrassegno" id="r3" />
            <Label htmlFor="r3">Contrassegno</Label>
          </div>
        </RadioGroup>
      </div>

      {/* Sezione 2: Dettagli */}
      <div className="bg-white p-6 rounded-xl shadow-xl border border-gray-200">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">2. Dettagli Pagamento ({selectedMethod})</h2>
        
        {/* STRIPE */}
        {selectedMethod === "Carta di Credito / Debito" && (
          <div className="min-h-[150px]">
            {(isLoadingSecret || isCreatingOrder) && (
              <p className="text-gray-500 italic font-semibold">Caricamento Stripe...</p>
            )}
            {stripeClientSecret && orderId && ( 
                <StripePaymentComponent
                  client_secret={stripeClientSecret}
                  orderId={orderId} 
                  totalPrice={totalPrice}
                  onPaymentSuccess={(paymentIntentId) => {
                    onSave({
                      method: "Carta di Credito / Debito",
                      last4: "0000",
                      holder: `${shippingAddress.firstName} ${shippingAddress.lastName}`,
                      clientSecret: stripeClientSecret,
                      paypalOrderId: null,
                    });
                    onPaymentSuccess();
                  }}
                />
            )}
          </div>
        )}

        {/* PAYPAL */}
        {selectedMethod === "PayPal" && (
          <div className="min-h-[150px]">
             {isCreatingOrder ? (
                 <p className="text-green-600 font-semibold animate-pulse">
                     Pagamento ricevuto. Creazione ordine in corso...
                 </p>
             ) : (
                <>
                    <p className="mb-4">
                    Sarai reindirizzato a PayPal per completare il pagamento di €{formatCurrency(totalPrice)}.
                    </p>
                    <PayPalButtonComponent
                    // ⚠️ Passiamo handlePayPalSuccess qui
                    onPaymentSuccess={handlePayPalSuccess}
                    isPaid={false}
                    // Qui passiamo cartId se orderId è null, va bene per PayPal ma non per il DB
                    orderId={orderId ?? cartId} 
                    finalPrice={totalPrice.toString()}
                    itemsPrice={itemsPrice.toString()}
                    shippingPrice={shippingPrice.toString()}
                    taxPrice={taxPrice.toString()}
                    items={items}
                    userId={userId}
                    shippingAddress={shippingAddress}
                    />
                </>
             )}
          </div>
        )}

        {/* CONTRASSEGNO */}
        {selectedMethod === "Contrassegno" && (
          <div>
            <p className="mb-6 text-gray-700">Pagherai €{formatCurrency(totalPrice)} in contanti alla consegna.</p>
            <Button onClick={handleCodSave} disabled={isCreatingOrder} className="bg-green-600 hover:bg-green-700">
              {isCreatingOrder ? "Elaborazione..." : "Procedi con Contrassegno"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
