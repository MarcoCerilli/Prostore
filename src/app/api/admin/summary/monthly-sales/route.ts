import { NextResponse } from 'next/server';
import prisma from '@/db/prisma';
import { orderStatus } from '@prisma/client';
import { auth } from '@/auth';

// Struttura aggiornata per ritornare il giorno
interface DailySale {
    day: string;
    sales: number;
}

export async function GET() {
    const session = await auth();
    
    // Protezione della rotta Admin
    if (!session || session.user.role?.toLowerCase() !== 'admin') { 
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {
        // Query RAW per PostgreSQL (Neon) per raggruppare le vendite PER GIORNO.
        const result: DailySale[] = await prisma.$queryRaw<DailySale[]>`
            SELECT
                TO_CHAR(DATE_TRUNC('day', "createdAt"), 'YYYY-MM-DD') as day, -- Modificato a 'day' e formato data completo
                CAST(SUM("totalPrice") AS REAL) as sales
            FROM "Order"
            WHERE 
                "status"::TEXT IN (${orderStatus.PAID}, ${orderStatus.DELIVERED}) -- Cast della colonna per confronto con le stringhe
            GROUP BY 1
            ORDER BY 1;
        `;
        
        // Mappa i risultati per essere compatibili con l'interfaccia SalesData del frontend,
        // rinominando 'day' in 'month' temporaneamente per coerenza con la chiave dataKey nel grafico.
        const mappedResult = result.map(item => ({
             month: item.day, // Mappiamo 'day' su 'month'
             sales: item.sales, // Manteniamo 'sales' come richiesto da SalesData del frontend
        }));

        // ✅ CORREZIONE: Restituisce mappedResult, che ha le chiavi 'month' e 'sales'
        return NextResponse.json(mappedResult, { 
            status: 200,
            headers: {
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0',
            },
        });

    } catch (error) {
        // Se la query fallisce (es. errore DB), questo blocco viene eseguito
        console.error('Error fetching daily sales data:', error);
        // È cruciale restituire una risposta JSON qui, non HTML
        return NextResponse.json({ error: 'Failed to fetch sales data' }, { status: 500 });
    }
}