import z from "zod";
import {
  insertProductschema,
  insertCartSchema,
  cartItemSchema, // Non usato direttamente, ma importante per Zod
  shippingAddressSchema,
  insertOrderItemSchema,
  insertOrderSchema,
  OrderItemSchema,
  paymentResultSchema,
} from "@/lib/validators";
import { OrderItem } from "./order";
import { insertReviewSchema } from "@/lib/validators";
// -----------------------------------------------------------
// 1. Tipi per i prodotti e gli articoli del carrello
// -----------------------------------------------------------

export type Product = z.infer<typeof insertProductschema> & {
  id: string;
  rating: number;
  createdAt: Date;
  price: number;
};

// ✅ TIPO 1: Backend / Database Item (usato nelle Server Actions e in Cart)
export type BackendCartItem = {
  productId: string; // ID prodotto (usato per il DB/Actions)
  qty: number; // Quantità (usata per il DB/Actions)
  price: number; // Prezzo numerico (per i calcoli del server)
  name: string;
  slug: string;
  image: string;
};

// ✅ TIPO 2: Frontend Item / Output del useMemo (usato in CheckoutSummary e per PayPal)
// Questo tipo è l'output pulito che hai creato nel useMemo.
export type CartItemFrontend = {
  productId: string;
  id: string; // Mappato da productId
  name: string;
  price: number;
  quantity: number; // Mappato da qty
  slug: string;
  image: string;
};

// -----------------------------------------------------------
// 2. Tipi Carrello e Indirizzo
// -----------------------------------------------------------

export type Cart = z.infer<typeof insertCartSchema> & {
  id: string;
  createdAt: Date;
  userId?: string;
  itemsPrice: number;
  totalPrice: number;
  shippingPrice: number;
  taxPrice: number; // ✅ CORREZIONE: Ora Cart contiene i BackendCartItem (attenzione alle minuscole/maiuscole)
  items: BackendCartItem[];
};

// Assumiamo che shippingAddressSchema derivi da Zod e includa 'phoneNumber'
export type shippingAddress = z.infer<typeof shippingAddressSchema> & {
  phoneNumber: string;
  houseNumber: string;
  postalCode: string;
};

export const PAYMENT_METHODS = process.env.PAYMENT_METHODS
  ? process.env.PAYMENT_METHODS.split(", ")
  : ["Paypal", "Stripe", "Contrassegno"];
export const DEFAULT_PAYMENT_METHOD =
  process.env.DEFAULT_PAYMENT_METHOD || "Paypal";

export type OrderStatus =
  | "CREATED"
  | "PENDING_PAYMENT"
  | "PAID"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

export type Order = z.infer<typeof insertOrderSchema> & {
  id: string;
  createdAt: Date;
  paidAt: Date | null;
  deliveredAt: Date | null;
  status: OrderStatus;
  orderItems: OrderItem[];
  user: { name: string; email: string };
};
// Tipo payload per la Server Action (Order creation)
export interface CheckoutPayload {
  cartId: string;
  userId?: string;
  shippingAddress: {
    name: string;
    street: string;
    houseNumber: string;
    city: string;
    zip: string;
    country: string;
  };
  items: CartItemFrontend[];
  paymentmethod: string; // Dati finanziari
  itemsPrice: number;
  shippingPrice: number;
  taxPrice: number;
  totalPrice: number;
}

export type paymentResult = z.infer<typeof paymentResultSchema>;

export type Review = z.infer<typeof insertReviewSchema> & {
  id: string;
  createdAt: Date;
  user?: { name: string };
};
