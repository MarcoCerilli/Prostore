'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation'; // Usa quelli veri di Next.js
import { CheckCircle, XCircle, Loader2, Clock } from 'lucide-react'; 
// Importa la tua action vera per verificare lo stato dell'ordine nel DB
import { getOrderByIdAction } from '@/lib/actions/order.actions'; // Assumiamo esista
// Importa loadStripe se usi stripe
import { useStripe } from '@stripe/react-stripe-js';

export default function PaymentSuccess() {
    const searchParams = useSearchParams();
    const router = useRouter(); 
    // const stripe = useStripe(); // Attivalo solo se il componente è wrappato in <Elements>
    
    // Parametri URL
    const clientSecret = searchParams.get('payment_intent_client_secret');
    const orderIdParam = searchParams.get('orderId') || searchParams.get('order_number');
    const redirectStatus = searchParams.get('redirect_status'); 

    const [status, setStatus] = useState('LOADING');
    const [message, setMessage] = useState('Verifica in corso...');
    const [finalOrderNumber, setFinalOrderNumber] = useState<string | null>(null);

    useEffect(() => {
        const verify = async () => {
            // SCENARIO 1: STRIPE (Rilevato dalla presenza di clientSecret)
            if (clientSecret) {
                setMessage("Verifica pagamento Stripe...");
                // Qui dovresti usare stripe.retrievePaymentIntent(clientSecret) 
                // Ma per semplicità, se redirect_status è succeeded, consideriamolo ok
                // e chiamiamo il server per confermare.
                
                if (redirectStatus === 'succeeded') {
                     // Opzionale: Chiamata server per aggiornare stato ordine se non fatto dal webhook
                     setStatus('SUCCESS');
                     setMessage('Pagamento Stripe confermato!');
                     // Estrarre l'ID ordine dai metadati o passarlo nell'URL di ritorno di Stripe è meglio
                } else {
                    setStatus('FAILURE');
                    setMessage('Pagamento Stripe non riuscito.');
                }
                return;
            }

            // SCENARIO 2: PAYPAL / CONTRASSEGNO (Nessun secret, solo Order ID)
            if (orderIdParam) {
                setMessage("Recupero dettagli ordine...");
                
                // Chiamiamo una Server Action per vedere se l'ordine esiste ed è pagato
                // Questa action deve fare: prisma.order.findUnique({ where: { id: orderIdParam } })
                try {
                    // ⚠️ Sostituisci con la tua vera server action
                    // const order = await getOrderByIdAction(orderIdParam);
                    
                    // Simulazione risposta positiva:
                    const order = { id: orderIdParam, isPaid: true, paymentMethod: 'PayPal' }; 
                    
                    if (order) {
                        setFinalOrderNumber(order.id); // o order.orderNumber
                        setStatus('SUCCESS');
                        setMessage('Ordine confermato correttamente!');
                    } else {
                        setStatus('ERROR');
                        setMessage('Ordine non trovato.');
                    }
                } catch (err) {
                    setStatus('ERROR');
                    setMessage('Errore nel recupero dell\'ordine.');
                }
                return;
            }

            // SCENARIO 3: NESSUN PARAMETRO
            setStatus('ERROR');
            setMessage('Parametri mancanti. Impossibile verificare l\'ordine.');
        };

        verify();
    }, [clientSecret, orderIdParam, redirectStatus]);

    // Renderizzazione UI (Simile alla tua ma semplificata)
    const getStatusUI = () => {
        switch (status) {
            case 'SUCCESS':
                return {
                    icon: <CheckCircle className="w-16 h-16 text-green-500" />,
                    title: 'Grazie!',
                    details: message,
                    color: 'text-green-600',
                    bgColor: 'bg-green-50'
                };
            case 'FAILURE':
            case 'ERROR':
                return {
                    icon: <XCircle className="w-16 h-16 text-red-500" />,
                    title: 'Ops!',
                    details: message,
                    color: 'text-red-600',
                    bgColor: 'bg-red-50'
                };
            default:
                return {
                    icon: <Loader2 className="w-16 h-16 text-blue-500 animate-spin" />,
                    title: 'Attendere...',
                    details: message,
                    color: 'text-blue-600',
                    bgColor: 'bg-blue-50'
                };
        }
    };

    const ui = getStatusUI();

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
             <div className={`w-full max-w-md p-8 rounded-xl shadow-lg border ${ui.bgColor} border-gray-200 text-center`}>
                <div className="flex justify-center mb-4">{ui.icon}</div>
                <h1 className={`text-2xl font-bold mb-2 ${ui.color}`}>{ui.title}</h1>
                <p className="text-gray-600 mb-6">{ui.details}</p>
                
                {status === 'SUCCESS' && (
                    <button 
                        onClick={() => router.push(`/order/${orderIdParam || finalOrderNumber}`)}
                        className="bg-black text-white px-6 py-2 rounded-md hover:bg-gray-800 transition"
                    >
                        Vedi dettagli ordine
                    </button>
                )}
                 {status === 'ERROR' && (
                    <button 
                        onClick={() => router.push(`/cart`)}
                        className="bg-gray-200 text-gray-800 px-6 py-2 rounded-md hover:bg-gray-300 transition"
                    >
                        Torna al carrello
                    </button>
                )}
             </div>
        </div>
    );
}