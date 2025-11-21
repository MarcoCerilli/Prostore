'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation'; // <-- AGGIUNTO useRouter
import { getPaymentIntentStatusAction } from '@/lib/actions/user.actions';
import { CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react';

/**
 * Componente per la pagina di successo/fallimento del pagamento con Stripe.
 * Questa pagina viene visualizzata dopo il reindirizzamento da Stripe Checkout.
 * Chiama la Server Action per verificare lo stato del pagamento e aggiornare l'ordine.
 */
export default function PaymentSuccess() {
    // 1. Recupera i parametri dall'URL (mandati da Stripe)
    const searchParams = useSearchParams();
    const router = useRouter(); // <-- OTTENERE L'OGGETTO ROUTER
    
    const clientSecret = searchParams.get('payment_intent_client_secret');
    const orderNumberFromUrl = searchParams.get('order_number'); // Assumi che l'order_number sia passato
    const redirectStatus = searchParams.get('redirect_status'); // 'succeeded', 'failed', ecc.

    // 2. Stato per gestire il flusso e i risultati
    const [status, setStatus] = useState<'LOADING' | 'VERIFYING' | 'SUCCESS' | 'FAILURE' | 'PENDING' | 'ERROR'>('LOADING');
    const [message, setMessage] = useState('Verifica dello stato del pagamento in corso...');
    const [finalOrderNumber, setFinalOrderNumber] = useState(orderNumberFromUrl); // Usiamo questo per l'URL finale

    useEffect(() => {
        // Funzione asincrona per chiamare la Server Action
        const verifyPayment = async () => {
            if (!clientSecret || !orderNumberFromUrl) {
                setStatus('ERROR');
                setMessage('Mancano i parametri essenziali per la verifica (client secret o numero ordine).');
                return;
            }

            setStatus('VERIFYING');

            try {
                // Chiama la tua Server Action per verificare e aggiornare
                const result = await getPaymentIntentStatusAction(
                    orderNumberFromUrl,
                    clientSecret,
                    redirectStatus || ''
                );
                
                // Aggiorna lo stato e il messaggio
                setStatus(result.status);
                setMessage(result.message);
                
                // Se la Server Action ha confermato il successo E ha ritornato il numero d'ordine
                if (result.status === 'SUCCESS' && result.orderNumber) {
                    setFinalOrderNumber(result.orderNumber);
                    
                    // ⭐ REINDIRIZZAMENTO AUTOMATICO (Soluzione al problema di caching/refresh)
                    console.log(`✅ Pagamento verificato. Reindirizzamento a /dashboard/orders/${result.orderNumber}`);
                    // Utilizziamo replace per evitare che l'utente torni a questa pagina di transizione con il tasto indietro
                    router.replace(`/dashboard/orders/${result.orderNumber}`);
                    
                    // IMPORTANTE: Esci qui per prevenire ulteriori rendering o messaggi inutili
                    return;
                }

            } catch (error) {
                console.error('Errore durante la chiamata alla Server Action:', error);
                setStatus('ERROR');
                setMessage('Si è verificato un errore inaspettato durante la verifica del server.');
            }
        };

        if (clientSecret && orderNumberFromUrl) {
            verifyPayment();
        } else if (!clientSecret) {
            setStatus('ERROR');
            setMessage('Pagamento non completato. Nessun "payment_intent_client_secret" trovato nell\'URL.');
        }
    }, [clientSecret, orderNumberFromUrl, redirectStatus, router]); // Aggiungi router alle dipendenze

    // 3. Funzione per decidere lo stile e l'icona
    const getStatusDisplay = () => {
        switch (status) {
            case 'SUCCESS':
                return {
                    icon: <CheckCircle className="w-16 h-16 text-green-500" />,
                    title: 'Pagamento Completato!',
                    color: 'text-green-600',
                    bgColor: 'bg-green-50',
                    details: 'Il tuo ordine è stato confermato. Verrai reindirizzato tra poco.',
                };
            case 'PENDING':
                return {
                    icon: <Clock className="w-16 h-16 text-yellow-500" />,
                    title: 'Verifica in Sospeso',
                    color: 'text-yellow-600',
                    bgColor: 'bg-yellow-50',
                    details: 'Stiamo ancora aspettando la conferma finale da parte del sistema di pagamento. L\'ordine verrà aggiornato a breve.',
                };
            case 'FAILURE':
            case 'ERROR':
                return {
                    icon: <XCircle className="w-16 h-16 text-red-500" />,
                    title: 'Pagamento Fallito o Errore',
                    color: 'text-red-600',
                    bgColor: 'bg-red-50',
                    details: 'C\'è stato un problema con il tuo pagamento. Contatta il supporto se il problema persiste.',
                };
            case 'LOADING':
            case 'VERIFYING':
            default:
                return {
                    icon: <Loader2 className="w-16 h-16 text-blue-500 animate-spin" />,
                    title: 'Verifica in Corso...',
                    color: 'text-blue-600',
                    bgColor: 'bg-blue-50',
                    details: message,
                };
        }
    };

    const { icon, title, color, bgColor, details } = getStatusDisplay();

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 font-sans">
            <script src="https://cdn.tailwindcss.com"></script>
            <div className={`w-full max-w-lg p-8 rounded-xl shadow-2xl transition-all duration-300 ${bgColor} border border-gray-200`}>
                <div className="flex flex-col items-center space-y-6">
                    {icon}
                    <h1 className={`text-3xl font-extrabold text-center ${color}`}>{title}</h1>
                    
                    <p className="text-gray-700 text-center text-lg">{details}</p>

                    {(status === 'SUCCESS' || status === 'PENDING') && finalOrderNumber && (
                        <div className="bg-white p-4 rounded-lg border border-gray-200 w-full text-center shadow-inner">
                            <span className="text-sm font-semibold text-gray-500">Numero Ordine:</span>
                            <p className="text-xl font-mono text-gray-900 mt-1">{finalOrderNumber}</p>
                        </div>
                    )}
                    
                    <a 
                        href={status === 'SUCCESS' && finalOrderNumber ? `/dashboard/orders/${finalOrderNumber}` : "/dashboard/orders"} 
                        className="w-full text-center px-6 py-3 mt-4 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-indigo-500 focus:ring-opacity-50 font-semibold"
                    >
                        {status === 'SUCCESS' ? 'Vai al tuo Ordine' : 'Torna ai tuoi Ordini'}
                    </a>
                </div>
            </div>
        </div>
    );
}