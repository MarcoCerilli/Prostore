// File: src/lib/email/index.tsx

import { Resend } from "resend";
import PurchaseReceiptEmail from "./purchase-receipt";
import { SENDER_EMAIL, APP_NAME } from "../constants";
import { Order } from "@/types";

console.log(
    "Resend API Key Status:", 
    process.env.RESEND_API_KEY ? "CARICATA (OK)" : "MANCANTE (ERRORE)"
);

const resend = new Resend(process.env.RESEND_API_KEY as string);

export const sendPurchaseReceiptEmail = async ({ order }: { order: Order }) => {
    // 🛑 AGGIUNGI IL CONTROLLO DI NULLITÀ PIÙ RIGOROSO
    if (!order || !order.user || !order.user.email) {
        console.error(`❌ INVIO SALTATO: Ordine ${order?.id ?? 'Sconosciuto'} non contiene un utente o un'email valida. Dati order:`, order);
        return; 
    }
    
    // LOG DI CHIAMATA (ora è sicuro che order.user.email esiste)
    console.log(`ATTEMPT: Invio email per Ordine ${order.id} a ${order.user.email}`);
    
    try {
        const { data, error } = await resend.emails.send({
            from: `${APP_NAME} <${SENDER_EMAIL}>`,
            to: order.user.email,
            subject: `Order Confirmation ${order.id}`,
            react: <PurchaseReceiptEmail order={order} />,
        });

        // LOG DI SUCCESSO
        if (data) {
             console.log("✅ Resend OK. Email ID:", data.id);
        }

        // LOG DI ERRORE RESEND (se Resend risponde con errore senza throware)
        if (error) {
             console.error("❌ ERRORE RESTITUITO DA RESEND (Errore 4xx):", error);
             throw new Error(JSON.stringify(error));
        }

    } catch (error) {
        // LOG DI ERRORE HTTP/Configurazione
        console.error("❌ ERRORE CRITICO (Rete/Configurazione/SDK):", error);
        throw error;
    }
};