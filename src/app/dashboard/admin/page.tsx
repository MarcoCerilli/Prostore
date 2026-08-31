import React from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"; 
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import OrderSummaryCards from "@/components/admin/OrderSummaryCards";
import SalesChart from "@/components/admin/SalesChart";
import prisma from "@/db/prisma";
import { formatCurrency, formatId } from "@/lib/utils";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Plus, ArrowRight, AlertTriangle, Package, Users, ShoppingBag } from "lucide-react";

export const metadata = {
  title: "Dashboard Amministrativa | ModernStore",
};

export default async function AdminOverviewPage() {
  // 1. Fetch recent 5 orders
  const recentOrders = await prisma.order.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { name: true, email: true } },
    },
  });

  // 2. Fetch low-stock products (stock <= 5)
  const lowStockProducts = await prisma.product.findMany({
    where: { stock: { lte: 5 } },
    take: 5,
    orderBy: { stock: "asc" },
    select: {
      id: true,
      name: true,
      category: true,
      stock: true,
      price: true,
    },
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header Dashboard */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Amministrativa</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Panoramica delle vendite, ordini recenti e inventario in tempo reale.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm" className="bg-indigo-600 hover:bg-indigo-700">
            <Link href="/dashboard/admin/products/create">
              <Plus className="mr-1.5 h-4 w-4" /> Nuovo Prodotto
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/admin/orders">
              <ShoppingBag className="mr-1.5 h-4 w-4" /> Ordini
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/admin/users">
              <Users className="mr-1.5 h-4 w-4" /> Utenti
            </Link>
          </Button>
        </div>
      </div>

      {/* 1. SEZIONE RIEPILOGO METRICHE */}
      <section>
        <OrderSummaryCards />
      </section>

      {/* 2. SEZIONE GRAFICO VENDITE */}
      <section>
        <Card className="shadow-sm">
          <CardHeader className="py-4">
            <CardTitle className="text-lg font-semibold flex items-center justify-between">
              <span>Andamento Vendite Giornaliere</span>
              <span className="text-xs font-normal text-muted-foreground">Aggiornato in tempo reale</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SalesChart />
          </CardContent>
        </Card>
      </section>

      {/* 3. SEZIONE TABELLA ORDINI RECENTI & STATO INVENTARIO */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 3A. Ultimi Ordini Recenti */}
        <Card className="shadow-sm">
          <CardHeader className="py-4 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Package className="h-4 w-4 text-indigo-600" />
              Ultimi Ordini Recenti
            </CardTitle>
            <Button asChild variant="ghost" size="sm" className="text-xs text-indigo-600 hover:text-indigo-700">
              <Link href="/dashboard/admin/orders" className="flex items-center gap-1">
                Tutti <ArrowRight className="h-3 w-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {recentOrders.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">Nessun ordine registrato.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Codice</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Totale</TableHead>
                      <TableHead>Stato</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-mono text-xs font-medium">
                          {order.orderNumber || formatId(order.id)}
                        </TableCell>
                        <TableCell className="text-sm">
                          {order.user?.name || order.user?.email || "Ospite"}
                        </TableCell>
                        <TableCell className="font-semibold text-sm">
                          {formatCurrency(Number(order.totalPrice))}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              order.status === "PAID" || order.status === "DELIVERED"
                                ? "default"
                                : order.status === "CANCELLED"
                                ? "destructive"
                                : "secondary"
                            }
                            className="text-[11px]"
                          >
                            {order.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 3B. Inventario & Prodotti in Esaurimento */}
        <Card className="shadow-sm">
          <CardHeader className="py-4 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Allerte Scorte & Bassa Giacenza
            </CardTitle>
            <Button asChild variant="ghost" size="sm" className="text-xs text-indigo-600 hover:text-indigo-700">
              <Link href="/dashboard/admin/products" className="flex items-center gap-1">
                Prodotti <ArrowRight className="h-3 w-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {lowStockProducts.length === 0 ? (
              <p className="text-center text-sm text-green-600 py-8">Tutti i prodotti sono ben riforniti!</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Prodotto</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead className="text-center">Giacenza</TableHead>
                      <TableHead className="text-right">Azione</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lowStockProducts.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium text-sm max-w-[150px] truncate">
                          {product.name}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {product.category}
                        </TableCell>
                        <TableCell className="text-center">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                              product.stock === 0
                                ? "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
                                : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                            }`}
                          >
                            {product.stock === 0 ? "Esaurito" : `${product.stock} rimasti`}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button asChild size="sm" variant="ghost" className="text-xs text-indigo-600">
                            <Link href={`/dashboard/admin/products/${product.id}`}>
                              Modifica
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}