import { notFound, redirect } from "next/navigation";
import { Suspense } from 'react';
// ⚠️ Assicurati che questo percorso e l'azione siano corretti!
import { getPaymentIntentStatusAction } from "@/lib/actions/user.actions"; 
import { CheckCircle, XCircle, Loader } from 'lucide-react'; 

// * DEFINIZIONE DEI TIPI (dovrebbero essere definiti nel file delle actions) *
interface PaymentStatus {
    status: 'SUCCESS' | 'FAILURE' | 'PENDING' | 'LOADING' | 'ERROR';
    message: string;
    orderNumber: string;
    paymentIntentId: string;
}

interface SuccessPageProps {
    params: {
        orderId: string; // Il numero d'ordine
    };
    searchParams: {
        payment_intent_client_secret?: string; // Chiave di verifica passata da Stripe
        redirect_status?: 'succeeded' | 'processing' | 'requires_payment_method';
    };
}

/**
 * Componente Server che recupera e mostra lo stato del pagamento
 * (Chiamato all'interno di Suspense)
 */
async function PaymentStatusDisplay({ orderId, clientSecret, redirectStatus }: { 
    orderId: string, 
    clientSecret?: string, 
    redirectStatus?: string 
}) {

    let statusResult: PaymentStatus;

    if (!clientSecret) {
        statusResult = {
            status: 'ERROR', // Più specifico di FAILURE
            message: "Manca il segreto di pagamento necessario per la verifica. Riprova dalla pagina dell'ordine.",
            orderNumber: orderId,
            paymentIntentId: 'N/A'
        };
    } else {
        // CHIAMATA CRITICA ALLA SERVER ACTION
        statusResult = await getPaymentIntentStatusAction(orderId, clientSecret, redirectStatus || 'N/A');
    }

    const { status, message, orderNumber } = statusResult;
    
    let icon, colorClass, title;

    switch (status) {
        case 'SUCCESS':
            icon = <CheckCircle className="w-16 h-16 text-white" />;
            colorClass = "bg-green-500";
            title = "Pagamento Riuscito!";
            break;
        case 'PENDING':
            icon = <Loader className="w-16 h-16 text-white animate-spin" />;
            colorClass = "bg-yellow-500";
            title = "Pagamento in Elaborazione";
            break;
        case 'FAILURE':
        case 'ERROR': // Gestiamo anche lo stato di errore generico qui
        default:
            icon = <XCircle className="w-16 h-16 text-white" />;
            colorClass = "bg-red-500";
            title = "Pagamento Fallito o Errore";
            break;
    }

    return (
        <div className="flex flex-col items-center justify-center p-8 bg-white rounded-xl shadow-2xl max-w-lg w-full">
            <div className={`p-4 rounded-full ${colorClass} mb-6`}>
                {icon}
            </div>
            <h1 className="text-3xl font-bold mb-4 text-gray-800">{title}</h1>
            <p className="text-lg text-center mb-6 text-gray-600">{message}</p>
            
            <div className="text-sm text-gray-500 mb-6">
                <p>Numero Ordine: <span className="font-semibold">{orderNumber}</span></p>
            </div>
            
            <a 
                href={`/order/${orderNumber}`} 
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-6 rounded-lg transition duration-300 shadow-md"
            >
                Vai ai Dettagli Ordine
            </a>
        </div>
    );
}

/**
 * Pagina Server Component principale
 */
export default function PaymentSuccessPage({
    params,
    searchParams,
}: SuccessPageProps) {
    
    const { orderId } = params;
    const { payment_intent_client_secret, redirect_status } = searchParams;

    if (!orderId) {
        return notFound();
    }
    
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
            <Suspense fallback={
                <div className="flex flex-col items-center p-8 bg-white rounded-xl shadow-2xl max-w-lg w-full">
                    <Loader className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
                    <p className="text-lg text-gray-600">Verifica dello stato del pagamento...</p>
                </div>
            }>
                <PaymentStatusDisplay 
                    orderId={orderId} 
                    clientSecret={payment_intent_client_secret}
                    redirectStatus={redirect_status}
                />
            </Suspense>
        </div>
    );
}