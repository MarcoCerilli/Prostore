'use client';

import { useEffect, useState } from 'react';
// La risoluzione del path di next/navigation a volte fallisce in ambienti di simulazione.
// Se l'errore persiste, è probabile che l'ambiente non supporti l'importazione.
import { useSearchParams } from 'next/navigation'; 
import { getPaymentIntentStatusAction } from 'src/lib/actions/user.actions.ts'; // Percorso aggiustato per ambiente di compilazione Canvas

// Icone Lucide per uno stile moderno
import { CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react';

/**
 * Componente per la pagina di successo/fallimento del pagamento con Stripe.
 * Questa pagina viene visualizzata dopo il reindirizzamento da Stripe Checkout.
 * Chiama la Server Action per verificare lo stato del pagamento e aggiornare l'ordine.
 */
export default function PaymentSuccess() {
    // 1. Recupera i parametri dall'URL (mandati da Stripe)
    const searchParams = useSearchParams();
    const clientSecret = searchParams.get('payment_intent_client_secret');
    const orderNumber = searchParams.get('order_number'); // Assumi che l'order_number sia passato
    const redirectStatus = searchParams.get('redirect_status'); // 'succeeded', 'failed', ecc.

    // 2. Stato per gestire il flusso e i risultati
    const [status, setStatus] = useState<'LOADING' | 'VERIFYING' | 'SUCCESS' | 'FAILURE' | 'PENDING' | 'ERROR'>('LOADING');
    const [message, setMessage] = useState('Verifica dello stato del pagamento in corso...');

    useEffect(() => {
        // Funzione asincrona per chiamare la Server Action
        const verifyPayment = async () => {
            if (!clientSecret || !orderNumber) {
                setStatus('ERROR');
                setMessage('Mancano i parametri essenziali per la verifica (client secret o numero ordine).');
                return;
            }

            setStatus('VERIFYING');

            try {
                // Chiama la tua Server Action per verificare e aggiornare
                const result = await getPaymentIntentStatusAction(
                    orderNumber,
                    clientSecret,
                    redirectStatus || ''
                );

                // Aggiorna lo stato in base alla risposta della Server Action
                setStatus(result.status);
                setMessage(result.message);
            } catch (error) {
                console.error('Errore durante la chiamata alla Server Action:', error);
                setStatus('ERROR');
                setMessage('Si è verificato un errore inaspettato durante la verifica del server.');
            }
        };

        if (clientSecret && orderNumber) {
            verifyPayment();
        } else if (!clientSecret) {
            setStatus('ERROR');
            setMessage('Pagamento non completato. Nessun "payment_intent_client_secret" trovato nell\'URL.');
        }
    }, [clientSecret, orderNumber, redirectStatus]); // Esegui solo al caricamento iniziale e quando i parametri cambiano

    // 3. Funzione per decidere lo stile e l'icona
    const getStatusDisplay = () => {
        switch (status) {
            case 'SUCCESS':
                return {
                    icon: <CheckCircle className="w-16 h-16 text-green-500" />,
                    title: 'Pagamento Completato!',
                    color: 'text-green-600',
                    bgColor: 'bg-green-50',
                };
            case 'PENDING':
                return {
                    icon: <Clock className="w-16 h-16 text-yellow-500" />,
                    title: 'Verifica in Sospeso',
                    color: 'text-yellow-600',
                    bgColor: 'bg-yellow-50',
                };
            case 'FAILURE':
            case 'ERROR':
                return {
                    icon: <XCircle className="w-16 h-16 text-red-500" />,
                    title: 'Pagamento Fallito o Errore',
                    color: 'text-red-600',
                    bgColor: 'bg-red-50',
                };
            case 'LOADING':
            case 'VERIFYING':
            default:
                return {
                    icon: <Loader2 className="w-16 h-16 text-blue-500 animate-spin" />,
                    title: 'Verifica in Corso...',
                    color: 'text-blue-600',
                    bgColor: 'bg-blue-50',
                };
        }
    };

    const { icon, title, color, bgColor } = getStatusDisplay();

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 font-sans">
            <script src="https://cdn.tailwindcss.com"></script>
            <div className={`w-full max-w-lg p-8 rounded-xl shadow-2xl transition-all duration-300 ${bgColor} border border-gray-200`}>
                <div className="flex flex-col items-center space-y-6">
                    {icon}
                    <h1 className={`text-3xl font-extrabold text-center ${color}`}>{title}</h1>
                    
                    <p className="text-gray-700 text-center text-lg">{message}</p>

                    {(status === 'SUCCESS' || status === 'PENDING') && orderNumber && (
                        <div className="bg-white p-4 rounded-lg border border-gray-200 w-full text-center shadow-inner">
                            <span className="text-sm font-semibold text-gray-500">Numero Ordine:</span>
                            <p className="text-xl font-mono text-gray-900 mt-1">{orderNumber}</p>
                        </div>
                    )}
                    
                    <a 
                        href="/" 
                        className="w-full text-center px-6 py-3 mt-4 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-indigo-500 focus:ring-opacity-50 font-semibold"
                    >
                        Torna alla Home
                    </a>
                </div>
            </div>
        </div>
    );
}