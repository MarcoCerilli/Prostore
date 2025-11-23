import Link from "next/link";
import { Package, Home } from "lucide-react";
import { Button } from "@/components/ui/button"; 
// ⭐ Assumi che BackButton e i tipi siano disponibili
import { BackButton } from "@/components/ui/shared/BackButton"; 
import OrderRow from "@/components/OrderRow";
import { OrderSummary } from "@/types/order"; 
import { getMyOrdersSummaryAction } from "@/lib/actions/order.actions";
import {
  Table,
  TableBody,
  TableHead, 
  TableHeader, 
  TableRow,
  TableCell, // Per l'intestazione se la usi
} from "@/components/ui/table";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function MyOrdersPage() {
    // 1. Recupera i dati filtrati per l'utente loggato
    const orders: OrderSummary[] = await getMyOrdersSummaryAction(); 

    return (
        <main className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto">
                
                {/* 1. Intestazione e Link */}
                <div className="mb-8 flex justify-between items-center border-b pb-4">
                    {/* BackButton dovrebbe portare alla pagina /dashboard/profile */}
                    <BackButton /> 
                    <Button asChild variant="link" className="text-sm text-gray-600 hover:text-indigo-600 p-0 h-auto">
                        <Link href="/">
                            <span className="flex items-center gap-2 mr-6"> 
                                Home 
                                <Home className="h-4 w-4" /> 
                            </span>
                        </Link>
                    </Button>
                </div>
                
                <h1 className="text-3xl font-extrabold text-gray-900 mb-6 text-center">
                    📦 I Tuoi Ordini ({orders.length})
                </h1>
                
                {orders.length === 0 ? (
                    // 2. Stato vuoto
                    <div className="text-center py-12 bg-white rounded-xl shadow-lg border border-gray-100">
                        <Package className="w-12 h-12 text-gray-400 mx-auto" />
                        <h3 className="mt-4 text-xl font-semibold text-gray-900">
                            Nessun Ordine Trovato
                        </h3>
                        <p className="mt-1 text-base text-gray-500">
                            Non hai ancora effettuato un acquisto.
                        </p>
                    </div>
                ) : (
                    // 3. Tabella degli ordini
                    <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                        <Table className="w-full">
                            <TableHeader className="bg-gray-50">
                                <TableRow>
                                    <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Ordine ID
                                    </TableHead>
                                    <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Data
                                    </TableHead>
                                    <TableHead className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Totale
                                    </TableHead>
                                    <TableHead className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Stato
                                    </TableHead>
                                    <TableHead className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Dettagli Ordine
                                    </TableHead>
                                    <TableHead className="px-6 py-3">
                                        <span className="sr-only">Dettagli</span>
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {orders.map((order) => (
                                    <OrderRow 
                                        key={order.id} 
                                        order={order} 
                                        isUserView={true} 
                                    />
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </div>
        </main>
    );
}