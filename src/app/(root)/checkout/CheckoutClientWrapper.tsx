"use client";

// 🚀 Importazioni
import { getMyCartAction } from "@/lib/actions/cart.actions";
import { ensureUserExistsAction, createOrderAction, CreateOrderResult } from "@/lib/actions/order.actions" 
import PaymentStep from "@/components/ui/shared/checkout/PaymentStep";
import {
  Cart,
  shippingAddress,
  CartItemFrontend,
} from "@/types";

import { useSearchParams, useRouter } from "next/navigation";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import CheckoutStepper from "@/components/ui/shared/checkout/CheckoutStepper";
import CheckoutSummary from "@/components/ui/shared/checkout/checkout-summary";
import ShippingAddressForm from "@/components/ui/shared/checkout/shipping-address-form";
import { type PaymentDetails } from "@/components/ui/shared/checkout/payment-form-placeholder";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { PayPalScriptProvider } from "@paypal/react-paypal-js";
import { formatCurrency } from "@/lib/utils";

// --- Configurazione Globale ---
const TAX_RATE = 0.22; // Esempio: 22%

// Configurazione PayPal
const paypalInitialOptions = {
  clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "sb",
  currency: "EUR",
  intent: "capture",
  components: "buttons",
  locale: "it_IT",
};

const getPaymentMethodIcon = (method: string): string => {
  switch (method) {
    case "Carta di Credito / Debito":
      return "💳 (Stripe)";
    case "PayPal":
      return "🅿️ (PayPal)";
    case "Contrassegno":
      return "💰 (Contanti)";
    default:
      return "";
  }
};

// --- Componente per il Riepilogo/Conferma Finale (Passo 4) ---
interface OrderReviewProps {
  shipping: shippingAddress;
  payment: PaymentDetails | null;
  handlePlaceOrder: () => void;
  isPlacingOrder: boolean;
  cartData: Cart | null;
}

const OrderReview = ({
  shipping,
  payment,
  handlePlaceOrder,
  isPlacingOrder,
  cartData,
}: OrderReviewProps) => {
  let paymentDisplay: string;
  if (payment) {
    if (payment.method === "Carta di Credito / Debito" && payment.last4) {
      paymentDisplay = `${payment.method} (termina in **** ${payment.last4})`;
    } else {
      paymentDisplay = payment.method;
    }
  } else {
    paymentDisplay = "Metodo di Pagamento non selezionato.";
  }

  // 🔑 Modificato: La conferma finale è necessaria SOLO per Contrassegno (che NON ha fatto il pagamento)
  // Per Stripe/PayPal, il pagamento è già avvenuto in PaymentStep, quindi non dovremmo arrivare qui con dati validi
  const buttonText =
    payment?.method === "Contrassegno"
      ? "Conferma Ordine e Paga alla Consegna"
      : "Conferma Ordine (Debug)"; // Testo generico per non confondere

  const isCartEmpty = !cartData || cartData.items.length === 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-white p-6 rounded-xl shadow-xl border border-gray-200">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">
          Conferma Ordine
        </h2>
        <div className="mb-6 pb-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold mb-2 text-indigo-700">
            Indirizzo di Spedizione:
          </h3>
          <p className="text-base text-gray-700 font-semibold">
            {shipping.firstName} {shipping.lastName}
          </p>
          <p className="text-sm text-gray-600">
            {shipping.street}, {shipping.houseNumber}
          </p>
          <p className="text-sm text-gray-600">
            {shipping.city} {shipping.postalCode}, {shipping.country}
          </p>
          <p className="text-sm text-gray-600 mt-1">
            Telefono: {shipping.phoneNumber}
          </p>
        </div>

        <div className="mb-6 pb-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold mb-2 text-indigo-700">
            Metodo di Pagamento:
          </h3>
          <p className="text-base text-gray-700 font-semibold flex items-center gap-2">
            {payment?.method && (
              <span className="text-xl mr-1">
                {getPaymentMethodIcon(payment.method).split(" ")[0]}
              </span>
            )}
            {paymentDisplay}
          </p>
          {payment?.holder && (
            <p className="text-sm text-gray-600">Titolare: {payment.holder}</p>
          )}
        </div>

        <p className="text-sm text-gray-500 italic">
          **Totale da pagare:** €{formatCurrency(cartData?.totalPrice || 0)}
        </p>
      </div>

      <Button
        className="w-full h-12 text-lg bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-lg font-semibold"
        onClick={handlePlaceOrder}
        disabled={!payment || isPlacingOrder || isCartEmpty}
      >
        {isPlacingOrder ? "Elaborazione Ordine..." : buttonText}
      </Button>
      {isCartEmpty && (
        <p className="text-sm text-red-500 text-center">
          Il carrello è vuoto. Impossibile finalizzare l'ordine.
        </p>
      )}
    </div>
  );
};
// ----------------------------------------------------------------------

