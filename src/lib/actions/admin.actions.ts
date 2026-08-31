"use server"

import prisma from "@/db/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { orderStatus } from "@prisma/client";
import { OrderItem, OrderSummary, FullOrderSummary } from "@/types/order"; 
import { Decimal } from "@prisma/client/runtime/library";
import { revalidatePath } from "next/cache";

// Importa formatError o assicurati che sia accessibile
// import { formatError } from "../utils"; 

/**
 * Server Action per recuperare il riepilogo degli ordini dell'utente autenticato.
 */
export async function getMyOrdersSummaryAction(): Promise<OrderSummary[]> {
    const session = await auth();
    const userId = session?.user.id;

    if (!userId) {
        redirect("/sign-in");
    }

    try {
        // 1. Query Prisma:
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
                totalPrice: true, // Campo Decimal di Prisma
                status: true,
                OrderItem: {
                    select: {
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

        // 2. Mappatura:
        // L'errore TS(2322) è risolto assicurando che i campi mappati (totalPrice, orderStatus)
        // corrispondano ESATTAMENTE al tuo OrderSummary
        const sanitizedOrders: OrderSummary[] = orders.map((order) => ({
            id: order.id,
            orderNumber: order.orderNumber,
            createdAt: order.createdAt,
            // ✅ Usa totalPrice come richiesto dal tuo OrderSummary
            totalPrice: order.totalPrice.toNumber(),
            // ✅ Usa orderStatus come richiesto dal tuo OrderSummary
            orderStatus: order.status as orderStatus,
            // ✅ Usa status come richiesto dal tuo OrderSummary
            status: order.status, 

            user: order.user,
            orderItems: order.OrderItem.map((item) => ({
                id: item.productId, 
                name: item.name,
            })),
        }));

        return sanitizedOrders;
    } catch (error) {
        console.error("Errore nel recupero degli ordini personali:", error);
        return [];
    }
}

// -------------------------------------------------------------------------------------------------
// ✅ AZIONE ADMIN 

// Usiamo OrderQueryResult come tipo interno per garantire la corretta query di Prisma.
// Ho corretto il tipo OrderQueryResult per risolvere il secondo errore che hai segnalato.
type OrderQueryResult = {
    id: string;
    orderNumber: string | null;
    createdAt: Date;
    totalPrice: Decimal;
    status: orderStatus;
    paymentMethod: string;
    user: { id: string; name: string | null; email: string; } | null;
    OrderItem: Array<{ productId: string, name: string }>;
};

/**
 * Server Action per recuperare il riepilogo di TUTTI gli ordini per la vista Admin.
 */
export async function getAllOrdersSummaryAction(): Promise<FullOrderSummary[]> {
    const session = await auth();

    if (!session || session.user.role?.toLowerCase() !== 'admin') {
        redirect("/sign-in");
    } 

    try {
        const orders = await prisma.order.findMany({
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                orderNumber: true,
                createdAt: true,
                totalPrice: true, 
                status: true,
                paymentmethod: true, 
                user: { select: { id: true, name: true, email: true } },
                OrderItem: { select: { productId: true, name: true } },
            },
        }); 

        const sanitizedOrders: FullOrderSummary[] = orders.map((order) => ({
            id: order.id,
            orderNumber: order.orderNumber,
            createdAt: order.createdAt,
            totalPrice: order.totalPrice.toNumber(), 
            orderStatus: order.status,
            status: order.status,

            paymentMethod: order.paymentmethod,
            
            user: order.user, 
            
            orderItems: order.OrderItem.map((item) => ({
                id: item.productId, 
                name: item.name,
            })),
        }));

        return sanitizedOrders;
    } catch (error) {
        console.error("Errore nel recupero di tutti gli ordini admin:", error);
        return [];
    }
}
// ✅ elimina un ordine
export async function deleteOrderAction(orderId: string) {
  try {
    await prisma.order.delete({ where: { id: orderId } });
    revalidatePath("/dashboard/admin/orders");
    return { success: true };
  } catch (error) {
    console.error("Errore eliminazione ordine:", error);
    return { success: false, error: "Impossibile eliminare l'ordine." };
  }
}

// ✅ aggiorna lo stato dell’ordine
export async function updateOrderStatusAction(orderId: string, newStatus: string) {
  try {
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status: newStatus as orderStatus },
    });
    console.log("✅ Ordine aggiornato con successo:", updatedOrder.id, updatedOrder.status);

    revalidatePath("/dashboard/admin/orders");
    return { success: true };
  } catch (error) {
    console.error("Errore aggiornamento ordine:", error);
    return { success: false, error: "Impossibile aggiornare l'ordine." };
  }
}