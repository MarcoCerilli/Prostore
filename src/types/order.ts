// src/types/order.ts (File dei Tipi)

// Usiamo gli import per la definizione Zod solo per i tipi.
import { insertOrderItemSchema } from "@/lib/validators";
import z from "zod";

// --- Tipi di Base ---

// 1. TIPO PRINCIPALE PER L'ARTICOLO ORDINE
export type OrderItem = z.infer<typeof insertOrderItemSchema> & {
  // Aggiungi campi che sono nel DB ma non nello schema di inserimento (es. ID)
  id: string;
  // Aggiungi qui anche 'price', 'quantity' (o 'qty') se sono nel tuo schema DB
  // Ad esempio, se nel DB c'è quantity, aggiorna la definizione:
  // price: number;
  // quantity: number;
};

// --- Tipi per l'UI/API ---

// 2. TIPO PER IL RIEPILOGO DEGLI ORDINI (LISTA)
export type OrderSummary = {
  orderStatus: any;
  id: string;
  orderNumber: string;
  createdAt: Date;
  totalPrice: number; // Viene convertito da Decimal a number
  status: string;
  // Usa Pick sull'OrderItem appena definito per il riepilogo
  orderItems: Pick<OrderItem, "id" | "name">[] 
  user: {
    name: string | null;
  } | null;
};

// 3. TIPO PER IL DETTAGLIO ORDINE (CONTENENTE TUTTI I CAMPI)
export type OrderWithItems = {
  id: string;
  orderNumber: string;
  createdAt: Date;
  totalPrice: number;
  status: string;
  user: { name: string | null };
  
  itemsPrice: number;
  shippingPrice: number;
  taxPrice: number;
  
  // Articoli completi
  orderItems: OrderItem[]; 
}

// Nota: Dovresti aggiungere qui anche il tipo `OrderStatus` se non è già altrove.
// export type OrderStatus = "PENDING_PAYMENT" | "PAID" | ...;