import React from 'react';
import { getMyOrdersSummaryAction } from '@/lib/actions/user.actions';
import { formatCurrency, formatOrderDate } from '@/lib/utils'; // Assumi queste utility
import Link from 'next/link';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge'; // Assumi un componente Badge
import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';
import { BackButton } from '@/components/ui/shared/BackButton';

// Mappa lo stato dell'ordine ad uno stile visivo
const getStatusBadge = (status: string) => {
    switch (status) {
        case 'PAID':
            return <Badge variant="default" className="bg-green-600">Pagato</Badge>;
        case 'PENDING_PAYMENT':
            return <Badge variant="secondary" className="bg-yellow-500">In Attesa di Pagamento</Badge>;
        case 'SHIPPED':
            return <Badge variant="default" className="bg-blue-600">Spedito</Badge>;
        case 'DELIVERED':
            return <Badge variant="default" className="bg-emerald-600">Consegnato</Badge>;
        case 'CANCELLED':
            return <Badge variant="destructive">Annullato</Badge>;
        default:
            return <Badge variant="outline">{status}</Badge>;
    }
};


export default async function OrdersPage() {
    // ⭐ 1. Chiama la Server Action (Server-Side)
    const orders = await getMyOrdersSummaryAction();

    return (
        <div className="space-y-8 p-4 md:p-8">
              {/* 1. Intestazione e Link */}
                <div className="mb-8 flex justify-between items-center border-b pb-4">
                    {/* BackButton dovrebbe portare alla pagina /dashboard/profile */}
                    <BackButton /> 
                    <Button asChild variant="link" className="text-sm text-gray-600 hover:text-indigo-600 p-0 h-auto">
                        <Link href="/">
                            <span className="flex items-center gap-2"> 
                                Home 
                                <Home className="h-4 w-4" /> 
                            </span>
                        </Link>
                    </Button>
                </div>
            <h2 className="text-3xl font-bold text-center">Storico Ordini 📦</h2>
            <p className="text-gray-600 text-center">Visualizza e monitora i tuoi ordini recenti.</p>

            {/* 2. Lista ordini */}
            {orders.length === 0 ? (
                <div className="text-center p-10 border rounded-lg bg-gray-50">
                    <p className="text-lg font-medium">Non hai ancora effettuato ordini.</p>
                    <Link href="/" className="text-blue-600 hover:underline mt-2 inline-block">
                        Inizia lo shopping
                    </Link>
                </div>
            ) : (
                <div className="space-y-4">
                    {orders.map((order) => (
                        <Link 
                            key={order.orderNumber} 
                            href={`/dashboard/orders/${order.orderNumber}`} 
                            className="block p-4 border rounded-lg shadow-sm hover:shadow-md transition-shadow bg-white"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                    {/* Immagine di anteprima */}
                                    <Image
                                        src={order.mainImage}
                                        alt={`Prodotto ${order.orderNumber}`}
                                        width={60}
                                        height={60}
                                        className="rounded-md object-cover"
                                    />
                                    <div>
                                        <p className="font-semibold text-lg text-gray-800">Ordine {order.orderNumber}</p>
                                        <p className="text-sm text-gray-500">
                                            Data: {formatOrderDate(order.createdAt)} 
                                        </p>
                                    </div>
                                </div>
                                
                                <div className="flex flex-col items-end space-y-1">
                                    {getStatusBadge(order.status)}
                                    <p className="text-xl font-bold">
                                        {formatCurrency(order.totalPrice)} 
                                    </p>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}