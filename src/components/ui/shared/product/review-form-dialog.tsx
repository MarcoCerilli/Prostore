// File: /components/ui/shared/product/review-form-dialog.tsx
"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
// Rimosso 'Resolver' dall'import
import { ControllerRenderProps, useForm, FieldValues } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
// Assumi che in validators.ts sia stato corretto: rating usa z.number() e non z.coerce.number()
import { insertReviewSchema } from "@/lib/validators";
import { reviewFormDefaultValues } from "@/lib/constants";
import { Star } from "lucide-react";
import { ReviewWithUser } from "@/types/review.types";

import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { createOrUpdateReview } from "@/lib/actions/review.actions";

// Schema Zod esteso per il Resolver (deve includere tutti i campi usati in FormValues)
const formResolverSchema = insertReviewSchema.extend({
  slug: z.string(),
  userId: z.string().optional(),
});

// Tipo esteso per useForm (include i campi extra necessari per il form/Server Action)
// ⭐ CORREZIONE ts(2558): Inferenza diretta dallo schema risolto
type FormValues = z.infer<typeof formResolverSchema> & FieldValues;

interface ReviewFormDialogProps {
  productSlug: string;
  productId: string;
  userId: string; // ID dell'utente loggato
  // defaultReview deve corrispondere al tipo di insertReviewSchema + id
  defaultReview?: z.infer<typeof insertReviewSchema> & { id: string };
  onSuccess: () => void;
}

// 1. Tipizzazione corretta per StarInput
interface StarInputProps {
  // Specifica il tipo esatto del form e il campo che stai gestendo
  field: ControllerRenderProps<FormValues, "rating">;
}

const StarInput = ({ field }: StarInputProps) => (
  <div className="flex space-x-1">
    {Array.from({ length: 5 }).map((_, index) => {
      const ratingValue = index + 1;
      return (
        <Star
          key={ratingValue}
          className={`w-6 h-6 cursor-pointer ${
            ratingValue <= field.value
              ? "text-yellow-500 fill-yellow-500"
              : "text-gray-300"
          }`}
          onClick={() => field.onChange(ratingValue)}
        />
      );
    })}
  </div>
);

export const ReviewFormDialog = ({
  productId,
  productSlug,
  userId,
  defaultReview,
  onSuccess,
}: ReviewFormDialogProps) => {
  const isEditing = !!defaultReview;
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    // ⭐ SOLUZIONE DEFINITIVA: Castiamo lo schema stesso a 'any'
    // Questo bypassa completamente il check di compatibilità dell'overload.
    resolver: zodResolver(formResolverSchema as any),
    defaultValues: defaultReview
      ? {
          ...defaultReview,
          slug: productSlug,
          userId: userId,
        }
      : {
          // Mappiamo i campi e forniamo tutti i default richiesti
          title: (reviewFormDefaultValues as any).title || "",
          rating: (reviewFormDefaultValues as any).rating || 0,
          productId: productId,
          userId: userId,
          slug: productSlug,
        },
  }) as any;

  // 3. onSubmit converte l'oggetto RHF in FormData per la Server Action
  const onSubmit = async (data: FormValues) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
        if(key !== 'userId')
      formData.append(key, String(value));
    });
    const result = await createOrUpdateReview(formData);

    if (result.success) {
      toast({ description: result.message, variant: "default" });
      onSuccess();
      setIsOpen(false);
    } else {
      toast({
        description: result.message || "Invio fallito. Controlla i dati.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant={isEditing ? "outline" : "default" }>
          {isEditing ? "Modifica Recensione" : "Scrivi una Recensione"}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Modifica la Tua Recensione" : "Scrivi una Recensione"}
          </DialogTitle>

          <DialogDescription>
            Condividi la tua opinione su questo prodotto.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form // ⭐ CORREZIONE FINALE: Rimuoviamo l'argomento di tipo e usiamo il cast 'as any' sulla funzione onSubmit
            onSubmit={form.handleSubmit(onSubmit as any)}
            className="space-y-4 py-4"
          >
            {/* CAMP I NASCOSTI */}
            <input type="hidden" {...form.register("productId")} />
            <input type="hidden" {...form.register("slug")} />
            <input type="hidden" {...form.register("userId")} />
            {/* Campo Voto (Rating) */}

            <FormField<FormValues, "rating"> // 1. Forza il tipo qui per risolvere l'errore 'name'
              control={form.control as any} // 2. Mantiene il cast per l'errore di incompatibilità Control<FormValues>
              name="rating"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Voto</FormLabel>
                  <FormControl>
                    <StarInput field={field as any} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* Campo Titolo */}

            <FormField<FormValues, "title">
              control={form.control as any}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Titolo</FormLabel>
                  <FormControl>
                    <Input placeholder="Ottimo prodotto!" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* Campo Commento/Descrizione */}

            <FormField<FormValues, "description">
              control={form.control as any}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Commento</FormLabel>

                  <FormControl>
                    <Textarea
                      placeholder="Scrivi i dettagli della tua esperienza..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {isEditing ? "Aggiorna Recensione" : "Invia Recensione"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
