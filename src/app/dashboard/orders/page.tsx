import Link from "next/link";
import {
  Clock,
  Package,
  CheckCircle,
  XCircle,
  ChevronRight,
  DollarSign,
} from "lucide-react";
import prisma from "@/db/prisma";
import DateFormatter from "@/components/DateFormatter"; // Assicurati che questo sia un Client Component ('use client')
import OrderRow from "@/components/OrderRow";
import { OrderSummary, OrderStatusProps } from "@/types/order"; // <-- NUOVA IMPORTAZIONE
import {
  Table,
  TableBody,
  TableCell, // Sostituisce <td>
  TableHead, // Sostituisce <th>
  TableHeader, // Sostituisce <thead>
  TableRow,
} from "@/components/ui/table";

const getOrders = async (): Promise<OrderSummary[]> => {
  // ... Logica DB omessa per brevità
  try {
    const orders = await prisma.order.findMany({
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        orderNumber: true,
        createdAt: true,
        totalPrice: true,
        isPaid: true,
        isDelivered: true,
        user: {
          select: {
            name: true,
          },
        },
      },
    });

    // SOLUZIONE: Mappa e converti l'oggetto Decimal in number
    const sanitizedOrders = orders.map((order) => ({
      ...order,
      totalPrice: order.totalPrice.toNumber(),
    }));
    return sanitizedOrders as unknown as OrderSummary[];
  } catch (error) {
    console.error("Errore nel recupero degli ordini da DB:", error);
    return [];
  }
};
// --- COMPONENTE PAGE (Server Component) ---

export default async function OrdersDashboardPage() {
  const orders = await getOrders();

  return (
    <main className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-extrabold text-center text-gray-900 mb-6 border-b pb-4">
          📦 Riepilogo Ordini ({orders.length})     
        </h1>
        {orders.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-xl shadow-lg border border-gray-100">
            <Package className="w-12 h-12 text-gray-400 mx-auto" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">
                 Nessun Ordine Trovato    
            </h3>
            <p className="mt-1 text-sm text-gray-500">
                 Inizia a ricevere ordini dal tuo negozio.    
            </p>
          </div>
        ) : (
         <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
    <Table className="w-full">
      <TableHeader className="bg-gray-50">
        <TableRow>
          <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ordine ID</TableHead>
          <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</TableHead>
          <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</TableHead>
          <TableHead className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Totale</TableHead>
          <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stato</TableHead>
          <TableHead className="px-6 py-3 text-right"><span className="sr-only">Dettagli</span></TableHead>
        </TableRow>
      </TableHeader><TableBody> {/* <-- ATTENZIONE: Nessuna interruzione di riga/spazio qui */}
        {orders.map((order) => (
          <OrderRow key={order.id} order={order} />
        ))}
      </TableBody>
    </Table>
  </div>
        )}
      </div>
    </main>
  );
}
