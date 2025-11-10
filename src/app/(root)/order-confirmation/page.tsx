import prisma from "@/db/prisma";
import { notFound } from "next/navigation";
import { CheckCircle } from "lucide-react";
import { Decimal } from "@prisma/client/runtime/library";
import { Order } from "@prisma/client";

// Questo file è un Server Component. Legge i parametri di ricerca tramite la prop 'searchParams'.
// Non è necessario usare 'use client' o l'hook useSearchParams.

// * DEFINIZIONE DEL TIPO PER IL CAMPO JSON *
interface ShippingAddressType {
  address: string;
  city: string;
  postalCode: string;
  country: string;
}

interface PaypalPaymentResults {
  id: string; // ID della transazione Paypal
  // Possiamo aggiungere altri campi se necessario (es. status, create_time, etc.)
}

// Tipo di estensione per la funzione per includere le relazioni
type OrderWithDetails = Order & {
  OrderItem: {
    name: string;
    qty: number;
    price: Decimal;
  }[];
  // Aggiungiamo anche la relazione User, necessaria per la riga 93 (order.user?.name)
  user: { name: string | null } | null;

  paymentResult: PaypalPaymentResults | null;
};

interface OrderConfirmationPageProps {
  searchParams: {
    id: string; // L'orderNumber passato dall'URL dopo il pagamento
  };
}

/**
 * Pagina Server Component per visualizzare la conferma di un Ordine Pagato.
 * Questa pagina è il target di reindirizzamento dopo un pagamento PayPal riuscito.
 */
export default async function OrderConfirmationPage({
  searchParams,
}: OrderConfirmationPageProps) {
  const orderId = searchParams.id;

  // 1. **CONTROLLO CRITICO**
  if (!orderId) {
    return notFound();
  }

  // 2. Recupera i dati dell'ordine dal DB (Server-side)
  // Nota: Aggiunto 'user' all'include per supportare la riga 93, sebbene il tipo Order non lo mostri
  // lo includiamo per l'asserzione del tipo.
  const order: OrderWithDetails | null = (await prisma.order.findUnique({
    where: {
      orderNumber: orderId, // Ricerchiamo per orderNumber
    },
    include: {
      OrderItem: { select: { name: true, qty: true, price: true } }, // Seleziona solo i campi necessari
      user: { select: { name: true } }, // Aggiunto per risolvere il potenziale errore di TS a riga 93
    },
  })) as OrderWithDetails | null; // Asserzione del tipo per le relazioni

  if (!order || !order.orderStatus) {
    // Se l'ordine non esiste o non è stato pagato (per sicurezza), reindirizza alla 404
    console.warn(
      `Ordine ${orderId} non trovato o non pagato al momento della conferma.`
    );
    return notFound();
  }

  // Risolve l'errore TS(2352) convertendo prima a 'unknown'.
  const shippingAddress = order.shippingAddress as unknown as
    | ShippingAddressType
    | undefined;

  // --- Contenuto della pagina Conferma Ordine ---

  return (
    <div className="container mx-auto p-4 md:p-8 min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-xl shadow-2xl">
        {/* Intestazione di Successo */}
        <div className="text-center mb-10">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto animate-pulse" />
          <h1 className="text-4xl font-extrabold text-gray-800 mt-4">
            Ordine Eseguito con Successo!
          </h1>
          <p className="text-gray-600 mt-2 text-lg">
            Grazie per il tuo acquisto. Il tuo ordine **#{order.orderNumber}** è
            stato confermato e i dettagli sono qui sotto.
          </p>
        </div>

        {/* Dettagli dell'Ordine */}
        <div className="grid md:grid-cols-2 gap-8 border-t border-gray-200 pt-8">
          {/* Dettagli Pagamento/Spedizione */}
          <div>
            <h2 className="text-2xl font-bold mb-4 border-b-2 pb-2 text-blue-700">
              Riepilogo Transazione
            </h2>

            <div className="space-y-4 text-base">
              <div className="flex justify-between items-center bg-blue-50 p-3 rounded-lg">
                <span className="text-gray-700 font-semibold">
                  Totale Pagato:
                </span>
                <span className="font-extrabold text-2xl text-red-600">
                  €{(order.totalPrice as Decimal)?.toNumber().toFixed(2)}
                </span>
              </div>
              <p className="flex justify-between border-t pt-2">
                <span className="text-gray-600">Metodo di Pagamento:</span>
                <span className="font-medium text-gray-800">
                  {order.paymentmethod}
                </span>
              </p>
              <p className="flex justify-between">
                <span className="text-gray-600">ID Transazione PayPal:</span>
                {/* Se `paymentResult` è presente, potremmo estrarre l'ID, altrimenti mostriamo N/D */}
                <span
                  className="font-mono text-xs text-gray-500 truncate max-w-[200px]"
                  title={order.paymentResult?.id || "N/D"}
                >
                  {order.paymentResult?.id || "N/D"}
                </span>
              </p>
              <p className="flex justify-between">
                <span className="text-gray-600">Pagato Il:</span>
                <span className="font-medium text-gray-800">
                  {order.paidAt
                    ? new Date(order.paidAt).toLocaleDateString("it-IT", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })
                    : "N/D"}
                </span>
              </p>
            </div>
          </div>

          {/* Dettagli Indirizzo */}
          <div>
            <h2 className="text-2xl font-bold mb-4 border-b-2 pb-2 text-blue-700">
              Indirizzo di Spedizione
            </h2>
            <div className="text-base text-gray-700 space-y-2 p-3 bg-gray-100 rounded-lg">
              <p className="font-semibold">
                Destinatario: {order.user?.name || "Utente Sconosciuto"}
              </p>
              <p>
                <span className="block font-light">
                  {shippingAddress?.address}
                </span>
                <span className="block font-light">
                  {shippingAddress?.city}, {shippingAddress?.postalCode}
                </span>
                <span className="block font-light">
                  {shippingAddress?.country}
                </span>
              </p>
            </div>
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
              Riceverai una email di conferma con i dettagli per il tracking.
            </div>
          </div>
        </div>

        {/* Articoli Ordinati */}
        <div className="mt-12 border-t border-gray-200 pt-8">
          <h2 className="text-2xl font-bold mb-6 border-b-2 pb-2 text-blue-700">
            Riepilogo Dettagli Ordine
          </h2>
          <div className="space-y-4">
            {order.OrderItem.map((item, index) => (
              <div
                key={index}
                className="flex justify-between items-center p-4 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg transition duration-150"
              >
                <span className="text-lg text-gray-700 font-medium">
                  {item.name}{" "}
                  <span className="text-sm text-gray-500 font-light">
                    (Quantità: {item.qty})
                  </span>
                </span>
                <span className="font-extrabold text-lg text-gray-900">
                  €{((item.price as Decimal).toNumber() * item.qty).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
