"use client";

import { Button } from "@/components/ui/button";
import { CartItem } from "@/types";
import { useRouter } from "next/navigation";
import { Plus, Minus, Trash, ShoppingCart, Loader } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { useState, useTransition } from "react";
// Importa le Server Actions
import { addItemToCart, removeItemFromCart } from "@/lib/actions/cart.actions";

// -----------------------------------------------------------
// Tipi e Definizioni
// -----------------------------------------------------------

type CleanCart = {
  id: string;
  createdAt: string;
  userId: string | null;
  sessionCartId: string;
  items: CartItem[];
  itemsPrice: number;
  totalPrice: number;
  shippingPrice: number;
  taxPrice: number;
} | null;

type ActionResponse = {
  success: boolean;
  message: string;
  newQty?: number;
};
type FallbackActionResponse =
  | ActionResponse
  | { success: boolean; message: Promise<any> };

// -----------------------------------------------------------
// Componente principale: AddToCart
// -----------------------------------------------------------

const AddToCart = ({ cart, item }: { cart?: CleanCart; item: CartItem }) => {
  const router = useRouter();
  const { toast } = useToast();

  const [isPending, startTransition] = useTransition();

  const cartItems: CartItem[] = cart?.items || [];
  const existItem = cartItems.find((x) => x.productId === item.productId);
  const currentQty = existItem?.qty || 0; // Quantità PRIMA dell'azione

  /**
   * Gestisce l'aggiunta o la modifica della quantità.
   * @param actionType 'add' | 'decrement' | 'delete'
   * @param targetQty Solo per 'set', 'add', 'remove'. (Rimosso 'set' per coerenza con le azioni)
   */
  const handleCartAction = async (
    actionType: "add" | "decrement" | "delete",
    targetQty?: number // Non usato in 'add'/'decrement'/'delete' ma lasciato per flessibilità
  ) => {
    startTransition(async () => {
      let res: FallbackActionResponse;
      let finalQty = currentQty; // La quantità prevista dopo l'azione

      if (actionType === "add") {
        res = await addItemToCart({ ...item, qty: 1 });
        finalQty += 1; // Prevediamo un incremento di 1
      } else if (actionType === "decrement") {
        res = await removeItemFromCart(item.productId);
        finalQty = Math.max(0, finalQty - 1); // Prevediamo un decremento di 1 (min 0)
      } else if (actionType === "delete") {
        // Passiamo l'intera quantità corrente (currentQty) per forzare la rimozione totale.
        res = await removeItemFromCart(item.productId, currentQty);
        finalQty = 0; // Prevediamo che la quantità finale sia 0
      } else {
        // Blocco logico non raggiungibile con i tipi definiti, ma gestiamo l'errore se si dovesse estendere
        toast({
          variant: "destructive",
          description: "Azione carrello non valida.",
        });
        return;
      }

      if (!res.success) {
        toast({
          variant: "destructive",
          description: String(res.message),
        });
        return;
      }

      // IMPORTANTE: Forziamo il refresh dopo il successo
      router.refresh();

      // -----------------------------------------------------------
      // ✅ FIX: Logica del Toast Semplificata e più Precisa
      // -----------------------------------------------------------

      const isInitialAdd = actionType === "add" && currentQty === 0;
      const isTotalRemoval = finalQty === 0;

      if (isTotalRemoval) {
        // Si verifica se: actionType='delete', oppure actionType='decrement' e currentQty era 1
        toast({ description: `${item.name} rimosso dal carrello.` });
      } else if (isInitialAdd) {
        // L'aggiunta iniziale ha avuto successo
        toast({ description: `${item.name} aggiunto al carrello.` });
      } else {
        // Incremento/Decremento parziale
        toast({
          description: `${item.name} aggiornato (x${finalQty})`,
          action: (
            <ToastAction
              className="bg-gray-900 text-white hover:bg-gray-800 rounded-full font-semibold px-3 py-1"
              altText="Vai al carrello"
              onClick={() => router.push("/cart")}
            >
              Vai al Carrello
            </ToastAction>
          ),
        });
      }
    });
  };

  // -----------------------------------------------------------
  // Render
  // -----------------------------------------------------------

  // Funzione helper per mostrare il Loader o l'icona
  const getButtonIcon = (IconComponent: React.ElementType) => {
    if (isPending) {
      // Mostra l'icona Loader animata solo se l'azione è in corso
      return <Loader className="h-4 w-4 animate-spin" />;
    }
    // Altrimenti, mostra l'icona normale
    return <IconComponent className="h-4 w-4" />;
  };

  // Se l'articolo è nel carrello (e la quantità è > 0), mostra i controlli di quantità
  if (existItem && currentQty > 0) {
    return (
      // Contenitore principale: flex-row, spaziatura tra il gruppo controlli e il cestino
      <div className="flex items-center w-full mt-4 h-10">
        {/* GRUPPO DI CONTROLLO UNIFICATO: [-] [QTY] [+] */}
        <div className="flex items-center mx-4 h-full border border-input rounded-lg overflow-hidden">
          {/* Pulsante Decremento (-) */}
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => handleCartAction("decrement")}
            disabled={isPending}
            className="w-10 h-full p-0 flex-shrink-0 rounded-r-none border-r-0"
          >
            {getButtonIcon(Minus)} {/* ⬅️ Icona dinamica */}
          </Button>

          {/* Display Quantità Corrente */}
          <div
            className="
                    text-center font-semibold text-base 
                    flex-shrink-0 w-10 
                    bg-background dark:bg-gray-800 
                    h-full flex items-center justify-center border-y-0 border-x
                "
          >
            {currentQty}
          </div>

          {/* Pulsante Incremento (+) */}
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => handleCartAction("add")}
            disabled={isPending}
            className="w-10 h-full p-0 flex-shrink-0 rounded-l-none border-l-0"
          >
            {getButtonIcon(Plus)} {/* ⬅️ Icona dinamica */}
          </Button>
        </div>

        {/* PULSANTE RIMUOVI (CESTINO) */}
        <Button
          onClick={() => handleCartAction("delete")}
          disabled={isPending}
          variant="destructive"
          size="icon"
          title="Rimuovi completamente dal carrello"
          className="flex-shrink-0 w-10 h-10 rounded-lg"
        >
          {getButtonIcon(Trash)} {/* ⬅️ Icona dinamica */}
        </Button>
      </div>
    );
  }

  // Se l'articolo NON è nel carrello, mostra il pulsante "Aggiungi al Carrello" a larghezza intera
  return (
    <Button
      className="w-full h-10 bg-gray-900 text-white hover:bg-gray-800 dark:bg-gray-900 dark:hover:bg-gray-800"
      type="button"
      onClick={() => handleCartAction("add")} // Aggiungi 1 al carrello
      disabled={isPending}
    >
      {/* ⬅️ Icona dinamica per il bottone principale con testo */}
      {isPending ? (
        <Loader className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <ShoppingCart className="mr-2 h-4 w-4" />
      )}
      {isPending ? "Aggiunta..." : "Aggiungi al Carrello"}
    </Button>
  );
};

export default AddToCart;
