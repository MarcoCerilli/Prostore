"use client";
import {
  CheckCircle,
  ChevronRight,
  Clock,
  Package,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "lucide-react";
import DateFormatter from "./DateFormatter";
import { OrderSummary } from "@/types/order";
import { TableCell,TableRow } from "./ui/table";


// Mappa lo stato per l'interfaccia utente
const statusMap = {
  "In elaborazione": {
    icon: Clock,
    color: "text-yellow-600 bg-yellow-100",
    text: "In Elaborazione",
  },
  Spedito: {
    icon: Package,
    color: "text-blue-600 bg-blue-100",
    text: "Spedito",
  },
  Consegnato: {
    icon: CheckCircle,
    color: "text-green-600 bg-green-100",
    text: "Consegnato",
  },
  Annullato: {
    icon: XCircle,
    color: "text-red-600 bg-red-100",
    text: "Annullato",
  },
};

const getStatus = (order: Pick<OrderSummary, "isDelivered" | "isPaid">) => {
  if (order.isDelivered) {
    return statusMap["Consegnato"];
  } else if (order.isPaid) {
    return statusMap["Spedito"];
  } else {
    return statusMap["In elaborazione"];
  }
};

// --- RIEPILOGO COMPONENTE OrderRow.tsx (Celle Dati) ---
export default function OrderRow({ order }: { order: OrderSummary }) {
  const currentStatus = getStatus(order);

  return (
  <TableRow key={order.id} className="hover:bg-gray-50">
      <TableCell className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-600">{order.orderNumber}</TableCell><TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.user.name || "Ospite/Non specificato"}</TableCell><TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"><DateFormatter date={order.createdAt} /></TableCell><TableCell className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-right text-green-700">€ {order.totalPrice.toFixed(2)}</TableCell><TableCell className="px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex items-center px-3 py-0.5 rounded-full text-xs font-medium ${currentStatus.color}`}>
          <currentStatus.icon className="w-3 h-3 mr-1.5" />
          {currentStatus.text}
        </span>
      </TableCell><TableCell className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <Link href={`/dashboard/orders/${order.orderNumber}`} className="text-indigo-600 hover:text-indigo-900 flex items-center justify-end">
          Dettagli
          <ChevronRight className="w-4 h-4 ml-1" />
        </Link>
      </TableCell>
    </TableRow>
  );
}