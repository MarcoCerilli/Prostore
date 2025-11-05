"use client";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useTransition } from "react";
// Importiamo entrambe le azioni
import { addItemToCart, removeItemFromCart } from "@/lib/actions/cart.actions";
import Link from "next/link";
import Image from "next/image";
// Icona Trash2 per la rimozione completa
import { ArrowRight, Loader, Minus, Plus, Trash2 } from "lucide-react"; 
import { Cart, CartItem } from "@/types"; // Importo anche CartItem per la tipizzazione
import { formatCurrency } from "@/lib/utils";

// -----------------------------------------------------------------
// NUOVO COMPONENTE: Pulsante di Rimozione Completa (Sfrutta removeItemFromCart)
// -----------------------------------------------------------------

const RemoveItemButton = ({ item }: { item: CartItem }) => {
    const router = useRouter();
    const { toast } = useToast();
    // Usiamo useTransition per mostrare lo stato di caricamento sul pulsante
    const [isPending, startTransition] = useTransition();

    const handleRemoveAll = () => {
        // Usiamo 'confirm' come richiesto, ricordando che nei progetti reali sarebbe un modale custom
        if (!confirm(`Sei sicuro di voler rimuovere tutte le ${item.qty} unità di ${item.name} dal carrello?`)) {
            return;
        }

        startTransition(async () => {
            // 💡 CHIAMATA ALLA SERVER ACTION PER RIMOZIONE TOTALE
            // Passiamo l'ID del prodotto e la sua QUANTITÀ ATTUALE
            const res = await removeItemFromCart(item.productId, item.qty);

            if (!res.success) {
                toast({ variant: "destructive", description: res.message });
                return;
            }

            toast({ description: `${item.name} rimosso completamente dal carrello.` });
            router.refresh(); // Forza l'aggiornamento della pagina
        })
    }

    return (
        <button
            type="button"
            onClick={handleRemoveAll}
            aria-label={`Rimuovi completamente ${item.name}`}
            className="p-2 border rounded-full text-red-600 hover:bg-red-50 transition disabled:opacity-50"
            disabled={isPending}
        >
            {isPending ? (
                <Loader className="h-4 w-4 animate-spin" />
            ) : (
                <Trash2 className="h-4 w-4" />
            )}
        </button>
    )
}

// -----------------------------------------------------------------
// COMPONENTE INTERNO: Controlli di Quantità (Gestisce l'interazione)
// -----------------------------------------------------------------

const AddToCartControls = ({
    item,
}: {
    item: CartItem;
}) => {
    const router = useRouter();
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();

    // Funzione: Gestisce l'aggiunta di un articolo (incremento Qty)
    const handleAdd = () => {
        startTransition(async () => {
            const res = await addItemToCart({ ...item, qty: 1 });

            if (!res.success) {
                toast({ variant: "destructive", description: res.message });
                return;
            }
            router.refresh();
        });
    };

    // Funzione: Gestisce la rimozione o il decremento di un articolo
    const handleRemove = () => {
        startTransition(async () => {
            // Rimuovi 1 unità del prodotto
            const res = await removeItemFromCart(item.productId, 1);

            if (!res.success) {
                toast({ variant: "destructive", description: res.message });
                return;
            }
            router.refresh();
        });
    };

    return (
        <div className="flex items-center space-x-2">
            {/* Pulsante Decremento / Rimuovi */}
            <button
                type="button"
                onClick={handleRemove}
                aria-label="Rimuovi un'unità"
                className="p-2 border rounded-full hover:bg-gray-100 transition disabled:opacity-50"
                disabled={isPending}
            >
                <Minus className="h-4 w-4" />
            </button>

            {/* Quantità corrente */}
            <span className="w-8 text-center font-semibold text-lg">
                {item.qty}
            </span>

            {/* Pulsante Incremento */}
            <button
                type="button"
                onClick={handleAdd}
                aria-label="Aggiungi un'unità"
                className="p-2 border rounded-full bg-primary text-white hover:bg-primary/90 transition disabled:opacity-50"
                disabled={isPending}
            >
                <Plus className="h-4 w-4" />
            </button>
        </div>
    );
};

