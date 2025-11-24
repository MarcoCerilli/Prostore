'use client';

import { useEffect, useState, useCallback } from 'react';

// Simulazione di next/navigation e lucide-react (per l'ambiente autonomo)
const useSearchParams = () => {
    // Simula la lettura dei parametri dall'URL (se l'app fosse in un contesto reale)
    // Qui dobbiamo usare window.location.search per l'ambiente Immersive
    if (typeof window === 'undefined') return new URLSearchParams();
    return new URLSearchParams(window.location.search);
};
const useRouter = () => ({ 
    replace: (url) => { console.log(`[NAVIGAZIONE SIMULATA] Reindirizzamento a: ${url}`); } 
});
// Simulazione delle icone Lucide (se non disponibili)
const CheckCircle = ({ className }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const XCircle = ({ className }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const Clock = ({ className }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const Loader2 = ({ className }) => <svg className={`${className} animate-spin`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>;

// ⚠️ SIMULAZIONE: Funzioni di Stripe e Server Action
// In un ambiente reale, questi sarebbero importati e connessi a un backend.
const useStripe = () => ({
    retrievePaymentIntent: async (secret) => {
        console.log(`[SIMULAZIONE STRIPE.JS] Tentativo di recuperare il PI per ${secret}`);
        // Simulazione di una logica di successo:
        if (secret && secret.startsWith('pi_success')) {
            return { 
                paymentIntent: { status: 'succeeded' }, 
                error: null 
            };
        }
        // Simulazione di un'azione richiesta (es. 3D Secure non completato)
        if (secret && secret.startsWith('pi_action')) {
             return { 
                paymentIntent: { status: 'requires_action' }, 
                error: null 
            };
        }
        // Simulazione errore generico
        return { paymentIntent: null, error: { message: 'Simulated API Error' } };
    }
});

/**
 * SIMULAZIONE della Server Action getPaymentIntentStatusAction
 * In un ambiente reale, questa farebbe la vera chiamata a Stripe Server-side e l'aggiornamento Prisma.
 * (La tua logica originale è stata integrata qui per la dimostrazione)
 */
const getPaymentIntentStatusAction = async (orderNumber, clientSecret, serverStatus) => {
    console.log(`[SIMULAZIONE SERVER] Verifico Ordine #${orderNumber} con stato PI: ${serverStatus}`);

    // Logica semplificata basata sulla tua Server Action originale
    await new Promise(resolve => setTimeout(resolve, 500)); // Simula il ritardo del DB/API

    switch (serverStatus) {
        case 'succeeded':
            // Simula la logica per determinare il metodo (Stripe o PayPal)
            const isPayPal = orderNumber.includes('PAYPAL');
            const paymentMethod = isPayPal ? 'PAYPAL' : 'STRIPE_CARD';

            // Simula l'aggiornamento di successo nel DB
            return {
                status: 'SUCCESS',
                message: `Il pagamento è stato completato con successo tramite ${paymentMethod}. L'ordine #${orderNumber} è confermato!`,
                orderNumber: orderNumber,
                paymentIntentId: clientSecret.split('_secret_')[0]
            };
        
        case 'processing':
            // Simula lo stato Pending
            return {
                status: 'PENDING',
                message: "Il tuo pagamento è in fase di elaborazione. Riceverai una conferma via email a breve.",
                orderNumber: orderNumber,
                paymentIntentId: clientSecret.split('_secret_')[0]
            };

        case 'requires_action':
        case 'requires_payment_method':
        case 'canceled':
            // Simula lo stato Fallito
            return {
                status: 'FAILURE',
                message: "Il pagamento non è riuscito o è stato annullato. Riprova dalla pagina dell'ordine.",
                orderNumber: orderNumber,
                paymentIntentId: clientSecret.split('_secret_')[0]
            };

        default:
             return {
                status: 'FAILURE',
                message: `Stato di pagamento inatteso: ${serverStatus}. Contatta il supporto.`,
                orderNumber: orderNumber,
                paymentIntentId: 'N/A'
             };
    }
};

/**
 * Componente per la pagina di successo/fallimento del pagamento con Stripe.
 */
export default function PaymentSuccess() {
    const searchParams = useSearchParams();
    const router = useRouter(); 
    const stripe = useStripe(); 
    
    // Legge i parametri essenziali dall'URL
    const clientSecret = searchParams.get('payment_intent_client_secret');
    const orderNumber = searchParams.get('order_number');
    const redirectStatus = searchParams.get('redirect_status'); 

    const [status, setStatus] = useState('LOADING');
    const [message, setMessage] = useState('Verifica dello stato del pagamento in corso...');
    const [finalOrderNumber, setFinalOrderNumber] = useState(orderNumber);
    const [isVerificationStarted, setIsVerificationStarted] = useState(false);

    const verifyPayment = useCallback(async () => {
        // Impedisce esecuzioni multiple (già gestito da useEffect, ma è una buona pratica)
        if (isVerificationStarted) return; 
        
        // Check iniziale dei dati
        if (!clientSecret || !orderNumber || !stripe) {
            if (stripe) {
                setStatus('ERROR');
                setMessage('Mancano i parametri essenziali per la verifica (client secret/numero ordine).');
            }
            return; 
        }
        
        setIsVerificationStarted(true);
        setStatus('VERIFYING');
        setMessage('Verifica dello stato del pagamento con Stripe...');

        try {
            // PRIMO PASSO: Usa Stripe.js lato client
            const { paymentIntent: pi, error: retrieveError } = await stripe.retrievePaymentIntent(clientSecret);

            if (retrieveError) {
                throw new Error(`Errore Stripe.js: ${retrieveError.message}`);
            }

            // SECONDO PASSO: Chiama la Server Action per aggiornare l'ordine nel DB.
            const serverStatus = pi?.status || redirectStatus; 
            
            const result = await getPaymentIntentStatusAction(
                orderNumber, 
                clientSecret,
                serverStatus || '' 
            );
            
            setStatus(result.status);
            setMessage(result.message);
            
            // Gestione reindirizzamento in caso di successo
            if (result.status === 'SUCCESS' && result.orderNumber) {
                setFinalOrderNumber(result.orderNumber);
                
                setTimeout(() => {
                    // router.replace è simulato per coerenza
                    router.replace(`/dashboard/orders/${result.orderNumber}`);
                }, 1500); 
                
                return;
            }

        } catch (error) {
            console.error('Errore durante la verifica Stripe/Server Action:', error);
            setStatus('ERROR');
            setMessage('Si è verificato un errore inaspettato durante la verifica del server. Controlla la console del server.');
        }
    }, [clientSecret, orderNumber, redirectStatus, stripe, isVerificationStarted, router]);

    useEffect(() => {
        // Esegui la funzione se non è stata ancora avviata e clientSecret è presente.
        if (clientSecret && !isVerificationStarted) {
            verifyPayment();
        } else if (!clientSecret && status === 'LOADING') {
             // Imposta lo stato di errore iniziale solo se non è già stata avviata alcuna operazione
             setStatus('ERROR');
             setMessage('Pagamento non completato. Nessun "client_secret" trovato nell\'URL. Torna al carrello per riprovare.');
        }

    }, [clientSecret, status, isVerificationStarted, verifyPayment]); 

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