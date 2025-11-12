// 📁 app/admin/orders/page.tsx


import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, Home } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableCaption, TableHeader, TableRow, TableHead, TableBody } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { FullOrderSummary } from "@/types/order"; 
import OrderSummaryCards from "@/components/admin/OrderSummaryCards";
import AdminOrderRow from "@/components/admin/AdminOrderRow"; 
import { getAllOrdersSummaryAction } from "@/lib/actions/admin.actions"; 
import SalesChart from '@/components/admin/SalesChart';





export default async function AdminOrdersPage() {
    // 1. Recupera i dati dal server
    // Il tipo FullOrderSummary[] è ora garantito corretto dopo tutte le correzioni.
    const orders: FullOrderSummary[] = await getAllOrdersSummaryAction(); 

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Gestione Ordini</h1>
                <div className="flex gap-4">
                    <Button asChild variant="outline">
                        <Link href="/">
                            <Home className="mr-2 h-4 w-4" /> 
                            Home
                        </Link>
                    </Button>
                    <Button asChild>
                        <Link href="/">
                            <Plus className="mr-2 h-4 w-4" /> 
                            Nuovo Ordine (Simulato)
                        </Link>
                    </Button>
                </div>
                {/* FINE BLOCCO PULSANTI */}
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Riepilogo Ordini ({orders.length})</CardTitle>
                    <OrderSummaryCards/>
                    <SalesChart/>
                </CardHeader>
                <CardContent>
                    {orders.length === 0 ? (
                        <p className="text-center text-gray-500 py-8">Nessun ordine trovato.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table className="min-w-full">
                                <TableCaption>Lista completa degli ordini nel sistema.</TableCaption>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[200px] text-left">Cliente</TableHead>
                                        <TableHead className="w-[150px] text-center">ID Ordine</TableHead>
                                        <TableHead className="w-[150px] text-center">Data</TableHead>
                                        <TableHead className="w-[100px] text-right">Totale</TableHead>
                                        <TableHead className="w-[150px] text-center">Stato</TableHead>
                                        <TableHead className="w-[200px] text-center">Azioni</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {/* 2. Mappa i dati per popolare la tabella */}
                                    {orders.map((order) => (
                                        <AdminOrderRow key={order.id} order={order} />
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}