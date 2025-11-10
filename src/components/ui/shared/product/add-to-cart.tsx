"use client";

import { Button } from "@/components/ui/button";
// ✅ Corretto: importiamo il tipo esatto che usi
import { CartItemFrontend, BackendCartItem } from "@/types";
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
  sessionCartId: string; // ✅ Corretto: L'array del carrello usa la tipizzazione Frontend
  items: CartItemFrontend[];
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

// ✅ Corretto: Tipizzazione per le props
const AddToCart = ({
  cart,
  item,
}: {
  cart?: CleanCart;
  item: CartItemFrontend;
}) => {

    // ⭐ AGGIUNGI QUESTO BLOCCO DI VALIDAZIONE IMMEDIATA
  if (!item.id) {
    // Questo significa che la pagina madre non ha passato l'ID del prodotto corretto!
    console.error("ERRORE CRITICO: Componente AddToCart non ha ricevuto item.id.");
    // Potresti voler reindirizzare o mostrare un messaggio di errore all'utente.
    return <div className="text-red-500 text-center">ID Prodotto mancante.</div>;
  }
  // FINE BLOCCO DI VALIDAZIONE



  const router = useRouter();
  const { toast } = useToast();

  const [isPending, startTransition] = useTransition();

  const cartItems: CartItemFrontend[] = cart?.items || []; 
  const existItem = cartItems.find((x) => x.id === item.id); 
  const currentQty = existItem?.quantity || 0; /**
   * Gestisce l'aggiunta o la modifica della quantità.
   */

  const handleCartAction = async (
    actionType: "add" | "decrement" | "delete",
    targetQty?: number
  ) => {
    startTransition(async () => {
      let res: FallbackActionResponse;
      let finalQty = currentQty;

      if (actionType === "add") {
        // ⭐️ Mappatura cruciale: conversione da CartItemFrontend a BackendCartItem
        const backendItem: BackendCartItem = {
          productId: item.id, // Mappa 'id' (frontend) a 'productId' (backend)
          name: item.name, // Presume che price sia una stringa formattata, quindi deve essere parsata
          price: parseFloat(String(item.price).replace("€", "").replace(",", ".")),
          qty: 1, // Aggiungiamo 1 alla volta
          slug: item.slug,
          image: item.image,
        };
        res = await addItemToCart(backendItem);
        finalQty += 1;
      } else if (actionType === "decrement") {
        // ✅ Corretto: usa item.id come productId per la Server Action
        res = await removeItemFromCart(item.id);
        finalQty = Math.max(0, finalQty - 1);
      } else if (actionType === "delete") {
        // ✅ Corretto: usa item.id e la quantità corrente per la Server Action
        res = await removeItemFromCart(item.id, currentQty);
        finalQty = 0;
      } else {
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

      router.refresh(); // -----------------------------------------------------------
      // ✅ LOGICA TOAST UNIFORMATA (Stile Nero)
      // -----------------------------------------------------------

      const isInitialAdd = actionType === "add" && currentQty === 0;
      const isTotalRemoval = finalQty === 0;

      if (isTotalRemoval) {
        toast({ description: `${item.name} rimosso dal carrello.` });
      } else if (isInitialAdd) {
        // Aggiunta iniziale: mostriamo il pulsante VAI AL CARRELLO
        toast({
          description: `${item.name} aggiunto al carrello.`,
          action: (
            <ToastAction // 🎨 Stile NERO unificato
             className="bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg font-semibold px-3 py-1"
              altText="Vai al carrello"
              onClick={() => router.push("/cart")}
            >
                            <ShoppingCart className="h-4 w-4 mr-1" /> Vai al
              Carrello            {" "}
            </ToastAction>
          ),
          duration: 8000,
        });
      } else {
        // Incremento/Decremento: mostriamo solo la notifica di aggiornamento
        toast({
          description: `${item.name} aggiornato (x${finalQty})`,
        });
      }
    });
  }; // -----------------------------------------------------------
  // Render (resta invariato ma usa currentQty)
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
className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
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
