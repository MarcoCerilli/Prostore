import React, { useMemo } from "react";
import Image from "next/image";
// import { Button } from "@/components/ui/button";
import { Separator } from "@radix-ui/react-dropdown-menu";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CartItemFrontend } from "@/types"; // Importazione del tipo con price: number

// Mappatura Icone/Etichette per il riepilogo (CORRETTA)
const PAYMENT_METHOD_MAP = {
  "Carta di Credito / Debito": {
    icon: "💳",
    label: "Carta (via Stripe)",
  },
  PayPal: {
    // CORREZIONE: Chiave impostata come stringa per coerenza
    icon: "🅿️",
    label: "PayPal",
  },
  Contrassegno: {
    // CORREZIONE: Chiave impostata come stringa per coerenza
    icon: "💰",
    label: "Contrassegno",
  },
};

// Definizioni di interfaccia
interface CartItem {
  id: string;
  name: string;
  price: string; // Questo tipo non viene più utilizzato per le props, ma mantenuto per contesto
  quantity: number;
  image: string;
}

interface PaymentDetails {
  last4: string;
  method: string;
}

interface CheckoutSummaryProps {
  // ✅ CORREZIONE: Ora accetta CartItemFrontend[] (price: number)
  cartItems: CartItemFrontend[];
  shippingFee: number;
  taxRate: number;
  onProceed: () => void;
  savedPaymentDetails: PaymentDetails | null;
  step: "address" | "payment" | "review" | "success";
}

const CheckoutSummary: React.FC<CheckoutSummaryProps> = ({
  cartItems,
  shippingFee,
  taxRate,
  savedPaymentDetails,
  step,
}) => {
  // ✅ CORREZIONE CALCOLO COSTI: i prezzi sono già numeri (CartItemFrontend)
  const { subtotal, tax, total } = useMemo(() => {
    // Calcolo subtotale: usa item.price direttamente come numero
    const sub = cartItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    const calculatedTax = sub * taxRate;

    const finalTotal = sub + shippingFee + calculatedTax;
    return { subtotal: sub, tax: calculatedTax, total: finalTotal };
  }, [cartItems, shippingFee, taxRate]); // Funzione di formattazione

  const formatCurrency = (amount: number) =>
    `€${amount.toFixed(2).replace(".", ",")}`;

  const getButtonState = () => {
    let isVisible = false;
    return { isVisible };
  };

  const { isVisible } = getButtonState();

  return (
    <Card className="md:col-span-1 h-fit sticky top-4 shadow-xl">
      <CardHeader className="border-b pb-4">
        <CardTitle className="text-2xl text-gray-800">
          Riepilogo Ordine
        </CardTitle>
      </CardHeader>

      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Dettagli Articoli */}
          <div className="space-y-4">
            <h4 className="font-bold text-base mb-2 text-gray-700">
              Articoli:
            </h4>

            {cartItems.map((item, index) => (
              <div
                key={`${item.id}-${index}`}
                className="flex justify-between items-center text-sm border-b pb-3 last:border-b-0 last:pb-0"
              >
                <div className="flex items-start space-x-3">
                  <Image
                    src={item.image}
                    alt={item.name}
                    width={60}
                    height={60}
                    className="rounded-md object-cover w-[60px] h-[60px]"
                  />

                  <span className="text-gray-700 font-medium leading-tight pt-1">
                    {item.name} (x{item.quantity})
                  </span>
                </div>

                <span className="font-semibold text-gray-800">
                  {/* ✅ CORREZIONE: item.price è un number */}
                  {formatCurrency(item.price * item.quantity)}
                </span>
              </div>
            ))}
          </div>
          <Separator className="my-4 bg-gray-200 h-[1px]" />
          {/* Sottototali */}
          <div className="space-y-2 text-base">
            <div className="flex justify-between">
              <span>Subtotale Articoli</span>
              <span className="font-medium">{formatCurrency(subtotal)}</span>
            </div>

            <div className="flex justify-between">
              <span>Costo Spedizione</span>
              <span className="font-medium">{formatCurrency(shippingFee)}</span>
            </div>

            <div className="flex justify-between">
              <span>IVA ({taxRate * 100}%)</span>
              <span className="font-medium">{formatCurrency(tax)}</span>
            </div>
          </div>
          <Separator className="my-4 bg-gray-300 h-[1.5px]" />
          {/* Totale Finale */}
          <div className="flex justify-between font-bold text-xl text-indigo-700">
            <span>Totale</span>
            <span>{formatCurrency(total)}</span>
          </div>
          {/* Dettagli Pagamento Salvato */}

          {/* Mostra il dettaglio solo se siamo nello step REVIEW o SUCCESS e i dati esistono */}

          {step !== "address" && savedPaymentDetails && (
            <div className="mt-4 p-3 rounded-lg border border-gray-200 bg-gray-50">
              <p className="font-medium text-gray-800 mb-1">
                Metodo Selezionato:
              </p>

              {/* Logica di rendering dell'icona (che è corretta) */}

              {(() => {
                // Usa il casting con la chiave corretta
                const methodKey =
                  savedPaymentDetails.method as keyof typeof PAYMENT_METHOD_MAP;
                const methodInfo = PAYMENT_METHOD_MAP[methodKey];

                if (!methodInfo) return null;

                return (
                  <p className="flex items-center text-base font-semibold text-gray-700">
                    <span className="text-2xl mr-2">{methodInfo.icon}</span>{" "}
                    {/* Aumentato text-xl a text-2xl per visibilità */}
                    {methodInfo.label}
                    {savedPaymentDetails.last4 && (
                      <span className="text-xs text-gray-500 ml-2">
                        (termina con **** {savedPaymentDetails.last4})
                      </span>
                    )}
                  </p>
                );
              })()}
            </div>
          )}

          {/* Caso di errore per lo step review (Rimosso duplicato) */}
          {step === "review" && !savedPaymentDetails && (
            <div className="mt-4 p-3 rounded-lg border border-red-500 bg-red-50/50">
              <p className="text-sm text-red-600 font-semibold">
                Dettagli di pagamento in sospeso. Torna allo step Pagamento.
              </p>
            </div>
          )}
        </div>
      </CardContent>
      {/* FOOTER: Lasciato vuoto o rimosso completamente */}
      {isVisible && <CardFooter className="pt-0"></CardFooter>}
    </Card>
  );
};

export default CheckoutSummary;
