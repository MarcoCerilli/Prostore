import { NextResponse, NextRequest } from "next/server";
import prisma from "@/db/prisma";
import { orderStatus } from "@prisma/client";

// L'interfaccia Context è stata rimossa per risolvere il conflitto.

// Definiamo il tipo previsto per i parametri di rotta
type RouteParams = { params: { id: string } };

// Funzione DELETE: Usa NextRequest e il cast 'as any' per il contesto
export async function DELETE(
  request: NextRequest, 
  context: any // ✅ SOLUZIONE: Usiamo 'any' per il contesto esterno per soddisfare Next.js
) {
  // Tipizzazione interna per sicurezza
  const { id } = (context as RouteParams).params; 
  
  try {
    await prisma.order.delete({ where: { id: id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting order:', error);
    return NextResponse.json(
      { success: false, error: "Errore eliminazione" },
      { status: 500 }
    );
  }
}

// Funzione PATCH: Usa NextRequest e il cast 'as any' per il contesto
export async function PATCH(
  request: NextRequest, 
  context: any // ✅ SOLUZIONE: Usiamo 'any' per il contesto esterno per soddisfare Next.js
): Promise<NextResponse<{ success: boolean } | { success: boolean; error: string }>> {
  
  // Tipizzazione interna per sicurezza
  const { id } = (context as RouteParams).params;
  
  try {
    const { newStatus } = await request.json();
    
    await prisma.order.update({
      where: { id: id },
      data: { status: newStatus as orderStatus },
    });

    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Error updating order status:', error);
    return NextResponse.json(
      { success: false, error: "Errore aggiornamento" },
      { status: 500 }
    );
  }
}