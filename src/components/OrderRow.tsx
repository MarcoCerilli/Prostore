"use client";
import {
  CheckCircle,
  ChevronRight,
  Clock,
  Package,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import DateFormatter from "./DateFormatter";
// Assumi che OrderSummary sia definito in @/types/order
import { OrderSummary } from "@/types/order";
import { TableCell, TableRow } from "./ui/table";

// --- Tipi per le Props ---
interface OrderRowProps {
  order: OrderSummary;
  isUserView: boolean;
}

// --- 1. Mappatura dello Stato (Status Map) ---
const statusMap = {
  PENDING_PAYMENT: {
    // In attesa di pagamento
    icon: Clock,
    color: "text-yellow-600 bg-yellow-100",
    text: "In Attesa di Pagamento",
  },
  PAID: {
    // Pagato con successo
    icon: CheckCircle,
    color: "text-blue-600 bg-blue-100",
    text: "Pagato",
  },
  SHIPPED: {
    // Ordine spedito
    icon: Package,
    color: "text-purple-600 bg-purple-100",
    text: "Spedito",
  },
  DELIVERED: {
    // Ordine consegnato
    icon: CheckCircle,
    color: "text-green-600 bg-green-100",
    text: "Consegnato",
  },
  CANCELLED: {
    // Ordine annullato
    icon: XCircle,
    color: "text-red-600 bg-red-100",
    text: "Annullato",
  },
};

// --- 2. Funzione per determinare lo Stato Corretto ---
const getStatus = (order: OrderSummary) => {
  const orderStatusKey = order.status as keyof typeof statusMap;

  if (orderStatusKey && statusMap[orderStatusKey]) {
    return statusMap[orderStatusKey];
  }

  return statusMap["PENDING_PAYMENT"]; // Fallback
};

// --- 3. Componente Principale OrderRow ---
export default function OrderRow({ order, isUserView }: OrderRowProps) {
  const currentStatus = getStatus(order);

  // Imposta il percorso del link
  const linkPath = isUserView
    ? `/dashboard/profile/orders/${order.id}`
    : `/dashboard/orders/${order.id}`;

  return (
    <TableRow key={order.id} className="hover:bg-gray-50">
      <TableCell className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-600">
        {order.orderNumber}
      </TableCell>
      {/* Mostra il nome dell'utente solo in vista Admin */}
      {!isUserView && (
        <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
          {order.user?.name || "Ospite/Non specificato"}
        </TableCell>
      )}
      <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        <DateFormatter date={order.createdAt} />
      </TableCell>
      <TableCell className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-right text-green-700">
        € {order.totalPrice.toFixed(2)}
      </TableCell>
      <TableCell className="px-6 py-4 whitespace-nowrap text-center">
        <span
          className={`inline-flex items-center px-3 py-0.5 rounded-full text-xs font-medium ${currentStatus.color}`}
        >
          <currentStatus.icon className="w-3 h-3 mr-1.5" />
          {currentStatus.text}
        </span>
      </TableCell>
      {/* Colonna Dettagli */}
      <TableCell className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
        <Link
          href={linkPath}
          className="text-indigo-600 hover:text-indigo-900 flex items-center justify-center " // Manca justify-center qui
        >
          Dettagli
          <ChevronRight className="w-4 h-4 ml-1" />
        </Link>
      </TableCell>
    </TableRow>
  );
}
