"use client";

import { useTransition, useState } from "react";
import { FullOrderSummary } from "@/types/order";
import { TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Trash2, CheckCircle, Clock, Package, XCircle } from "lucide-react";
import { orderStatus } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

import {
  deleteOrderAction,
  updateOrderStatusAction,
} from "@/lib/actions/admin.actions";

interface AdminOrderRowProps {
  order: FullOrderSummary;
}

// --- Stato → Mappa per colori e icone ---
const statusMap = {
  [orderStatus.PENDING_PAYMENT]: {
    icon: Clock,
    color: "text-yellow-800 bg-yellow-100",
    text: "In Attesa di Pagamento",
    badgeVariant: "secondary" as const,
  },
  [orderStatus.PAID]: {
    icon: CheckCircle,
    color: "text-blue-800 bg-blue-100",
    text: "Pagato",
    badgeVariant: "default" as const,
  },
  [orderStatus.SHIPPED]: {
    icon: Package,
    color: "text-purple-800 bg-purple-100",
    text: "Spedito",
    badgeVariant: "default" as const,
  },
  [orderStatus.DELIVERED]: {
    icon: CheckCircle,
    color: "text-green-800 bg-green-100",
    text: "Consegnato",
    badgeVariant: "default" as const,
  },
  [orderStatus.CANCELLED]: {
    icon: XCircle,
    color: "text-red-800 bg-red-100",
    text: "Annullato",
    badgeVariant: "destructive" as const,
  },
};

type OrderStatusKey = keyof typeof statusMap;

const getStatusDisplay = (status: orderStatus) => {
  const key = status as OrderStatusKey;
  return statusMap[key] || statusMap[orderStatus.PENDING_PAYMENT];
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(
    amount
  );

const formatDate = (dateString: Date) =>
  new Date(dateString).toLocaleDateString("it-IT", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

export default function AdminOrderRow({ order }: AdminOrderRowProps) {
  const [isPending, startTransition] = useTransition();
  const [currentStatus, setCurrentStatus] = useState<orderStatus>(order.status);

  const customerName = order.user?.name || "Ospite / N/A";
  const customerEmail = order.user?.email || "Non Registrato";
  const isCOD = order.paymentMethod === "COD";

  const statusDisplay = getStatusDisplay(currentStatus);
  const StatusIcon = statusDisplay.icon;

  const handleStatusChange = (newStatus: string) => {
    startTransition(async () => {
      setCurrentStatus(newStatus as orderStatus);
      const res = await updateOrderStatusAction(order.id, newStatus);
      if (!res?.success) {
        alert("❌ Errore durante l'aggiornamento");
        setCurrentStatus(order.status);
      }
    });
  };

  return (
    <TableRow className="hover:bg-gray-50 transition-colors">
      {/* Cliente */}
      <TableCell className="font-medium">
        <p className="font-semibold text-gray-900">{customerName}</p>
        <p className="text-sm text-gray-500">{customerEmail}</p>
      </TableCell>

      {/* ID Ordine */}
      <TableCell className="font-mono text-xs text-gray-600">
        {order.id.substring(0, 8)}...
      </TableCell>

      {/* Data */}
      <TableCell className="text-sm text-gray-500">
        {formatDate(order.createdAt)}
      </TableCell>

      {/* Totale */}
      <TableCell className="text-right font-bold text-gray-900">
        {formatCurrency(order.totalPrice)}
      </TableCell>

      <TableCell className="text-center align-middle">
  <div className="flex flex-col items-center justify-center space-y-2">
    {/* 🟢 Badge Stato */}
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${statusDisplay.color}`}
    >
      <StatusIcon className="w-3 h-3 mr-1.5" />
      {statusDisplay.text}
    </span>

    {/* 🔵 Select Stato */}
    <Select
      defaultValue={order.status}
      onValueChange={handleStatusChange}
      disabled={isPending}
    >
      <SelectTrigger className="w-[180px] h-8 text-xs border-gray-300 hover:border-gray-400 focus:ring-1 focus:ring-gray-400">
        <SelectValue placeholder="Cambia stato" />
      </SelectTrigger>
      <SelectContent className="text-sm">
        {Object.entries(statusMap).map(([key, info]) => (
          <SelectItem key={key} value={key}>
            {info.text}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
</TableCell>



      {/* Azioni */}
      <TableCell className="text-center">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              size="icon"
              variant="destructive"
              className="h-8 w-8 hover:scale-105 transition-transform"
              disabled={isPending}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Conferma eliminazione</AlertDialogTitle>
              <AlertDialogDescription>
                Sei sicuro di voler eliminare questo ordine? L’operazione è
                irreversibile.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annulla</AlertDialogCancel>
              <AlertDialogAction
                onClick={() =>
                  startTransition(async () => {
                    await deleteOrderAction(order.id);
                  })
                }
              >
                Elimina
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </TableCell>
    </TableRow>
  );
}
