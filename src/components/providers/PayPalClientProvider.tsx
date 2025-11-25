'use client';

import { PayPalScriptProvider, type ReactPayPalScriptOptions } from "@paypal/react-paypal-js";
import React from 'react';

// ⬇️ Configurazione Script Options per PayPal
const paypalScriptOptions: ReactPayPalScriptOptions = {
    // 🛑 Modifica temporanea: Forziamo l'uso del Client ID di test 'sb'
    // Se questa soluzione funziona, il problema è nella variabile d'ambiente NEXT_PUBLIC_PAYPAL_CLIENT_ID
    clientId: 'sb', 
    currency: 'EUR', 
    intent: 'capture',
    components: 'buttons',
    // Manteniamo le opzioni di ambiente come sicurezza
    'data-environment': 'sandbox', 
    'data-api-stage-host': 'https://www.sandbox.paypal.com', 
    // Opzionale: aggiunge metadati di integrazione
    'data-sdk-integration-source': 'integration-builder',
};

// ⬇️ Controllo di sicurezza per il Client ID
if (paypalScriptOptions.clientId === 'sb') {
    console.warn(
        "ATTENZIONE: Stai usando l'ID cliente Sandbox ('sb'). Assicurati di impostare la variabile d'ambiente NEXT_PUBLIC_PAYPAL_CLIENT_ID nel tuo file .env."
    );
}

export default function PayPalClientProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <PayPalScriptProvider options={paypalScriptOptions}>
            {children}
        </PayPalScriptProvider>
    );
}