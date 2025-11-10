// File: src/components/ui/shared/checkout/payment-form-placeholder.tsx

"use client";

import Image from "next/image";
import React, { useState, useMemo } from "react";
import { CartItemFrontend } from "@/types";
// --- Importazioni Componenti UI ---
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

// --- Importazioni Icone/Componenti Esterni ---
import { CreditCard, Banknote, LucideProps } from "lucide-react";
import { shippingAddress } from "@/types";
import dynamic from "next/dynamic";

const PayPalButtonComponent = dynamic(
  () => import("@/components/order/PaypalButtonComponent"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full text-center p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <p className="text-gray-600">Caricamento PayPal...</p>
      </div>
    ),
  }
);

// AGGIUNTA CHIAVE: Mocking dell'ID Utente
const MOCK_USER_ID = "user-123-mock-8548b8d7";
const DEFAULT_PAYMENT_METHOD = "card"; 

// Definiamo un tipo per le icone Lucide
type LucideIconComponent = React.ForwardRefExoticComponent<
  Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>
>;

// Definiamo un tipo base per un Metodo di Pagamento con tipizzazione unificata
type PaymentMethod = {
  id: string;
  name: string;
  isImage: boolean;
  icon: LucideIconComponent | React.FC<any>;
};

// --- Costanti per i metodi di pagamento (AGGIORNATO) ---
const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: "card",
    name: "Carta di Credito / Debito",
    icon: CreditCard as unknown as LucideIconComponent,
    isImage: false,
  },
  {
    id: "paypal",
    name: "",
    icon: (props: any) => (
      <Image
        src="/images/paypal-logo.png"
        alt="PayPal Logo"
        width={100}
        height={100}
        className="h-20 w-auto object-contain"
      />
    ),
    isImage: true,
  },
  {
    id: "cod",
    name: "Contrassegno",
    icon: Banknote as unknown as LucideIconComponent,
    isImage: false,
  },
];

// Esportiamo il tipo PaymentDetails
export interface PaymentDetails {
  last4?: string;
  holder?: string;
  method: string;
  paypalOrderId?: string;
}

// Interfaccia Props per il componente principale
export interface PaymentFormProps {
  onSave: (details: PaymentDetails) => void;
  totalPrice: number;
  cartId: string;
  itemsPrice: number;
  shippingPrice: number;
  taxPrice: number;
  shippingCost: number;
  vatRate: number;
  items: CartItemFrontend[];
  userId?: string;
  shippingAddress: shippingAddress;
}

// ----------------------------------------------------------------------
// Sottocomponente: CreditCardForm
// ----------------------------------------------------------------------
interface CreditCardFormProps {
  onSuccess: (details: PaymentDetails) => void;
  onError: (message: string) => void;
  isSubmitting: boolean;
  setIsSubmitting: (b: boolean) => void;
}

