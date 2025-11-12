// src/app/api/admin/monthly-sales/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/db/prisma';
import { orderStatus } from '@prisma/client';
import { auth } from '@/auth';


//Struttura aggiornata per ritornare il gionro
interface DailySale {
    day: string;
    sales: number;
}

export async function GET(request: Request) {
    const session = await auth();

    if (!session || session.user.role !== 'admin') { 
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {
        // Query RAW per PostgreSQL (Neon) per raggruppare le vendite per mese
        const result: DailySale[] = await prisma.$queryRaw<DailySale[]>`
            SELECT
                TO_CHAR(DATE_TRUNC('day', "createdAt"), 'YYYY-MM--DD') as day,
                CAST(SUM("totalPrice") AS REAL) as sales
            FROM "Order"
            WHERE 
                "status"::TEXT IN (${orderStatus.PAID}, ${orderStatus.DELIVERED}) -- Solo vendite confermate
            GROUP BY 1
            ORDER BY 1;
        `;

        //Mappiamo i risultati per essere compatibili con l'interfaccia MonthlySale
        const mappedResult =  result.map(item => ({
            month: item.day,  //Mappiamo 'day' su 'month' per ora
            totalSales: item.sales,
            totalOrders: 0, //Placeholder, in questo esempio stiamo aggregando solo le vendite
        }));

        // L'output sarà: [{ month: '2025-10', sales: 1200.50 }, { month: '2025-11', sales: 638.11 }, ...]
        
        return NextResponse.json(result, { status: 200 });

    } catch (error) {
        console.error('Error fetching daily sales data:', error);
        return NextResponse.json({ error: 'Failed to fetch sales data' }, { status: 500 });
    }
}