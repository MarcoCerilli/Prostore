// File: CheckoutClientWrapper.tsx

"use client";

// --- Importazioni Corrette e Pulite ---
import { getMyCartAction, createOrderAction } from "@/lib/actions/cart.actions";

import {
  CheckoutPayload,
  Cart,
  shippingAddress, // Assumiamo che anche shippingAddress sia in @/types
} from "@/types";

import { useSearchParams } from "next/navigation";
import React, { useState, useEffect, useMemo } from "react";
import { CheckoutStepper } from "@/components/ui/shared/checkout/CheckoutStepper";
import CheckoutSummary from "@/components/ui/shared/checkout/checkout-summary";
import ShippingAddressForm from "@/components/ui/shared/checkout/shipping-address-form";
import PaymentFormPlaceholder, {
  SavedPaymentDetails as PaymentDetails,
} from "@/components/ui/shared/checkout/payment-form-placeholder";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

// ... (Il resto del codice del componente è ora pulito e funzionale)
// ...

// --- Componente per il Riepilogo/Conferma Finale (Passo 4) ---
interface OrderReviewProps {
  shipping: shippingAddress;
  payment: PaymentDetails | null;
  handlePlaceOrder: () => void;
  isPlacingOrder: boolean;
}

const OrderReview = ({
  shipping,
  payment,
  handlePlaceOrder,
  isPlacingOrder,
}: OrderReviewProps) => {
  const formattedAddress = `${shipping.street}, ${shipping.city} ${shipping.postalCode}, ${shipping.country}`;
  let paymentDisplay: string;
  if (payment) {
    if (
      payment.method === "Carta di Credito / Debito" &&
      payment.lastFourDigits
    ) {
      paymentDisplay = `${payment.method} (termina in **** ${payment.lastFourDigits})`;
    } else {
      paymentDisplay = payment.method;
    }
  } else {
    paymentDisplay = "Metodo di Pagamento non selezionato.";
  }

  return (
    <div className="flex flex-col gap-6">
                 {" "}
      <div className="bg-white p-6 rounded-xl shadow-xl border border-gray-200">
                       {" "}
        <h2 className="text-2xl font-bold mb-4 text-gray-800">
          Conferma Ordine
        </h2>
                                       {" "}
        <div className="mb-6 pb-4 border-b border-gray-200">
                             {" "}
          <h3 className="text-lg font-semibold mb-2 text-indigo-700">
            Indirizzo di Spedizione:
          </h3>
                             {" "}
          <p className="text-base text-gray-700 font-semibold">
                                    {shipping.firstName} {shipping.lastName}   
                           {" "}
          </p>
                             {" "}
          <p className="text-sm text-gray-600">
                                    {formattedAddress}                   {" "}
          </p>
                             {" "}
          <p className="text-sm text-gray-600 mt-1">
                                    Telefono: {shipping.houseNumber}           
                   {" "}
          </p>
                         {" "}
        </div>
                       {" "}
        <div className="mb-6 pb-4 border-b border-gray-200">
                             {" "}
          <h3 className="text-lg font-semibold mb-2 text-indigo-700">
            Metodo di Pagamento:
          </h3>
                             {" "}
          <p className="text-base text-gray-700 font-semibold">
                                    {paymentDisplay}                   {" "}
          </p>
                         {" "}
        </div>
                                       {" "}
        <p className="text-sm text-gray-500 italic">
                              **Nota:** Il riepilogo degli articoli e i totali
          sono mostrati a destra (Componente: CheckoutSummary).              
           {" "}
        </p>
                   {" "}
      </div>
                             {" "}
      <Button
        className="w-full h-12 text-lg bg-green-600 hover:bg-green-700 transition-colors shadow-lg"
        onClick={handlePlaceOrder}
        disabled={!payment || isPlacingOrder}
      >
                       {" "}
        {isPlacingOrder ? "Elaborazione Ordine..." : "Conferma Ordine e Paga"} 
                 {" "}
      </Button>
             {" "}
    </div>
  );
};
// ----------------------------------------------------------------------

interface CheckoutClientWrapperProps {
  userId: string;
  existingAddress: shippingAddress;
}

