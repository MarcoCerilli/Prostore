'use client';

import { PayPalScriptProvider, type ReactPayPalScriptOptions } from "@paypal/react-paypal-js";
import React from 'react';

// ⬇️ Configurazione Script Options per PayPal
const paypalScriptOptions: ReactPayPalScriptOptions = {
    // IMPORTANTE: Utilizziamo NEXT_PUBLIC_ per rendere la variabile accessibile al client.
    // Usiamo 'sb' (sandbox) come fallback solo se stiamo debbugando.
    clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || 'sb', 
    currency: 'EUR', // Assicurati che questa sia la tua valuta corretta
    intent: 'capture',
    components: 'buttons',
    // Puoi aggiungere altri parametri qui se necessario
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