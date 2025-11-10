// File: src/app/(root)/checkout/CheckoutClientWrapper.tsx

"use client";

// 🚀 Importazioni Corrette e Pulite
import { getMyCartAction, createOrderAction } from "@/lib/actions/cart.actions";

import {
  CheckoutPayload,
  Cart,
  shippingAddress,
  BackendCartItem,
  CartItemFrontend,
} from "@/types";

import { useSearchParams, useRouter } from "next/navigation";
import React, { useState, useEffect, useMemo } from "react";
import CheckoutStepper from "@/components/ui/shared/checkout/CheckoutStepper";
import CheckoutSummary from "@/components/ui/shared/checkout/checkout-summary";
import ShippingAddressForm from "@/components/ui/shared/checkout/shipping-address-form";

import PaymentFormPlaceholder, {
  type PaymentDetails,
} from "@/components/ui/shared/checkout/payment-form-placeholder";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

import { PayPalScriptProvider } from "@paypal/react-paypal-js";
import { formatCurrency } from "@/lib/utils";

// --- Configurazione Globale ---
const TAX_RATE = 0.22; // Esempio: 22%

// 🔑 CONFIGURAZIONE CHIAVE CORRETTA: Opzioni per l'SDK di PayPal
const paypalInitialOptions = {
  clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "sb",
  currency: "EUR",
  intent: "capture",
  components: "buttons",
  locale: "it_IT",
};
// -----------------------------

// ----------------------------------------------------------------------
// Componente per il Riepilogo/Conferma Finale (Passo 4)
// ... (OrderReview rimane invariato)
// ----------------------------------------------------------------------
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
          <p className="text-base text-gray-700 font-semibold">
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
    disabled={
        !payment || isPlacingOrder || !cartData || cartData.items.length === 0
    }
>
    {isPlacingOrder ? "Elaborazione Ordine..." : "Conferma Ordine e Paga"}
</Button>
    </div>
  );
};
// ----------------------------------------------------------------------

interface CheckoutClientWrapperProps {
  userId: string;
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
        console.log("DEBUG 1 - Dati Carrello ricevuti (cartData):", cart);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGoback = () => {
    let newStep: string;

    switch (currentStepString) {
      case "payment":
        //Tornas all'indirizzo
        newStep = "address";
        break;
      case "review":
        //Torna al pagamento
        newStep = "payment";
        break;
      case "address":
        //Se sei al primo step, torna alla pagina precedente o alla home
        router.back();
        return;
      default:
        //ritorna all'indirizzo come fallback
        newStep = "address";
        break;
    }
    // Naviga allo step precedente mantenendo la query string 'step' pulita
    router.push(`/checkout?step=${newStep}`);
  };

  const handleAddressSave = (newAddress: shippingAddress) => {
    setShippingData(newAddress);
    router.push("/checkout?step=payment");
  };

  const handlePaymentSave = (details: PaymentDetails) => {
    setPaymentData(details);
    router.push("/checkout?step=review");
  };

  const handlePlaceOrder = async () => {
    if (!shippingData || !paymentData || !cartData) {
      return toast({
        title: "Errore Dati",
        description: "Dati mancanti (spedizione, pagamento o carrello).",
        variant: "destructive",
      });
    }
    if (cartData.items.length === 0) {
      return toast({
        title: "Carrello Vuoto",
        description: "Non puoi piazzare un ordine con un carrello vuoto.",
        variant: "destructive",
      });
    }

    setIsPlacingOrder(true);

    try {
      const orderPayload: CheckoutPayload = {
        cartId: cartData.id,
        userId: userId,
        paymentmethod: paymentData.method,

        shippingAddress: {
          name: `${shippingData.firstName} ${shippingData.lastName}`,
          street: shippingData.street,
          city: shippingData.city,
          zip: shippingData.postalCode,
          country: shippingData.country,
          houseNumber: shippingData.houseNumber,
        },

        // ✅ Utilizza i dati dal carrello per i prezzi
        itemsPrice: cartData.itemsPrice,
        shippingPrice: cartData.shippingPrice,
        taxPrice: cartData.taxPrice,
        totalPrice: cartData.totalPrice,
      };

      const result = await createOrderAction(orderPayload);

      if (result.success && result.orderNumber) {
        toast({
          title: "Ordine Completato!",
          description: `Il tuo ordine ${result.orderNumber} è stato inviato con successo.`,
          variant: "default",
        });
        router.push(`/dashboard/orders/${result.orderNumber}`);
      } else {
        toast({
          title: "Errore Ordine",
          description:
            result.message || "Non è stato possibile completare l'ordine.",
          variant: "destructive",
        });
      }
    } catch (error) {
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

  // Logica per mappare gli articoli del carrello (per PaymentForm e Summary)
  const displayCartItems = useMemo<CartItemFrontend[]>(() => {
    if (!cartData || cartData.items.length === 0) {
      return [];
    }

    // 🔑 NOTA: Qui si converte il prezzo in stringa per la visualizzazione/PayPal.
    return cartData.items.map((item) => ({
      id: item.productId,
      name: item.name,
      price: item.price.toFixed(2), // Stringa formattata
      quantity: item.qty,
      slug: item.slug,
      image: item.image,
    }));
  }, [cartData]);

  // ... (useEffect per i reindirizzamenti di navigazione - Guardie - rimane invariato)

  useEffect(() => {
    if (isCartLoading) return;

    const hasShipping = !!shippingData?.street;
    const hasPayment = !!paymentData;
    const currentStep = currentStepString;

    if (currentStep === "payment" && !hasShipping) {
      router.push("/checkout?step=address");
    } else if (currentStep === "review" && (!hasShipping || !hasPayment)) {
      if (hasShipping && !hasPayment) {
        router.push("/checkout?step=payment");
      } else {
        router.push("/checkout?step=address");
      }
    } else if (
      currentStep !== "address" &&
      currentStep !== "payment" &&
      currentStep !== "review"
    ) {
      router.push("/checkout?step=address");
    }
  }, [currentStepString, shippingData, paymentData, router, isCartLoading]);

  // Stato di caricamento e Blocco per prevenire il flash di contenuto/reindirizzamento
  if (
    isCartLoading ||
    (currentStepString === "payment" && !shippingData?.street) ||
    (currentStepString === "review" && (!paymentData || !shippingData?.street))
  ) {
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
        // 🔑 Passaggio delle PROPS CORRETTE E COMPLETE
        <PaymentFormPlaceholder
          onSave={handlePaymentSave}
          totalPrice={cartData?.totalPrice || 0}
          cartId={cartData?.id || ""}
          // ✅ Prezzi di scomposizione per PayPal
          itemsPrice={cartData?.itemsPrice || 0}
          shippingPrice={cartData?.shippingPrice || 0}
          taxPrice={cartData?.taxPrice || 0}
          // ---
          shippingCost={cartData?.shippingPrice || 0} // Rimosso l'errore di prop mancante
          vatRate={TAX_RATE}
          items={displayCartItems}
          userId={userId}
          shippingAddress={shippingData}
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
    // ✅ Avvolgiamo la pagina nel provider PayPal
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
