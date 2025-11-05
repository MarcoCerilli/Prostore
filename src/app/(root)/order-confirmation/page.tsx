"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import React, { useEffect, useState } from "react";

/**
 * Questo componente funge da pagina di conferma dell'ordine.
 * Usa useSearchParams per estrarre l'orderId dall'URL di query (es: ?orderId=ORD-123).
 *
 * NOTA BENE: Questo è un componente CLIENTE ("use client") necessario per usare gli hooks di Next.js come useSearchParams.
 */
export default function OrderConfirmationPage() { // <-- Questo è il componente che viene esportato
    const searchParams = useSearchParams();
    const [orderId, setOrderId] = useState<string | null>(null);

    // Effettua l'estrazione dell'ID dell'ordine al caricamento
    useEffect(() => {
        const id = searchParams.get("orderId");
        setOrderId(id);

        if (!id) {
            console.error("ID Ordine non trovato nell'URL.");
        }
    }, [searchParams]);

    // Caso: ID Ordine mancante (Errore o navigazione diretta senza query)
    if (!orderId) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 bg-gray-50 text-center">
                <div className="text-4xl text-red-500 mb-4">⚠️</div>
                <h1 className="text-3xl font-bold mb-2 text-red-700">ID Ordine Non Valido o Mancante</h1>
                <p className="text-gray-600 mb-6 max-w-sm">
                    Non è stato possibile elaborare la richiesta. Assicurati di aver seguito il link di conferma corretto.
                </p>
                <Link href="/" className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition">
                    Torna alla Home
                </Link>
            </div>
        );
    }

    // Caso: ID Ordine trovato (Successo)
    return (
        <div className="max-w-xl mx-auto my-12 p-8 bg-white rounded-xl shadow-2xl border border-green-200">
            <div className="text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 text-green-600 mb-6 shadow-lg">
                    {/* Icona di spunta (Successo) */}
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                </div>
                <h1 className="text-4xl font-extrabold text-gray-800 mb-4">Ordine Ricevuto!</h1>
                <p className="text-lg text-gray-600 mb-8">
                    La tua transazione è stata completata con successo.
                </p>
                
                <div className="p-4 bg-green-50 rounded-lg mb-8 border border-green-300">
                    <p className="text-sm font-semibold text-green-700 uppercase tracking-wider">ID Ordine:</p>
                    <p className="text-2xl font-bold text-green-800 break-all select-all">{orderId}</p>
                </div>
                
                <div className="flex flex-col md:flex-row justify-center gap-4">
                    <Link href={`/dashboard/orders/${orderId}`} passHref>
                        <button className="w-full md:w-auto px-6 py-3 bg-indigo-600 text-white font-semibold rounded-full hover:bg-indigo-700 transition duration-300 shadow-md">
                            Visualizza Dettagli
                        </button>
                    </Link>
                    <Link href="/" passHref>
                        <button className="w-full md:w-auto px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-full hover:bg-gray-100 transition duration-300 mt-3 md:mt-0">
                            Continua lo Shopping
                        </button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
