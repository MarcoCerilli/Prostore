// File: /app/(root)/product/[slug]/review-list.tsx
"use client";

import { useEffect, useState, useTransition } from "react";
import { ReviewFormDialog } from "@/components/ui/shared/product/review-form-dialog";
import { getReviewsByProductId } from "@/lib/actions/review.actions";
import { ReviewWithUser } from "@/types/review.types";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Star } from "lucide-react";
import Rating from "@/components/ui/rating";

const ReviewCard = ({ review }: { review: ReviewWithUser }) => (
  <div className="p-4 border border-gray-100 rounded-lg shadow-sm">
    {/* 1. SEZIONE TITOLO E VOTO (Allineamento orizzontale) */}
    <div className="flex items-center justify-between border-b pb-2 mb-2">
      {/* ⭐ Bordo e padding per separare dal testo ⭐ */}
      {/* Titolo */}
      <div className="font-bold text-lg text-gray-800">{review.title}</div>
      {/* Voto (Componente Rating importato) */}
      <Rating value={review.rating} />
    </div>

    {/* 2. DESCRIZIONE (Corpo della recensione) */}
    {/* ⭐ Margine per separare dai metadati ⭐ */}
    <p className="text-sm text-gray-600 italic mb-3">{review.description}</p>

    {/* 3. METADATI (Informazioni Utente/Data) */}
    <div className="text-xs p-2 mr-4 text-gray-400">
      Pubblicato da
      <span className="p-2 font-medium text-gray-700">
        {review.user?.name || "Utente Sconosciuto"}
      </span>
      il {new Date(review.createdAt).toLocaleDateString("it-IT")}
    </div>
  </div>
);

const ReviewList = ({
  userId,
  productId,
  productSlug,
}: {
  userId: string;
  productId: string;
  productSlug: string;
}) => {
  const [reviews, setReviews] = useState<ReviewWithUser[]>([]);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  // *Assumiamo che userId corrisponda a r.userId* (Correzione rispetto al tuo commento)
  const userReview = reviews.find((r) => r.userId === userId);

  const fetchReviews = () => {
    startTransition(async () => {
      try {
        const data = await getReviewsByProductId(productId);
        setReviews(data);
      } catch (error) {
        toast({
          variant: "destructive",
          description: "Errore nel caricamento delle recensioni.",
        });
      }
    });
  };

  useEffect(() => {
    fetchReviews();
  }, [productId]);

  // ⭐ CORREZIONE PRINCIPALE: Mappatura dell'oggetto userReview per il FormDialog
  const mappedUserReview = userReview
    ? {
        id: userReview.id,
        title: userReview.title,
        // Il DB ora restituisce 'description', mappiamo 'description' su 'description'
        description: userReview.description,
        rating: userReview.rating,
        productId: userReview.productId,
        userId: userReview.userId,
      }
    : undefined;

  if (isPending && reviews.length === 0) {
    return (
      <div className="flex justify-center items-center h-48">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center border-b pb-4">
        <h2 className="text-xl font-bold text-gray-800">
          Recensioni ({reviews.length})
        </h2>
        {/* Form Trigger */}
        {userId && (
          <ReviewFormDialog
            productId={productId}
            productSlug={productSlug}
            userId={userId}
            // Usa l'oggetto mappato
            defaultReview={mappedUserReview}
            onSuccess={fetchReviews}
          />
        )}
      </div>

      {/* Sezione Recensione Utente (In cima) */}
      {userReview && (
        <div className="border-2 border-indigo-200 p-4 rounded-lg bg-indigo-50">
          <h3 className="font-bold text-indigo-700 mb-2">La Tua Recensione</h3>
          <ReviewCard review={userReview} />
        </div>
      )}

      {/* Lista di tutte le recensioni */}
      <div className="grid gap-6">
        {reviews
          .filter((r) => r.id !== userReview?.id) // Esclude la recensione dell'utente dalla lista principale
          .map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
      </div>

      {reviews.length === 0 && !isPending && (
        <p className="text-center text-gray-500">
          Non ci sono ancora recensioni per questo prodotto. Sii il primo!
        </p>
      )}
    </div>
  );
};

export default ReviewList;
