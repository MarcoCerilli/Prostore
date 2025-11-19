// File: /lib/types/review.types.ts (NUOVO FILE - SENZA "use server")
import { Prisma } from "@prisma/client";

// Tipo per l'output della query, che include i dati dell'utente
export const reviewQuerySelect = {
  id: true,
  title: true,
  description: true, // (Corretto in precedenza)
  rating: true,
  createdAt: true,
  productId: true,
  userId: true,
  user: {
    select: {
      id: true,
      name: true,
      image: true, 
    },
  },
};

// Tipo di recensione arricchito per il frontend
// ⭐ Nota: La funzione getReviewsByProductId deve essere importata per dedurre il tipo
export type ReviewWithUser = Prisma.reviewGetPayload<{
  select: typeof reviewQuerySelect;
}>