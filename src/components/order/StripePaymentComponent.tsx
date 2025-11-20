"use client";

import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  useStripe,
  useElements,
  PaymentElement,
} from "@stripe/react-stripe-js";
import React, { useState } from "react";
// Assumo che tu importi la Server Action per l'aggiornamento del database
import { updateOrderAfterStripeSuccess } from "@/lib/actions/order.actions";
import { useRouter } from "next/navigation";


// ⚠️ NOTA: In un ambiente di produzione, leggere da process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
const STRIPE_PUBLISHABLE_KEY = "pk_test_51QUPzIC71Bin0uhAdB0CRJLVvBXNqhsvtcSPsXi3Yw2eArtADuGvIHz8Ki7DrcfrBbmogbvx4PNcS3p8XwUqZe6O00YvTLaXJ5";

// Inizializzazione Stripe
const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY) as any;

interface StripeFormProps {
  client_secret: string;
  orderId: string;
  totalPrice: number;
  // ✅ NUOVA PROP: Funzione per notificare il componente genitore se necessario
  onPaymentSuccess: (paymentIntentId: string) => void;
}

// --- Componente Figlio (CheckoutForm) ---

const CheckoutForm: React.FC<StripeFormProps> = ({
  client_secret,
  orderId,
  totalPrice,
  onPaymentSuccess, // Riceviamo la prop di successo
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter(); // Per il reindirizzamento manuale

  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (!stripe || !elements) {
    return (
      <div className="text-center py-4 text-gray-500">
        Caricamento del modulo di pagamento...
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");

    // Utilizziamo un URL fittizio per il reindirizzamento in caso di 3D Secure, 
    // ma la gestione del successo la facciamo manualmente qui.
    const returnUrl = `${window.location.origin}/checkout?step=review&orderId=${orderId}`; 

    // 1. Esegui la conferma del pagamento
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        // Stripe reindirizzerà qui DOPO eventuali passaggi di autenticazione 3D Secure
        return_url: returnUrl, 
      },
      redirect: "if_required", // Non forzare il reindirizzamento subito
    });
    
    // 2. Gestione del successo o fallimento IMMEDIATO (senza 3D Secure)

    if (error) {
      // Errore nella conferma del pagamento (carta rifiutata, dati errati)
      setMessage(
        error.message || "Si è verificato un errore con i dati della carta."
      );
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // ✅ PAGAMENTO RIUSCITO - SALVIAMO L'ID NEL DATABASE
        console.log("Stripe Successo, PI ID:", paymentIntent.id);



        const updateResult = await updateOrderAfterStripeSuccess({
            orderId: orderId,
            stripePaymentIntentId: paymentIntent.id,
        });

        if (updateResult.success) {
            // Notifica il genitore e reindirizza alla pagina di successo/review
            onPaymentSuccess(paymentIntent.id); 
            router.push(`/checkout?step=review`); // Reindirizza al passo review
        } else {
            // Errore: Pagamento OK, ma salvataggio DB FALLITO (CRITICO)
            setMessage("Pagamento completato, ma errore nel salvataggio dell'ordine. Contattare supporto.");
            console.error("ERRORE SALVATAGGIO DB:", updateResult.error);
        }
    } else {
        // Altri stati (tipo processing, richiede azione, ecc.)
        setMessage(`Stato pagamento non finale: ${paymentIntent?.status}.`);
    }

    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement className="p-2 border border-gray-300 rounded-lg" />

      <button
        disabled={isLoading || !stripe || !elements}
        className={`w-full p-3 rounded-lg font-semibold transition duration-200 
                            ${
                              isLoading
                                ? "bg-gray-400 cursor-not-allowed"
                                : "bg-blue-600 hover:bg-blue-700 text-white shadow-md"
                            }`}
      >
        {isLoading ? "Elaborazione..." : `Paga €${totalPrice.toFixed(2)}`}
      </button>

      {message && (
        <div className="p-3 bg-red-100 text-red-700 border border-red-300 rounded-md text-sm">
          {message}
        </div>
      )}
    </form>
  );
};

// --- Componente Wrapper (StripePaymentComponent) ---

const StripePaymentComponent: React.FC<StripeFormProps> = ({
  client_secret,
  orderId,
  totalPrice,
  onPaymentSuccess, // Propagazione della funzione di successo
}) => {
  const appearance = {
    theme: "stripe" as const,
    variables: {
      colorPrimary: "#3b82f6",
      colorText: "#1f2937",
    },
  };

  const options = client_secret
    ? {
        clientSecret: client_secret,
        appearance,
      }
    : null;

  if (!options || !client_secret) {
    return (
      <div className="p-4 bg-red-100 text-red-700 border border-red-300 rounded-md text-sm">
        Errore: Impossibile avviare il pagamento. (Manca il client_secret)
      </div>
    );
  }
  return (
    <div className="bg-white p-4 rounded-lg border shadow-lg">
      <h4 className="text-xl font-bold mb-4 border-b pb-2">
        Totale: <span className="text-blue-600">€{totalPrice.toFixed(2)}</span>
      </h4>
      <Elements options={options} stripe={stripePromise}>
        <CheckoutForm
          client_secret={client_secret}
          orderId={orderId}
          totalPrice={totalPrice}
          // ✅ PASSAGGIO DELLA FUNZIONE DI SUCCESSO
          onPaymentSuccess={onPaymentSuccess} 
        />
      </Elements>
    </div>
  );
};

export default StripePaymentComponent;