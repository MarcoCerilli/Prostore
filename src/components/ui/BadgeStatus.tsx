// 📁 components/ui/BadgeStatus.tsx
// Client Component per la gestione dinamica del colore del badge
"use client";

import { orderStatus } from "@prisma/client"; 
import { Badge } from "@/components/ui/badge"; 
import React from "react"; // Necessario se si usa React.FC

// Definiamo un tipo per la configurazione dello stile
type StatusConfig = { 
    text: string; 
    className: string; 
};

// Mappa lo stato dell'ordine ai colori Tailwind. 
const statusMap = {
    // STATI STANDARD
    PENDING: {
        text: "In Attesa",
        className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900 dark:text-yellow-300",
    },
    PROCESSING: {
        text: "In Lavorazione",
        className: "bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300",
    },
    SHIPPED: {
        text: "Spedito",
        className: "bg-indigo-100 text-indigo-800 hover:bg-indigo-200 dark:bg-indigo-900 dark:text-indigo-300",
    },
    DELIVERED: {
        text: "Consegnato",
        className: "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-300",
    },
    CANCELLED: {
        text: "Annullato",
        className: "bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900 dark:text-red-300",
    },
    
    // STATI AGGIUNTI PER RISOLVERE L'ERRORE TS2352 (mancanti nel file precedente)
    PENDING_PAYMENT: {
        text: "Pagamento Pendente",
        className: "bg-orange-100 text-orange-800 hover:bg-orange-200 dark:bg-orange-900 dark:text-orange-300",
    },
    PAID: {
        text: "Pagato",
        className: "bg-cyan-100 text-cyan-800 hover:bg-cyan-200 dark:bg-cyan-900 dark:text-cyan-300",
    },
    
} as Record<orderStatus, StatusConfig>; 

interface BadgeStatusProps {
    // Usiamo l'enum di Prisma per la tipizzazione rigorosa
    status: orderStatus;
}

const BadgeStatus: React.FC<BadgeStatusProps> = ({ status }) => {
    // Tenta di trovare la configurazione. Se non la trova, usa un default.
    // ⭐ FIX TIPIZZAZIONE: Usiamo String() per convertire esplicitamente l'enum
    // in una stringa nel blocco di fallback, soddisfacendo così TypeScript.
    const config = statusMap[status] || {
        text: String(status), 
        className: "bg-gray-100 text-gray-800",
    };

    return (
        <Badge className={`uppercase text-xs font-semibold px-2 py-0.5 rounded-full ${config.className}`}>
            {config.text}
        </Badge>
    );
};

export default BadgeStatus;