const CreditCardForm: React.FC<CreditCardFormProps> = ({
  onSuccess,
  onError,
  isSubmitting,
  setIsSubmitting,
}) => {
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");

  const validate = () => {
    return (
      cardNumber.length === 16 &&
      cardName.trim().length > 3 &&
      expiry.length === 5 &&
      cvc.length === 3
    );
  };

  const formatCardNumber = (value: string) =>
    value
      .replace(/\s/g, "")
      .replace(/(\d{4})/g, "$1 ")
      .trim();

  const formatExpiry = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 4);
    if (digits.length > 2) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return digits;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onError("");

    if (!validate()) {
      return onError("Si prega di completare tutti i campi correttamente.");
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      onSuccess({
        last4: cardNumber.slice(-4),
        holder: cardName,
        method: "Carta di Credito / Debito",
      });
    }, 1000); // Simulazione ritardo API
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="cardNumber">Numero della Carta</Label>
        <Input
          id="cardNumber"
          type="text"
          placeholder="XXXX XXXX XXXX XXXX"
          value={formatCardNumber(cardNumber)}
          onChange={(e) =>
            setCardNumber(e.target.value.replace(/\s/g, "").slice(0, 16))
          }
          required
          maxLength={19}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="cardName">Nome sulla Carta</Label>
        <Input
          id="cardName"
          type="text"
          placeholder="Nome Cognome"
          value={cardName}
          onChange={(e) => setCardName(e.target.value)}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="expiry">Scadenza (MM/AA)</Label>
          <Input
            id="expiry"
            type="text"
            placeholder="MM/AA"
            value={formatExpiry(expiry)}
            onChange={(e) => setExpiry(e.target.value)}
            required
            maxLength={5}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cvc">CVC</Label>
          <Input
            id="cvc"
            type="password"
            placeholder="***"
            value={cvc}
            onChange={(e) =>
              setCvc(e.target.value.replace(/\D/g, "").slice(0, 3))
            }
            required
            maxLength={3}
          />
        </div>
      </div>

      {/* ✅ CORREZIONE STILE: Pulsante Indaco */}
      <Button
        type="submit"
        className="w-full h-12 text-lg bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-lg font-semibold"
        disabled={!validate() || isSubmitting}
      >
        {isSubmitting ? "Elaborazione..." : "Salva e Procedi al Riepilogo"}
      </Button>
    </form>
  );
};
// ----------------------------------------------------------------------

