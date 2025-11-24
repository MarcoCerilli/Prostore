'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getPaymentIntentStatusAction } from '@/lib/actions/user.actions';
import { CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react';

// IMPORTAZIONE FONDAMENTALE DI STRIPE.JS
import { useStripe } from '@stripe/react-stripe-js'; 

/**
 * Componente per la pagina di successo/fallimento del pagamento con Stripe.
 * Questa pagina viene visualizzata dopo il reindirizzamento da Stripe Checkout (incl. PayPal).
 * * 1. Usa useStripe() per recuperare il Payment Intent lato client (obbligatorio per PayPal/Redirect).
 * 2. Chiama la Server Action per la verifica e l'aggiornamento finale dell'ordine.
 */
export default function PaymentSuccess() {
    // 1. Recupera i parametri dall'URL e l'oggetto Stripe
    const searchParams = useSearchParams();
    const router = useRouter(); 
    const stripe = useStripe(); // OTTENERE L'OGGETTO STRIPE
    
    const clientSecret = searchParams.get('payment_intent_client_secret');
    const orderNumberFromUrl = searchParams.get('order_number');
    const redirectStatus = searchParams.get('redirect_status'); 

    // 2. Stato per gestire il flusso e i risultati
    const [status, setStatus] = useState<'LOADING' | 'VERIFYING' | 'SUCCESS' | 'FAILURE' | 'PENDING' | 'ERROR'>('LOADING');
    const [message, setMessage] = useState('Verifica dello stato del pagamento in corso...');
    const [finalOrderNumber, setFinalOrderNumber] = useState(orderNumberFromUrl);

    // Stato per tracciare se la verifica è già stata avviata
    const [isVerificationStarted, setIsVerificationStarted] = useState(false);

    useEffect(() => {
        // Funzione asincrona per chiamare la Server Action
        const verifyPayment = async () => {
            // Impedisce esecuzioni multiple
            if (isVerificationStarted) return; 
            setIsVerificationStarted(true);

            if (!clientSecret || !orderNumberFromUrl || !stripe) {
                // Se manca un dato essenziale, setta l'errore se Stripe è pronto, altrimenti continua ad attendere
                if (stripe) {
                    setStatus('ERROR');
                    setMessage('Mancano i parametri essenziali per la verifica (client secret/numero ordine).');
                }
                return;
            }

            setStatus('VERIFYING');
            setMessage('Verifica dello stato del pagamento con Stripe...');

            try {
                // PRIMO PASSO: Usa Stripe.js lato client per recuperare e finalizzare il PI.
                // Questa chiamata è CRITICA per i metodi di reindirizzamento come PayPal.
                console.log("STRIPE.JS: Tentativo di retrievePaymentIntent lato client...");
                const { paymentIntent: pi, error: retrieveError } = await stripe.retrievePaymentIntent(clientSecret);

                if (retrieveError) {
                    throw new Error(`Errore Stripe.js: ${retrieveError.message}`);
                }

                // SECONDO PASSO: Chiama la Server Action per aggiornare l'ordine nel DB.
                const serverStatus = pi?.status || redirectStatus; 
                console.log(`SERVER ACTION: Chiamata con PI Status: ${serverStatus} e Secret: ${clientSecret}`);
                
                const result = await getPaymentIntentStatusAction(
                    orderNumberFromUrl,
                    clientSecret,
                    serverStatus || '' 
                );
                
                // Aggiorna lo stato e il messaggio
                setStatus(result.status);
                setMessage(result.message);
                
                // Gestione reindirizzamento
                if (result.status === 'SUCCESS' && result.orderNumber) {
                    setFinalOrderNumber(result.orderNumber);
                    
                    console.log(`✅ Pagamento verificato. Reindirizzamento a /dashboard/orders/${result.orderNumber}`);
                    // Reindirizzamento ritardato per dare tempo al DOM di aggiornarsi
                    setTimeout(() => {
                        router.replace(`/dashboard/orders/${result.orderNumber}`);
                    }, 1500); 
                    
                    return;
                }

            } catch (error) {
                console.error('Errore durante la verifica Stripe/Server Action:', error);
                setStatus('ERROR');
                setMessage('Si è verificato un errore inaspettato durante la verifica del server. Controlla la console del server.');
            }
        };

        // Esegui la verifica solo se tutti i dati sono presenti e Stripe è inizializzato
        if (clientSecret && orderNumberFromUrl && stripe && !isVerificationStarted) {
            verifyPayment();
        } else if (!clientSecret && !isVerificationStarted) {
            setStatus('ERROR');
            setMessage('Pagamento non completato. Nessun "client_secret" trovato nell\'URL.');
        }

    }, [clientSecret, orderNumberFromUrl, redirectStatus, router, stripe, isVerificationStarted]); // isVerificationStarted è la nuova dipendenza

    // 3. Funzione per decidere lo stile e l'icona (LOGICA DISPLAY INVARIATA)
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
                    details: message || 'C\'è stato un problema con il tuo pagamento. Contatta il supporto se il problema persiste.',
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