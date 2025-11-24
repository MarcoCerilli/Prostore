"use server";

import prisma from "@/db/prisma";
import { revalidatePath } from "next/cache";
import { orderStatus } from "@prisma/client";

export async function deleteOrderAction(orderId: string) {
  try {
    await prisma.order.delete({ where: { id: orderId } });
    revalidatePath("/admin/orders");
    return { success: true };
  } catch (error) {
    console.error("Errore eliminazione ordine:", error);
    return { success: false, error: "Impossibile eliminare l'ordine." };
  }
}

export async function updateOrderStatusAction(orderId: string, newStatus: string) {
  try {
    await prisma.order.update({
      where: { id: orderId },
      data: { status: newStatus as orderStatus },
    });
    revalidatePath("/admin/orders");
    return { success: true };
  } catch (error) {
    console.error("Errore aggiornamento ordine:", error);
    return { success: false, error: "Impossibile aggiornare l'ordine." };
  }
}