// ----------------------------------------------------------------------
// Componente Principale: PaymentFormPlaceholder
// ----------------------------------------------------------------------
const PaymentForm: React.FC<PaymentFormProps> = ({
  onSave,
  totalPrice = 0,
  cartId,
  items = [],
  userId = MOCK_USER_ID,
  shippingAddress,
  itemsPrice = 0,
  shippingPrice = 0,
  taxPrice = 0,
  shippingCost = 0,
  vatRate = 0,
}) => {
  const [selectedMethodId, setSelectedMethodId] = useState<string>(
    DEFAULT_PAYMENT_METHOD
  );
  const [paymentError, setPaymentError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSaveDetails = (details: PaymentDetails) => {
    setPaymentError("");
    onSave(details);
  };

  // Funzione di callback per PayPal (AGGIORNATA)
  const handlePaypalSuccess = (details: any) => {
    console.log("Dettagli Pagamento PayPal completato:", details);

    // Estrazione del Nome e Cognome del pagante PayPal
    const holderName = details.payer.name?.given_name
      ? `${details.payer.name.given_name} ${details.payer.name.surname}`
      : details.payer.email_address; // Fallback all'email

    // Chiama onSave con i dettagli di pagamento PayPal, includendo l'Order ID di PayPal
    handleSaveDetails({
      method: "PayPal",
      holder: holderName,
      paypalOrderId: details.id, // ✅ Salviamo l'ID Ordine PayPal
    });
  };

  // Render del contenuto specifico per il metodo selezionato
  const renderMethodContent = useMemo(() => {
    if (selectedMethodId === "card") {
      return (
        <CreditCardForm
          onSuccess={handleSaveDetails}
          onError={setPaymentError}
          isSubmitting={isSubmitting}
          setIsSubmitting={setIsSubmitting}
        />
      );
    }

    if (selectedMethodId === "paypal") {
      if (totalPrice <= 0) {
        return (
          <div className="mt-4 p-6 border rounded-xl bg-red-50 text-center space-y-4 shadow-inner">
            <p className="text-red-700 font-semibold">
              Impossibile procedere: l'importo totale dell'ordine deve essere
              superiore a €0.00.
            </p>
            <p className="text-sm text-gray-600">
              Verifica gli articoli nel tuo carrello.
            </p>
          </div>
        );
      }
      return (
        <div className="mt-4 p-6 border rounded-xl bg-yellow-50 text-center space-y-4 shadow-inner">
          <p className="mb-2 text-gray-700 font-medium">
            Clicca sul bottone PayPal qui sotto. Verrai reindirizzato per
            l'autorizzazione.
          </p>

          <div className="flex justify-center w-full">
            <PayPalButtonComponent
              orderId={cartId}
              // 🔑 Passaggio delle props di scomposizione in formato stringa
              finalPrice={totalPrice.toFixed(2)}
              itemsPrice={itemsPrice.toFixed(2)}
              shippingPrice={shippingPrice.toFixed(2)}
              taxPrice={taxPrice.toFixed(2)}
              // ---
              items={items}
              userId={userId}
              isPaid={false}
              onPaymentSuccess={handlePaypalSuccess}
            />
          </div>
        </div>
      );
    }

    if (selectedMethodId === "cod") {
      return (
        <div className="mt-4 p-6 border rounded-xl bg-gray-50 space-y-4 shadow-inner">
          <p className="text-gray-700">
            Il pagamento avverrà in contanti alla consegna.
          </p>
          <p className="text-sm text-red-500 font-medium">
            Potrebbe essere applicato un supplemento per la gestione del
            contante.
          </p>
          {/* ✅ CORREZIONE STILE: Pulsante Indaco */}
          <Button
            type="button"
            className="w-full h-12 text-lg bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-md font-semibold"
            onClick={() => handleSaveDetails({ method: "Contrassegno" })}
          >
            Procedi al Riepilogo
          </Button>
        </div>
      );
    }

    return <p className="text-red-500">Seleziona un metodo di pagamento.</p>;
  }, [
    selectedMethodId,
    totalPrice,
    cartId,
    isSubmitting,
    handleSaveDetails,
    items,
    userId,
    itemsPrice,
    shippingPrice,
    taxPrice,
    shippingAddress,
  ]);

  return (
    <div className="space-y-6">
      {/* Scheda Selezione Metodo */}
      <Card className="shadow-lg border-2 border-indigo-100">
        <CardHeader>
          {/* ✅ CORREZIONE STILE: Titolo Indaco */}
          <CardTitle className="text-2xl text-indigo-800">
            1. Scegli il Metodo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            defaultValue={DEFAULT_PAYMENT_METHOD}
            onValueChange={setSelectedMethodId}
            className="grid grid-cols-3 gap-4"
          >
            {PAYMENT_METHODS.map((method) => (
              <label
                key={method.id}
                htmlFor={method.id}
                className={`
                                        relative flex flex-col items-center justify-center text-center 
                                        p-4 rounded-xl cursor-pointer transition-all 
                                        h-[100px] 
                                        shadow-md hover:shadow-lg
                                        border-2 border-gray-200 
                                        has-[:checked]:border-indigo-600 has-[:checked]:bg-indigo-50
                                    `}
              >
                <RadioGroupItem
                  value={method.id}
                  id={method.id}
                  className="absolute top-2 right-2 w-4 h-4"
                />

                <div className="flex flex-col items-center justify-center h-full w-full">
                  <div className="mb-1">
                    {method.isImage ? (
                      <method.icon />
                    ) : (
                      React.createElement(method.icon, {
                        // ✅ CORREZIONE STILE: Icone Indaco
                        className: "w-5 h-5 text-indigo-600",
                      })
                    )}
                  </div>

                  <span className="font-medium text-gray-700 text-xs mt-1">
                    {method.name}
                  </span>
                </div>
              </label>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Scheda Form Dettagli Pagamento */}
      <Card className="shadow-lg border-2 border-indigo-100">
        <CardHeader>
          {/* ✅ CORREZIONE STILE: Titolo Indaco */}
          <CardTitle className="text-2xl text-indigo-800">
            2. Inserisci Dettagli
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Area Errore */}
          {paymentError && (
            <div
              className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-lg border border-red-300"
              role="alert"
            >
              {paymentError}
            </div>
          )}
          {/* Contenuto del Metodo Selezionato */}
          {renderMethodContent}
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentForm;