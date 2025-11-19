// File: /lib/actions/review.actions.ts

"use server";

import { insertReviewSchema } from "@/lib/validators"; 
import prisma from "@/db/prisma"; 
import { auth } from "@/auth";
import { revalidatePath } from "next/cache"; 
import z from "zod";
import { reviewQuerySelect } from "@/types/review.types";
import { ReviewWithUser } from "@/types/review.types";

/**
 * 1. Recupera le recensioni per un prodotto (Video 142)
 */
export async function getReviewsByProductId(productId: string) {
    // ... (funzione fetch invariata)
    return await prisma.review.findMany({
        where: { productId },
        select: reviewQuerySelect,
        orderBy: {
            createdAt: "desc",
        },
    });
}

/**
 * 2. Crea/Aggiorna una recensione (Video 140)
 */
export async function createOrUpdateReview(formData: FormData) {
    const reviewActionSchema = insertReviewSchema.extend({
        slug: z.string(), 
    });

    const session = await auth(); 
    const authenticatedUserId = session?.user?.id; 

    // ⭐ DEBUG 1: Tracciamento Autenticazione
    console.log("SERVER-SIDE: User ID:", authenticatedUserId); 

    if (!authenticatedUserId) {
        return { success: false, message: "Autenticazione richiesta" };
    }

    // Mappatura esplicita di FormData prima della parsificazione Zod
    // Lasciamo i valori grezzi (stringa) perché usiamo z.coerce.number()
    const dataToParse = {
        title: formData.get("title"),
        description: formData.get("description"),
        rating: formData.get("rating"), 
        productId: formData.get("productId"),
        slug: formData.get("slug"),
    };

    // ⭐ DEBUG 2: Dati Ricevuti dal Client
    console.log("--- DEBUG: DATI RICEVUTI ---");
    console.log(dataToParse); 
    console.log("----------------------------");

    // Parsificazione dei dati del form
    const parsed = reviewActionSchema.safeParse(dataToParse);

    if (!parsed.success) {
        // ⭐ DEBUG 3: Dettagli Errore Zod (se fallisce)
        const fieldErrors = parsed.error.flatten().fieldErrors;
        console.log("--- DEBUG: ERRORE ZOD ---");
        console.log(fieldErrors);
        console.log("-------------------------");
        
        return {
            success: false,
            message: "Dati non validi",
            errors: fieldErrors,
        };
    }

    // Estraiamo i dati validati
    const { title, description, rating, productId, slug } = parsed.data; 

    try {
        // Controlla se l'utente ha già recensito questo prodotto
        const existingReview = await prisma.review.findUnique({
            where: {
                productId_userId: {
                    userId: authenticatedUserId, 
                    productId: productId,
                },
            },
            select: { id: true, title: true, description: true, rating: true },
        });

        if (existingReview) {
            // AGGIORNA
            await prisma.review.update({
                where: { id: existingReview.id },
                data: { title, description, rating },
            });
            
            // ⭐ DEBUG 4a: Successo Aggiornamento
            console.log("SERVER-SIDE: Recensione AGGIORNATA (ID:", existingReview.id, ")");
            revalidatePath(`/product/${slug}`);
            console.log("SERVER-SIDE: Cache revalidata per:", slug);
            
            return { success: true, message: "Recensione aggiornata con successo!" };
        } else {
            // CREA
            const newReview = await prisma.review.create({
                data: {
                    title,
                    description,
                    rating,
                    productId,
                    userId: authenticatedUserId, 
                },
            });
            
            // ⭐ DEBUG 4b: Successo Creazione
            console.log("SERVER-SIDE: Recensione CREATA (ID:", newReview.id, ")");
            revalidatePath(`/product/${slug}`); 
            console.log("SERVER-SIDE: Cache revalidata per:", slug);

            return { success: true, message: "Recensione inviata con successo!" };
        }
    } catch (error) {
        // ⭐ DEBUG 5: Errore Database
        console.error("SERVER-SIDE: Errore nel salvataggio della recensione (Prisma):", error);
        
        return {
            success: false,
            message: "Errore interno del server durante il salvataggio.",
        };
    }
}