import { NextResponse } from "next/server";
import prisma from "@/db/prisma";
import { orderStatus as prismaOrderStatus } from "@prisma/client"; // Import con alias
import { auth } from "@/auth";

// Struttura dei dati che il frontend si aspetta
interface GlobalSummary {
  totalSales: number;
  totalOrders: number;
  pendingOrders: number;
  shippedOrders: number;
}

/**
 * Gestisce la richiesta GET all'API /api/admin/summary/global
 * per fornire statistiche aggregate per le schede di riepilogo.
 */
export async function GET() {
  const session = await auth();

  // Protezione della rotta Admin
  if (!session || session.user.role?.toLowerCase() !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    // 1. Calcolo del totale vendite e totale ordini
    const salesStats = await prisma.order.aggregate({
      _sum: {
        totalPrice: true,
      },
      _count: {
        id: true,
      },
      where: {
        // Considera solo ordini pagati o consegnati per le vendite
        status: {
          in: [prismaOrderStatus.PAID, prismaOrderStatus.DELIVERED],
        },
      },
    });

    // DEFINIZIONE DEGLI STATI IN ATTESA
    // 🚨 CORREZIONE CRITICA: Aggiunto .filter(Boolean) per rimuovere qualsiasi valore 'undefined'
    // nel caso in cui lo stato 'PROCESSING' non sia ancora presente nel client Prisma (dopo 'prisma generate').
    const pendingStatuses = [
      prismaOrderStatus.PENDING_PAYMENT,
      prismaOrderStatus.PAID
      
        ].filter(Boolean) as prismaOrderStatus[]; // Assicura che l'array non contenga undefined

    // 2. Conteggio degli ordini in attesa (PENDING_PAYMENT o PROCESSING)
    const pendingOrdersCount = await prisma.order.count({
      where: {
        status: {
          // Uso dell'array filtrato
          in: pendingStatuses,
        },
      },
    });

    // 3. Conteggio degli ordini spediti (SHIPPED)
    const shippedOrdersCount = await prisma.order.count({
      where: {
        status: prismaOrderStatus.SHIPPED,
      },
    });

    // 4. Compilazione del risultato finale
    const summaryData: GlobalSummary = {
      // Usa ?? 0 per gestire il caso in cui _sum.totalPrice sia null (nessun ordine)
      totalSales: salesStats._sum.totalPrice
        ? salesStats._sum.totalPrice.toNumber()
        : 0,

      // Usiamo il conteggio di tutti gli ordini pagati/consegnati per il totale
      totalOrders: salesStats._count.id,

      pendingOrders: pendingOrdersCount,
      shippedOrders: shippedOrdersCount,
    };

    return NextResponse.json(summaryData, {
      status: 200,
      headers: {
        "Cache-Control":
          "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (error) {
    // La validazione di Prisma fallisce prima di questo console.error, ma lo lasciamo.
    console.error("Error fetching global summary data:", error);
    return NextResponse.json(
      { error: "Failed to fetch global summary data" },
      { status: 500 }
    );
  }
}