// -----------------------------------------------------------------
// COMPONENTE PRINCIPALE: CartTable
// -----------------------------------------------------------------

const CartTable = ({ cart }: { cart?: Cart | null }) => {
    // Aggiunto il controllo per 'null' o 'undefined'
    if (!cart || cart.items.length === 0) {
        return (
            <div className="py-20 text-center text-xl text-gray-500">
                <p className="mb-4">Il tuo carrello è vuoto.</p>
                <Link
                    href="/"
                    className="text-primary hover:underline flex items-center justify-center font-semibold"
                >
                    <ArrowRight className="h-5 w-5 mr-1" /> Torna agli acquisti
                </Link>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <h1 className="text-4xl font-extrabold mb-8 text-gray-800 border-b pb-2">
                Shopping Cart
            </h1>

            {/* Lista degli articoli */}
            <div className="space-y-6">
                {cart.items.map((item) => (
                    <div
                        key={item.productId}
                        className="flex flex-col sm:flex-row items-center justify-between border-b pb-6 last:border-b-0"
                    >
                        {/* Immagine e Dettagli */}
                        <div className="flex items-start space-x-4 w-full sm:w-1/2">
                            <Image
                                src={item.image}
                                alt={item.name}
                                width={80}
                                height={80}
                                className="w-20 h-20 object-cover rounded-lg shadow-md flex-shrink-0"
                            />
                            <div className="flex flex-col">
                                <Link
                                    href={`/product/${item.slug}`}
                                    className="font-bold text-lg hover:text-primary transition"
                                >
                                    {item.name}
                                </Link>
                                <p className="text-gray-600 text-sm">
                                    Prezzo unitario: €{formatCurrency(item.price)} 
                                </p>
                                <p className="text-gray-800 font-semibold mt-1">
                                    Totale Articolo: €{formatCurrency(item.price * item.qty)}
                                </p>
                                <div className="mt-3 sm:hidden">
                                    {/* Controlli di Quantità e Rimozione su mobile */}
                                    <div className="flex items-center space-x-4">
                                        <AddToCartControls item={item} />
                                        <RemoveItemButton item={item} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Controlli Quantità e Rimozione (Desktop) */}
                        <div className="hidden sm:flex items-center space-x-8 mt-4 sm:mt-0 w-auto">
                            <AddToCartControls item={item} />
                            {/* Pulsante di rimozione completa visibile su desktop */}
                            <RemoveItemButton item={item} /> 
                        </div>

                    </div>
                ))}
            </div>

            {/* Riepilogo Totale */}
            <div className="mt-12 p-6 bg-gray-50 rounded-lg shadow-lg">
                <h2 className="text-2xl font-bold mb-4 border-b pb-2">
                    Riepilogo Ordine
                </h2>

                <div className="space-y-2 text-gray-700">
                    <div className="flex justify-between">
                        <span>Subtotale Articoli:</span>
                        <span className="font-medium">
                            €{formatCurrency(cart.itemsPrice)}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span>Costi di Spedizione:</span>
                        <span className="font-medium">
                            €{formatCurrency(cart.shippingPrice)}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span>Tasse:</span>
                        <span className="font-medium">
                            €{formatCurrency(cart.taxPrice)}
                        </span>
                    </div>
                    <div className="flex justify-between pt-3 border-t border-gray-300 text-xl font-extrabold text-gray-900">
                        <span>Totale Ordine:</span>
                        <span>€{formatCurrency(cart.totalPrice)}</span>{" "}
                        {/* 💡 CORREZIONE: Applico formatCurrency anche qui */}
                    </div>
                </div>

                <Link
                    href="/checkout"
                    className="mt-6 w-full flex justify-center items-center py-3 bg-primary text-white rounded-lg font-bold text-lg hover:bg-primary/90 transition shadow-md"
                >
                    Procedi al Checkout <ArrowRight className="h-5 w-5 ml-2" />
                </Link>
            </div>
        </div>
    );
};
export default CartTable;