// Componente Client che può usare useSearchParams()
export default function CheckoutClientWrapper({
  userId,
  existingAddress,
}: CheckoutClientWrapperProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const currentStepString = searchParams.get("step") || "address"; // --- STATO PER I DATI DEL CHECKOUT ---

  const [shippingData, setShippingData] =
    useState<shippingAddress>(existingAddress);
  const [paymentData, setPaymentData] = useState<PaymentDetails | null>(null);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [cartData, setCartData] = useState<Cart | null>(null);

  useEffect(() => {
    //funzione interna per chiamare l'azione e popolare lo stato
    const fetchCart = async () => {
      const cart = await getMyCartAction();
      setCartData(cart);
    };
    fetchCart();
  }, []); // Funzione placeholder per simulare il salvataggio dell'indirizzo

  const handleAddressSave = (newAddress: shippingAddress) => {
    setShippingData(newAddress);
    router.push("/checkout?step=payment");
  }; // Funzione chiave: riceve i dati dal PaymentFormPlaceholder e li salva

  const handlePaymentSave = (details: PaymentDetails) => {
    setPaymentData(details); // Il reindirizzamento a /checkout?step=review è gestito dal PaymentFormPlaceholder
  }; // --- LOGICA DI CONFERMA ORDINE E REINDIRIZZAMENTO ---

  const handlePlaceOrder = async () => {
    // 1. Verifica preliminare dei dati (INVARIATA)
    if (!shippingData || !paymentData || !cartData) {
      return toast({
        title: "Errore Dati",
        description: "Dati mancanti (spedizione, pagamento o carrello).",
        variant: "destructive",
      });
    }

    setIsPlacingOrder(true);
    console.log("Inizio Server Action: Creazione Ordine nel DB...");

    try {
      // 2. COSTRUZIONE DEL PAYLOAD COMPLETO PER LA SERVER ACTION
      const orderPayload: CheckoutPayload = {
        // Dati base per la query
        cartId: cartData.id, // ID interno del carrello (necessario per svuotarlo)
        userId: userId, // Passato dalle props del Wrapper
        paymentmethod: paymentData.method, // E.g., 'Carta di Credito / Debito'

        // Dati della spedizione
        shippingAddress: {
          name: `${shippingData.firstName} ${shippingData.lastName}`, // Nome completo
          street: `${shippingData.street} ${shippingData.houseNumber}`, // Indirizzo + Numero Civico
          city: shippingData.city,
          zip: shippingData.postalCode, // Assumiamo che 'postalCode' sia 'zip'
          country: shippingData.country,
        },

        // Dati dei totali dal carrello (per la coerenza)
        itemsPrice: cartData.itemsPrice,
        shippingPrice: cartData.shippingPrice,
        taxPrice: cartData.taxPrice,
        totalPrice: cartData.totalPrice,
      };

      // 🛑 3. CHIAMATA ALLA VERA SERVER ACTION
      const result = await createOrderAction(orderPayload);

      // 4. Gestione della Risposta
      if (result.success && result.orderNumber) {
        toast({
          title: "Ordine Completato!",
          description: `Il tuo ordine ${result.orderNumber} è stato inviato con successo.`,
          variant: "default",
        });

        // REINDIRIZZAMENTO AL PERCORSO CORRETTO (usando il vero orderNumber)
        router.push(`/dashboard/orders/${result.orderNumber}`);
        // OPPURE alla pagina di conferma pubblica:
        // router.push(`/order-confirmation?orderNumber=${result.orderNumber}`);
      } else {
        // Errore logico (es. carrello vuoto, errore DB)
        toast({
          title: "Errore Ordine",
          description:
            result.message || "Non è stato possibile completare l'ordine.",
          variant: "destructive",
        });
      }
    } catch (error) {
      // Errore di rete o Server Action fallita
      console.error("Errore piazzamento ordine:", error);
      toast({
        title: "Errore di Rete",
        description:
          "Si è verificato un errore critico durante l'ordine. Riprova.",
        variant: "destructive",
      });
    } finally {
      setIsPlacingOrder(false);
    }
  };

  // ------------------------------------------
  // MEMOIZZIAMO i dati del passo corrente (stepTitle e stepNumber)
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
        // Se lo step non è riconosciuto, usiamo l'indirizzo e ci pensiamo in useEffect
        title = "Dettagli di Spedizione";
        number = 2;
        break;
    }
    return { stepTitle: title, currentStepNumber: number };
  }, [currentStepString]); // Ricalcola solo se la stringa dello step cambia

  // EFFETTO PER IL REINDIRIZZAMENTO CONDIZIONALE (Correggi l'errore React)
  // Questo hook viene eseguito DOPO il rendering.
  useEffect(() => {
    // Logica per reindirizzare se i dati sono mancanti
    if (currentStepString === "payment" && !shippingData) {
      router.push("/checkout?step=address");
    } else if (
      currentStepString === "review" &&
      (!paymentData || !shippingData)
    ) {
      // Se manca solo il pagamento, torna al passo 3
      if (shippingData && !paymentData) {
        router.push("/checkout?step=payment");
      } else {
        // Altrimenti, torna al passo 2
        router.push("/checkout?step=address");
      }
    } else if (
      currentStepString !== "address" &&
      currentStepString !== "payment" &&
      currentStepString !== "review"
    ) {
      // Step sconosciuto, reindirizza all'inizio del checkout
      router.push("/checkout?step=address");
    }
  }, [currentStepString, shippingData, paymentData, router]);

  // DETERMINAZIONE DEL CONTENUTO (non esegue la navigazione qui)
  let content: React.ReactNode;

  // Se stiamo navigando a causa di dati mancanti, non renderizzare nulla
  if (
    (currentStepString === "payment" && !shippingData) ||
    (currentStepString === "review" && (!paymentData || !shippingData)) ||
    (currentStepString !== "address" &&
      currentStepString !== "payment" &&
      currentStepString !== "review")
  ) {
    // L'useEffect si occuperà della navigazione, restituiamo null durante l'attesa.
    return null;
  }

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
        <PaymentFormPlaceholder
          existingAddress={shippingData}
          onSave={handlePaymentSave}
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
        />
      );
      break;

    default:
      // Caso non dovrebbe mai essere raggiunto grazie al check iniziale e all'useEffect
      content = null;
      break;
  }

  return (
    <div className="container pt-8 pb-10 px-4 md:px-8 max-w-7xl">
                  <CheckoutStepper currentStep={currentStepNumber} />           {" "}
      <h1 className="text-3xl font-bold mb-8 text-center text-gray-900 border-b pb-4">
                        Checkout: {stepTitle}           {" "}
      </h1>
                 {" "}
      <div className="flex flex-col lg:flex-row gap-8">
                        <div className="lg:w-3/5">{content}</div>               {" "}
        <div className="lg:w-2/5 lg:sticky lg:top-10 h-min">
                              <CheckoutSummary />               {" "}
        </div>
                   {" "}
      </div>
             {" "}
    </div>
  );
}
