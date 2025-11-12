import prisma from "@/db/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { OrderItem, OrderSummary } from "@/types/order";
import { orderStatus } from "@prisma/client";

// Importa formatError o assicurati che sia accessibile
// Se non è nello stesso file, l'importazione è necessaria
// import { formatError } from "../utils"; 

/**
 * Server Action per recuperare il riepilogo degli ordini dell'utente autenticato.
 */
export async function getMyOrdersSummaryAction(): Promise<OrderSummary[]> {
  const session = await auth();
  const userId = session?.user.id;

  if (!userId) {
    redirect("/login");
  }

  try {
    // 1. Query Prisma: Selezioniamo solo i campi necessari e puliamo le ambiguità.
    const orders = await prisma.order.findMany({
      where: {
        userId: userId,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        orderNumber: true,
        createdAt: true,
        totalPrice: true,
        // ⭐ CORREZIONE: Usiamo solo 'status' per lo stato dell'ordine.
        status: true,
        OrderItem: {
          select: {
            // I campi interni che ci servono per OrderSummary
            productId: true, 
            name: true,
          },
        },
        user: {
          select: {
            name: true,
          },
        },
      },
    }); 

    // 2. Mappatura: Convertiamo i tipi e mappiamo i nomi.
    const sanitizedOrders: OrderSummary[] = orders.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      createdAt: order.createdAt,
      totalPrice: order.totalPrice.toNumber(),
      orderStatus: order.status as orderStatus,
      status: order.status as orderStatus,

      user: order.user,
      orderItems: order.OrderItem.map((item) => ({
        id: item.productId, 
        name: item.name,
      })) as Pick<OrderItem, "id" | "name">[],
    }));

    return sanitizedOrders;
  } catch (error) {
    console.error("Errore nel recupero degli ordini personali:", error);
    return [];
  }
}

