// File: src/app/(root)/order/[orderId]/page.tsx

import { notFound } from "next/navigation";
import PayPalButtonComponent from "@/components/order/PaypalButtonComponent"; 
import { getOrderDetailsAction } from "@/lib/actions/user.actions"; // ✅ Usiamo la Server Action centralizzata
import { auth } from "@/auth"; // Necessario per l'ID utente per il componente PayPal

// * DEFINIZIONE DEI TIPI *
// Nota: Questi tipi devono corrispondere esattamente all'oggetto restituito da getOrderDetailsAction.
interface ShippingAddressType {
  address: string;
  city: string;
  postalCode: string;
  country: string;
}

interface OrderItemSimplified {
    id: string;
    productId: string; // Se lo aggiungiamo al carrello
    name: string;
    qty: number;
    price: number; // Ora come Number, non Decimal
    slug: string;
    image: string;
}

interface OrderDetails {
    id: string;
    orderNumber: string;
    userId: string;
    shippingAddress: ShippingAddressType;
    paymentmethod: string;
    status: 'PENDING_PAYMENT' | 'PAID' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
    itemsPrice: number;
    shippingPrice: number;
    taxPrice: number;
    totalPrice: number;
    // ... altri campi (createdAt, paidAt, etc.)
    OrderItem: OrderItemSimplified[];
}


interface OrderDetailPageProps {
  params: {
    orderId: string; // Sarà l'orderNumber (es. ORD-XXXX)
  };
}

/**
 * Pagina Server Component per visualizzare i dettagli di un Ordine.
 */
export default async function OrderDetailPage({
  params,
}: OrderDetailPageProps) {
  
  const { orderId } = params; 
  
  const validatedOrderId = String(orderId);
  // Controllo base sulla validità dell'ID/OrderNumber
  if (!validatedOrderId || validatedOrderId.length < 5) {
    return notFound();
  }

  // 1. RECUPERA I DATI DALLA SERVER ACTION
  // La Server Action gestisce il filtro per userId e la ricerca per orderNumber.
  const order = await getOrderDetailsAction(validatedOrderId) as OrderDetails | null; 

  if (!order) {
    // Non trovato o non appartenente all'utente loggato
    return notFound();
  }
  
  // Determinazione dello stato di pagamento
  const isPaid = order.status === 'PAID';

  const shippingAddress = order.shippingAddress;
  const orderItems = order.OrderItem; 
  
  // Determina il testo e il colore in base allo stato
  const statusColor = isPaid ? "text-green-600" : (order.status === 'CANCELLED' ? "text-red-600" : "text-yellow-600");
  const statusText = isPaid ? "Pagato" : (order.status === 'PENDING_PAYMENT' ? "In Attesa di Pagamento" : "Stato: " + order.status.replace('_', ' '));


  // --- Contenuto della pagina Dettaglio Ordine ---

  return (
    <div className="container mx-auto p-4 md:p-8 min-h-screen">
      <h1 className="text-3xl font-bold mb-6">
        Dettagli Ordine #{order.orderNumber}
      </h1>

      <div className="grid md:grid-cols-3 gap-8">
        
        {/* Colonna Dettagli Ordine */}
        <div className="md:col-span-2">
          <h2 className="text-xl font-semibold mb-4 border-b pb-2">
            Articoli Ordinati ({orderItems.length})
          </h2>
          
          {/* Mappa degli Articoli */}
          {orderItems.map((item, index) => (
            <div
              key={item.id || index}
              className="flex justify-between items-center py-2 border-b last:border-b-0"
            >
              <span className="text-gray-700">
                {item.name} (x{item.qty})
              </span>
              <span className="font-medium">
                €{(item.price * item.qty).toFixed(2)}
              </span>
            </div>
          ))}

          {/* Riepilogo Totali */}
          <div className="mt-6 space-y-2 text-right">
            <p>
              Subtotale:{" "}
              <span className="font-medium">
                €{order.itemsPrice.toFixed(2)}
              </span>
            </p>
            <p>
              Spedizione:{" "}
              <span className="font-medium">
                €{order.shippingPrice.toFixed(2)}
              </span>
            </p>
            <p>
              Tasse:{" "}
              <span className="font-medium">
                €{order.taxPrice.toFixed(2)}
              </span>
            </p>
            <p className="text-2xl font-bold pt-2 border-t mt-2">
              Totale:{" "}
              <span className="text-red-600">
                €{order.totalPrice.toFixed(2)}
              </span>
            </p>
          </div>
        </div>

        {/* Colonna Riassunto e Pagamento */}
        <div className="bg-gray-50 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Stato e Pagamento</h2>

          <p className="mb-4">
            Stato Ordine:
            <span
              className={`font-bold ml-2 ${statusColor}`}
            >
              {statusText}
            </span>
          </p>

          {/* Mostra il bottone PayPal solo se non pagato e il metodo di pagamento non è Contrassegno */}
          {!isPaid && order.paymentmethod !== 'Contrassegno' && (
              <div className="mt-4">
                  <h3 className="text-lg font-semibold mb-3">Completa il Pagamento</h3>
                  <PayPalButtonComponent
                      orderId={order.orderNumber}
                      finalPrice={order.totalPrice.toFixed(2)}
                      itemsPrice={order.itemsPrice.toFixed(2)} 
                      shippingPrice={order.shippingPrice.toFixed(2)} 
                      taxPrice={order.taxPrice.toFixed(2)} 
                      items={orderItems} 
                      userId={order.userId} 
                      onPaymentSuccess={(details: any) => { 
                          // Implementa qui la logica di notifica/ricaricamento
                          // Esempio: revalidatePath(`/order/${order.orderNumber}`); 
                          console.log("Pagamento PayPal completato:", details);
                      }} 
                      isPaid={isPaid}
                  />
              </div>
          )}


          <div className="mt-6 border-t pt-4">
            <h3 className="font-medium">Indirizzo di Spedizione:</h3>
            <p className="text-sm text-gray-600 mt-1">
              {shippingAddress.address}
              <br />
              {shippingAddress.city}, {shippingAddress.postalCode}
              <br />
              {shippingAddress.country}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}