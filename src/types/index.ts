// src/types/index.ts
import z from "zod";
import {
  insertProductschema,
  insertCartSchema,
  cartItemSchema,
  shippingAddressSchema,
  insertOrderItemSchema,
  insertOrderSchema,
  OrderItemSchema,
} from "@/lib/validators";

// -----------------------------------------------------------
// 1. Tipi per i prodotti e gli articoli del carrello
// -----------------------------------------------------------

export type Product = z.infer<typeof insertProductschema> & {
  id: string; // manteniamo l Id perche nn è presente nello schema
  rating: number;
  createdAt: Date;
  price: number;
};

// Tipo Articolo Carrello (già corretto basato su Zod)
export type CartItem = z.infer<typeof cartItemSchema>;

// -----------------------------------------------------------
// 2. Tipo Carrello (Correzione del conflitto)
// -----------------------------------------------------------

// Estendiamo il tipo derivato da Zod con i campi gestiti dal database
export type Cart = z.infer<typeof insertCartSchema> & {
  id: string; // Aggiunto: ID generato dal DB
  createdAt: Date; // Aggiunto: Timestamp del DB
  userId?: string;
  itemsPrice: number;
  totalPrice: number;
  shippingPrice: number;
  taxPrice: number;
};

export type shippingAddress = z.infer<typeof shippingAddressSchema>;

export const PAYMENT_METHODS = process.env.PAYMENT_METHODS
  ? process.env.PAYMENT_METHODS.split(", ")
  : ["Paypal", "Stripe", "Contrassegno"];
export const DEFAULT_PAYMENT_METHOD =
  process.env.DEFAULT_PAYMENT_METHOD || "Paypal";


  export type  OrderItem = z.infer<typeof insertOrderItemSchema>;
    export type Order = z.infer<typeof insertOrderSchema> & {
        id: string;
        createdAt: Date;
        isPaid: boolean;
        paidAt: Date | null;
        isDelivered: Boolean;
        deliveredAt: Date | null;
        orderItems: OrderItem[]
        user: {name: string; email: string}
 }
// Aggiungi questo tipo accanto agli altri tuoi tipi (CartItem, Cart)
export interface CheckoutPayload {
    cartId: string; // L'ID del carrello esistente nel DB
    userId?: string; // L'ID dell'utente (opzionale)
    shippingAddress: { // Struttura dell'indirizzo che hai in Order.shippingAddress
        name: string;
        street: string;
        city: string;
        zip: string;
        country: string;
    };
    paymentmethod: string;
    // Non devi passare i prezzi totali se sono già nel carrello, 
    // ma li usiamo per chiarezza
    itemsPrice: number;
    shippingPrice: number;
    taxPrice: number;
    totalPrice: number;
}

