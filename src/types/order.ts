// Non ha bisogno di 'use client'

export type OrderSummary = {
  id: string;
  orderNumber: string;
  createdAt: Date;
  totalPrice: number;
  isPaid: boolean;
  isDelivered: boolean;
  user: {
    name: string | null;
  };
};

// Se lo ritieni utile, puoi anche esportare i tipi derivati qui
export type OrderStatusProps = Pick<OrderSummary, "isDelivered" | "isPaid">;