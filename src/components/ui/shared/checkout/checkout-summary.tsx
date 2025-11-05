"use client";

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getMyCartAction } from '@/lib/actions/cart.actions'; // La Server Action corretta
import { Cart } from '@/types'; // Il tipo Cart pulito (con 'number')
import { Loader2, ShoppingCart } from 'lucide-react';
import { Separator

 } from '@radix-ui/react-dropdown-menu';
// Formatta un numero come valuta
const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('it-IT', {
        style: 'currency',
        currency: 'EUR',
    }).format(amount);
};

// -----------------------------------------------------------
// Componente principale: CheckoutSummary
// -----------------------------------------------------------

const CheckoutSummary = () => {
    const [cart, setCart] = useState<Cart | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchCart = async () => {
            setIsLoading(true);
            setError(null);
            try {
                // Chiama la Server Action che ora restituisce il tipo Cart (con number)
                const cartData = await getMyCartAction(); 
                setCart(cartData);

                if (!cartData) {
                    console.log("Carrello vuoto o non trovato.");
                }

            } catch (err) {
                console.error("Errore nel recupero del carrello:", err);
                setError("Impossibile caricare il riepilogo del carrello.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchCart();
    }, []);

    // -----------------------------------------------------------
    // Stati di Rendering
    // -----------------------------------------------------------

    if (isLoading) {
        return (
            <Card className="shadow-lg bg-white dark:bg-gray-800 animate-pulse">
                <CardHeader>
                    <CardTitle className="text-xl">Riepilogo Ordine</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex justify-between">
                        <div className="w-1/3 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        <div className="w-1/4 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-bold text-lg">
                        <div className="w-1/3 h-5 bg-gray-300 dark:bg-gray-600 rounded"></div>
                        <div className="w-1/4 h-5 bg-gray-300 dark:bg-gray-600 rounded"></div>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button disabled className="w-full">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Caricamento...
                    </Button>
                </CardFooter>
            </Card>
        );
    }
    
    if (error) {
        return (
            <Card className="shadow-lg bg-red-50 border-red-400">
                <CardHeader>
                    <CardTitle className="text-xl text-red-600">Errore</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-red-500">{error}</p>
                    <p className="text-sm text-red-400 mt-2">Per favore, ricarica la pagina.</p>
                </CardContent>
            </Card>
        );
    }

    const cartItemsCount = cart?.items.reduce((sum, item) => sum + item.qty, 0) || 0;

    if (!cart || cartItemsCount === 0) {
        return (
            <Card className="shadow-lg bg-white dark:bg-gray-800">
                <CardHeader>
                    <CardTitle className="text-xl">Riepilogo Ordine</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-center py-8">
                    <ShoppingCart className="h-10 w-10 text-gray-400 mx-auto" />
                    <p className="text-gray-600 dark:text-gray-300">Il tuo carrello è vuoto.</p>
                    <Button variant="link" className="text-blue-600" onClick={() => (window.location.href = '/')}>
                        Torna agli acquisti
                    </Button>
                </CardContent>
            </Card>
        );
    }

    // -----------------------------------------------------------
    // Rendering del Riepilogo (Dati disponibili)
    // -----------------------------------------------------------

    return (
        <Card className="shadow-lg bg-white dark:bg-gray-800 sticky top-4">
            <CardHeader>
                <CardTitle className="text-2xl font-bold">Riepilogo Ordine</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-700 dark:text-gray-300">
                {/* Dettagli Articoli */}
                <div className="flex justify-between">
                    <span>Articoli ({cartItemsCount})</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(cart.itemsPrice)}
                    </span>
                </div>

                {/* Spedizione */}
                <div className="flex justify-between">
                    <span>Costo Spedizione</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                        {cart.shippingPrice > 0 ? formatCurrency(cart.shippingPrice) : 'Gratuita'}
                    </span>
                </div>
                
                {/* Tasse */}
                <div className="flex justify-between">
                    <span>IVA/Tasse</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(cart.taxPrice)}
                    </span>
                </div>

                <Separator className="bg-gray-200 dark:bg-gray-700" />

                {/* Totale Finale */}
                <div className="flex justify-between font-bold text-xl text-gray-900 dark:text-white">
                    <span>Totale Ordine</span>
                    <span>{formatCurrency(cart.totalPrice)}</span>
                </div>

            </CardContent>
            <CardFooter>
            </CardFooter>
        </Card>
    );
};

export default CheckoutSummary;