interface CheckoutClientWrapperProps {
  userId: string | null | undefined; 
  existingAddress: shippingAddress;
}

export default function CheckoutClientWrapper({
  userId,
  existingAddress,
}: CheckoutClientWrapperProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const currentStepString = searchParams.get("step") || "address";

  const [isInitialRender, setIsInitialRender] = useState(true);

  // Inizializzazione dati di stato
  const defaultAddress: shippingAddress = {
    firstName: existingAddress.firstName || "",
    lastName: existingAddress.lastName || "",
    street: existingAddress.street || "",
    houseNumber: existingAddress.houseNumber || "",
    city: existingAddress.city || "",
    postalCode: existingAddress.postalCode || "",
    country: existingAddress.country || "",
    phoneNumber: existingAddress.phoneNumber || "",
  };

  const [shippingData, setShippingData] =
    useState<shippingAddress>(defaultAddress);
  const [paymentData, setPaymentData] = useState<PaymentDetails | null>(null);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [cartData, setCartData] = useState<Cart | null>(null);
  const [isCartLoading, setIsCartLoading] = useState(true);

  // Caricamento del Carrello all'avvio
  useEffect(() => {
    const fetchCart = async () => {
      try {
        const cart = await getMyCartAction();
        setCartData(cart);
      } catch (error) {
        console.error("Errore nel caricamento del carrello:", error);
        toast({
          title: "Errore",
          description: "Impossibile caricare i dati del carrello.",
          variant: "destructive",
        });
      } finally {
        setIsCartLoading(false);
      }
    };
    fetchCart();
  }, [toast]);
  
  // 🔑 CORREZIONE CRUCIALE: GESTIONE SUCCESSO PAGAMENTO (Svuota lo stato locale e naviga)
  const handlePaymentSuccess = useCallback(() => {
    console.log("DEBUG FE: 🚀 Pagamento OK. Svuotamento carrello locale e navigazione.");
    
    // 1. Forza lo svuotamento immediato dello stato React del carrello
    setCartData(prevCart => (prevCart ? { ...prevCart, items: [] } : null)); 
    
    // 2. Naviga alla pagina di success/ordini (l'ordine è già nel DB)
    toast({ 
        title: "Pagamento Ricevuto! 🎉", 
        description: "Il tuo ordine è stato completato con successo.", 
        variant: "default" 
    });
    
    // Reindirizzamento alla dashboard ordini (o pagina di conferma specifica)
    router.push("/admin/orders"); 
  }, [router, toast]);


  const handleGoback = () => {
    let newStep: string;

    switch (currentStepString) {
      case "payment":
        newStep = "address";
        break;
      case "review":
        newStep = "payment";
        break;
      case "address":
        router.back();
        return;
      default:
        newStep = "address";
        break;
    }
    router.push(`/checkout?step=${newStep}`);
  };

  const handleAddressSave = (newAddress: shippingAddress) => {
    setShippingData(newAddress);
    // Resetta i dati di pagamento in caso di cambio indirizzo
    setPaymentData(null);
    router.push("/checkout?step=payment");
  };

  // La navigazione a 'review' avviene dopo onSave
  const handlePaymentSave = (details: PaymentDetails) => {
    setPaymentData(details);
    router.push("/checkout?step=review");
  };

  // 🎯 LOGICA CRITICA: Gestione finale dell'Ordine (Solo Contrassegno o rinvio)
  const handlePlaceOrder = useCallback(async () => {
    if (!shippingData || !paymentData || !cartData) {
      return toast({
        title: "Errore Dati",
        description: "Dati mancanti (spedizione, pagamento o carrello).",
        variant: "destructive",
      });
    }

    const isCOD = paymentData.method === "Contrassegno";
    
    // 🛡️ Guardia CRITICA: Se il pagamento NON è Contrassegno, l'ordine è già stato creato
    // (Stripe/PayPal), e dovremmo essere nella pagina di success, non qui.
    if (!isCOD) {
        toast({
            title: "Errore Logica",
            description: "Ordine già elaborato. Reindirizzamento...",
            variant: "default",
        });
        router.push("/dashboard/orders");
        return;
    }

    // 🛡️ Guardia Carrello vuoto
    if (cartData && cartData.items.length === 0) {
      return toast({
        title: "Carrello Vuoto",
        description: "Non puoi piazzare un ordine con un carrello vuoto.",
        variant: "destructive",
      });
    }


    setIsPlacingOrder(true);

    try {
      let finalUserId: string | null | undefined = undefined;
      
      // 🚨 PASSO CRITICO 1: GARANTIRE L'ESISTENZA DEL RECORD UTENTE (Solo se loggato)
      if (userId) { 
          const userCheck = await ensureUserExistsAction();
          if (userCheck.success && userCheck.userId) {
            finalUserId = userCheck.userId;
          } else {
            // Fallback per utente loggato ma DB non sincronizzato
            console.error("Errore Autenticazione: Record utente mancante o non creato.");
            toast({
              title: "Errore di Sistema",
              description: "Impossibile associare l'utente all'ordine. Riprova.",
              variant: "destructive",
            });
            return;
          }
      } 

      // Mappa gli articoli del carrello
      const itemsToOrder = cartData.items.map((item) => {
        const price = parseFloat(item.price as unknown as string); 
        
        return {
          id: item.productId,
          productId: item.productId,
          name: item.name,
          price: isNaN(price) ? 0 : price,
          quantity: item.qty,
          image: item.image,
          slug: item.slug,
        };
      });

      // 🔑 Costruisci il payload per createOrderAction
      const paramsForAction = {
        cartId: cartData.id,
        userId: finalUserId, 
        
        items: itemsToOrder,
        shippingAddress: {
          name: `${shippingData.firstName} ${shippingData.lastName}`,
          street: shippingData.street,
          city: shippingData.city,
          zip: shippingData.postalCode,
          country: shippingData.country,
          houseNumber: shippingData.houseNumber,
        },

        itemsPrice: cartData.itemsPrice,
        shippingPrice: cartData.shippingPrice,
        taxPrice: cartData.taxPrice,
        totalPrice: cartData.totalPrice,
        // **ATTENZIONE**: Se si arriva qui con Contrassegno, l'ordine DEVE essere creato
        // o aggiornato con i dati finali. Assumendo che createOrderAction sia idempotent.
      };

      // 🚀 Chiama l'azione sul server
      const result: CreateOrderResult = await createOrderAction(paramsForAction);

      if (result.success && result.orderNumber) {
        toast({
          title: "Ordine Creato!",
          description: result.message,
          variant: "default",
        });
        
        // **AZIONI FINALI PER CONTRASSEGNO**
        // Svuota il carrello locale e naviga
        setCartData(prevCart => (prevCart ? { ...prevCart, items: [] } : null)); 
        router.push(`/dashboard/orders/${result.orderNumber}`);

      } else {
        toast({
          title: "Errore Ordine",
          description: result.error || "Non è stato possibile completare l'ordine.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Errore piazzamento ordine:", error);
      toast({
        title: "Errore di Rete",
        description: "Si è verificato un errore critico durante l'ordine. Riprova.",
        variant: "destructive",
      });
    } finally {
      setIsPlacingOrder(false);
    }
  }, [cartData, paymentData, shippingData, toast, router, userId]); 


  // Logica per determinare Titolo e Numero dello step
  const { stepTitle, currentStepNumber } = useMemo(() => {
    let title: string;
    let number: number;
    switch (currentStepString) {
      case "address":
        title = "Dettagli di Spedizione";
        number = 2;
        break;
      case "payment":
        title = "Metodo di Pagamento";
        number = 3;
        break;
      case "review":
        title = "Revisione Ordine";
        number = 4;
        break;
      default:
        title = "Dettagli di Spedizione";
        number = 2;
        break;
    }
    return { stepTitle: title, currentStepNumber: number };
  }, [currentStepString]);

  // Logica per mappare gli articoli del carrello per la visualizzazione (Summary/PaymentForm)
  const displayCartItems = useMemo<CartItemFrontend[]>(() => {
    if (!cartData || cartData.items.length === 0) {
      return [];
    }

    return cartData.items.map((item) => {
        const price = parseFloat(item.price as unknown as string); 
        return {
          id: item.productId,
          productId: item.productId,
          name: item.name,
          price: isNaN(price) ? 0 : price,
          quantity: item.qty,
          slug: item.slug,
          image: item.image,
        };
    });
  }, [cartData]);

  // 🛡️ GUARDIA DI NAVIGAZIONE (Mantenuta invariata)
  useEffect(() => {
    // ... (Logica di reindirizzamento in base ai dati mancanti)
    if (isCartLoading) return;

    if (isInitialRender) {
      setIsInitialRender(false);
      return;
    }

    const hasShipping = !!shippingData?.street;
    const hasPayment = !!paymentData;
    const currentStep = currentStepString;

    let targetStep: string | null = null;

    if (cartData && cartData.items.length === 0) {
        // Se il carrello è vuoto (post-pagamento riuscito), reindirizza alla dashboard
        if (currentStep !== "address") { 
            console.log("GUARDIA: Carrello vuoto, reindirizzamento agli ordini.");
            router.push("/dashboard/orders");
            return;
        }
    }

    if (currentStep === "payment" && !hasShipping) {
      targetStep = "address";
    } else if (currentStep === "review" && !hasShipping) {
      targetStep = "address";
    } else if (currentStep === "review" && !hasPayment) {
      targetStep = "payment";
    } else if (
      currentStep !== "address" &&
      currentStep !== "payment" &&
      currentStep !== "review"
    ) {
      targetStep = "address"; // Fallback per step non riconosciuto
    }

    if (targetStep && targetStep !== currentStep) {
      console.log(`GUARDIA: Reindirizzamento da ${currentStep} a ${targetStep}`);
      router.push(`/checkout?step=${targetStep}`);
    }
    
  }, [currentStepString, shippingData, paymentData, router, isCartLoading, isInitialRender, cartData]);


  // Stato di caricamento iniziale
  if (isCartLoading) {
    return (
      <div className="container pt-8 pb-10 px-4 md:px-8 max-w-7xl text-center">
        <p className="text-xl font-medium text-gray-700">
          Caricamento dati del carrello...
        </p>
      </div>
    );
  }
  
  // Contenuto dinamico dello step corrente
  let content: React.ReactNode;

  switch (currentStepString) {
    case "address":
      content = (
        <ShippingAddressForm
          address={shippingData}
          onSave={handleAddressSave}
        />
      );
      break;

    case "payment":
      content = (
        <PaymentStep
          onSave={handlePaymentSave}
          totalPrice={cartData?.totalPrice || 0}
          cartId={cartData?.id || ""}
          itemsPrice={cartData?.itemsPrice || 0}
          shippingPrice={cartData?.shippingPrice || 0}
          taxPrice={cartData?.taxPrice || 0}
          shippingCost={cartData?.shippingPrice || 0}
          vatRate={TAX_RATE}
          items={displayCartItems}
          userId={userId} 
          shippingAddress={shippingData}
          // 🔑 NUOVA PROP AGGIUNTA (Ora gestisce svuotamento e reindirizzamento)
          onPaymentSuccess={handlePaymentSuccess} 
        />
      );
      break;

    case "review":
      content = (
        <OrderReview
          shipping={shippingData}
          payment={paymentData}
          handlePlaceOrder={handlePlaceOrder}
          isPlacingOrder={isPlacingOrder}
          cartData={cartData}
        />
      );
      break;

    default:
      content = null; 
      break;
  }

  return (
    <PayPalScriptProvider options={paypalInitialOptions}>
      <div className="container pt-8 pb-10 px-4 md:px-8 max-w-7xl mx-auto">
        <CheckoutStepper
          currentStep={
            currentStepString as "address" | "payment" | "review" | "success"
          }
        />
        <h1 className="text-3xl font-bold mb-8 text-center text-gray-900 border-b pb-4">
          Checkout: {stepTitle}
        </h1>

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:w-3/5">
            {/* Pulsante "Torna Indietro" visibile solo dopo il primo step */}
            {currentStepString !== "address" && (
              <Button
                variant="outline"
                onClick={handleGoback}
                className="mb-6 flex items-center gap-2 border-gray-300 hover:bg-gray-50"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                Torna indietro
              </Button>
            )}

            {content}
          </div>
          <div className="lg:w-2/5 lg:sticky lg:top-10 h-min">
            <CheckoutSummary
              cartItems={displayCartItems}
              shippingFee={cartData?.shippingPrice || 0}
              taxRate={TAX_RATE}
              step={
                currentStepString as
                  | "address"
                  | "payment"
                  | "review"
                  | "success"
              }
              savedPaymentDetails={
                paymentData
                  ? {
                      last4: paymentData.last4 || "",
                      method: paymentData.method,
                    }
                  : null
              }
              onProceed={() => {
                /* La logica di avanzamento è gestita dai form */
              }}
            />
          </div>
        </div>
      </div>
    </PayPalScriptProvider>
  );
}