// File: app/order/[orderId]/page.tsx

import { notFound, redirect } from 'next/navigation';
import { finalizeOrder } from '@/lib/actions/cart.actions'; // La funzione che aggiorna l'ordine e svuota il carrello
import { getMyCart } from '@/lib/actions/cart.queries';
import { getOrderDetailsAction } from '@/lib/actions/user.actions';
import { Cart } from '@/types'; // Assicurati di importare i tipi corretti

interface OrderPageProps {
  params: { orderId: string }; // orderId sarà il tuo orderNumber (es. ORD-12345678)
  searchParams: { 
    payment_confirmed?: string; 
    payment_intent?: string; // ID del Payment Intent di Stripe
  };
}

/**
 * Funzione Helper per recuperare il Cart ID della sessione
 * (Assumiamo che getCurrentCart usi i cookies per trovare il carrello attivo)
 */
async function getActiveCartId(orderId: string): Promise<string | null> {
    const cart = await getMyCart();
    return cart ? cart.id : null;
}


async function OrderSuccessPage({ params, searchParams }: OrderPageProps) {
  const orderNumber = params.orderId; // Usiamo orderId come orderNumber
  const { payment_confirmed, payment_intent } = searchParams;

  // 1. RECUPERA I DETTAGLI DELL'ORDINE
  const orderDetails = await getOrderDetailsAction(orderNumber);

  if (!orderDetails) {
    // Se l'ordine non esiste, reindirizza o mostra un errore 404
    return notFound();
  }

  // 2. GESTIONE DELLA FINALIZZAZIONE (Solo al primo accesso dopo il pagamento Stripe)
  const isStripeRedirect = payment_confirmed === 'true' && payment_intent;

  if (isStripeRedirect) {
    // ⭐ AZIONE CRITICA: Solo se l'ordine non è ancora pagato
    if (orderDetails.status !== 'PAID') {
        
        // Recupera l'ID del carrello dalla sessione corrente
        const cartId = await getActiveCartId(orderNumber);

        if (cartId) {
            console.log(`[FINALIZE] Avvio finalizzazione per Ordine ${orderNumber} e Carrello ID ${cartId}`);
            
            // Chiama la Server Action che aggiorna lo stato, svuota il carrello e decrementa lo stock.
            const paymentResultPayload = {
                payment_intent_id: payment_intent, 
                status: 'succeeded',
                method: 'Stripe',
            };

            const finalizationResult = await finalizeOrder(
                orderDetails.id, // L'ID interno del DB (non l'OrderNumber)
                cartId, 
                paymentResultPayload, 
                'PAID'
            );

            if (!finalizationResult.success) {
                console.error("Errore durante la finalizzazione dell'ordine:", finalizationResult.message);
                // Puoi registrare l'errore nel DB e reindirizzare l'utente a una pagina di contatto
            }
        } else {
            console.warn("[FINALIZE WARN] Tentativo di finalizzare un ordine pagato, ma carrello non trovato. Ignoro.");
            // Potrebbe essere successo che il carrello è stato cancellato dal webhook
        }
    }
    
    // Rimuovi i query params per prevenire chiamate di finalizzazione multiple al refresh
    // Nota: L'uso di redirect() in un RSC è il modo più pulito
    redirect(`/order/${orderNumber}`);
  }

  // 3. RENDER DELLA PAGINA (Riepilogo)
  return (
    <div className="container mx-auto py-12">
        {/* Intestazione */}
        <div className="bg-green-50 p-6 rounded-lg shadow-md border-t-4 border-green-500">
            <h1 className="text-3xl font-bold text-green-700 mb-2">🎉 Ordine Confermato!</h1>
            <p className="text-lg text-green-600">Il tuo ordine #<span className="font-mono">{orderDetails.orderNumber}</span> è stato elaborato con successo.</p>
        </div>

        {/* Stato del pagamento */}
        <div className="mt-8 p-6 bg-white rounded-lg shadow border">
            <h2 className="text-xl font-semibold mb-4">Riepilogo e Stato</h2>
            
            <p className="mb-2"><strong>Stato Attuale:</strong> 
                <span className={`px-2 py-1 rounded-full text-sm font-medium ${
                    orderDetails.status === 'PAID' ? 'bg-green-100 text-green-800' : 
                    orderDetails.status === 'SHIPPED' ? 'bg-blue-100 text-blue-800' : 
                    'bg-yellow-100 text-yellow-800'
                }`}>
                    {orderDetails.status}
                </span>
            </p>
            <p><strong>Totale Pagato:</strong> €{orderDetails.totalPrice.toFixed(2)}</p>
            {/* Aggiungi qui i dettagli di spedizione, articoli, ecc. */}
        </div>
        
    </div>
  );
}

export default OrderSuccessPage;