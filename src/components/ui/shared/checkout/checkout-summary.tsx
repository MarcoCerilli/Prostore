import React, { useMemo } from "react";
import Image from "next/image";
// Rimuoviamo l'importazione di Button che non è più necessario qui
// import { Button } from "@/components/ui/button"; 
import { Separator } from "@radix-ui/react-dropdown-menu";
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

// Definizioni di interfaccia (rimangono invariate)
interface CartItem {
    id: string;
    name: string;
    price: string;
    quantity: number;
    image: string;
}

interface PaymentDetails {
    last4: string;
    method: string;
}

interface CheckoutSummaryProps {
    cartItems: CartItem[];
    shippingFee: number;
    taxRate: number;
    onProceed: () => void;
    savedPaymentDetails: PaymentDetails | null;
    step: "address" | "payment" | "review" | "success";
}

const CheckoutSummary: React.FC<CheckoutSummaryProps> = ({
    cartItems,
    shippingFee,
    taxRate,
    // onProceed, // Non necessario poiché il pulsante è stato rimosso
    savedPaymentDetails,
    step,
}) => {
    
    // ✅ CORREZIONE CALCOLO COSTI
    const { subtotal, tax, total } = useMemo(() => {
        // Usa parseFloat su item.price, rendendolo robusto con replace
        const sub = cartItems.reduce(
            (sum, item) => 
                // Assicuriamo che la stringa prezzo sia parsata correttamente
                sum + parseFloat(item.price.replace(",", ".")) * item.quantity, 
            0
        );
        
        // 🎯 CORREZIONE: IVA calcolata SOLO sul subtotale degli articoli
        const calculatedTax = sub * taxRate; 
        
        const finalTotal = sub + shippingFee + calculatedTax;
        return { subtotal: sub, tax: calculatedTax, total: finalTotal };
    }, [cartItems, shippingFee, taxRate]);
    
    // Funzione di formattazione
    const formatCurrency = (amount: number) =>
        `€${amount.toFixed(2).replace(".", ",")}`;

    // ✅ CORREZIONE LOGICA STATO PULSANTE
    const getButtonState = () => {
        // Impostiamo sempre isVisible a false perché il pulsante ora è in OrderReview
        let isVisible = false; 
        
        // La logica interna non ci interessa più in questo componente
        switch (step) {
            case "review":
                // ...
                break;
            default:
                break;
        }
        return { isVisible };
    };

    const { isVisible } = getButtonState(); // isVisible sarà sempre false

    return (
        <Card className="md:col-span-1 h-fit sticky top-4 shadow-xl">
            <CardHeader className="border-b pb-4">
                <CardTitle className="text-2xl text-gray-800">
                    Riepilogo Ordine
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
                <div className="space-y-4">
                    
                    {/* Dettagli Articoli (invariati) */}
                    <div className="space-y-4">
                        <h4 className="font-bold text-base mb-2 text-gray-700">
                            Articoli:
                        </h4>
                        {cartItems.map((item, index) => (
                            <div
                                key={`${item.id}-${index}`}
                                className="flex justify-between items-center text-sm border-b pb-3 last:border-b-0 last:pb-0"
                            >
                                <div className="flex items-start space-x-3">
                                    <Image
                                        src={item.image}
                                        alt={item.name}
                                        width={60}
                                        height={60}
                                        className="rounded-md object-cover w-[60px] h-[60px]"
                                    />
                                    <span className="text-gray-700 font-medium leading-tight pt-1">
                                        {item.name} (x{item.quantity})
                                    </span>
                                </div>
                                <span className="font-semibold text-gray-800">
                                    {/* Usa il prezzo parsato correttamente */}
                                    {formatCurrency(parseFloat(item.price.replace(",", ".")) * item.quantity)} 
                                </span>
                            </div>
                        ))}
                    </div>

                    <Separator className="my-4 bg-gray-200 h-[1px]" />

                    {/* Sottototali (Aggiornati con la nuova logica IVA) */}
                    <div className="space-y-2 text-base">
                        <div className="flex justify-between">
                            <span>Subtotale Articoli</span>
                            <span className="font-medium">{formatCurrency(subtotal)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Costo Spedizione</span>
                            <span className="font-medium">{formatCurrency(shippingFee)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>IVA ({taxRate * 100}%)</span>
                            <span className="font-medium">{formatCurrency(tax)}</span>
                        </div>
                    </div>

                    <Separator className="my-4 bg-gray-300 h-[1.5px]" />

                    {/* Totale Finale */}
                    <div className="flex justify-between font-bold text-xl text-indigo-700">
                        <span>Totale</span>
                        <span>{formatCurrency(total)}</span>
                    </div>

                    {/* Dettagli Pagamento Salvato (Solo nello step Review - Invariato) */}
                    {step === "review" && (
                        <div
                            className={`mt-4 p-3 rounded-lg border text-sm ${savedPaymentDetails ? "border-green-500 bg-green-50/50" : "border-red-500 bg-red-50/50"}`}
                        >
                            <p className="font-medium text-gray-800">Metodo Selezionato:</p>
                            {savedPaymentDetails ? (
                                <p className="text-sm text-gray-700">
                                    {savedPaymentDetails.method}
                                    {savedPaymentDetails.last4 &&
                                        ` (termina con **** ${savedPaymentDetails.last4})`}
                                </p>
                            ) : (
                                <p className="text-sm text-red-600 font-semibold">
                                    Dettagli di pagamento in sospeso.
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </CardContent>

            {/* FOOTER: Lasciato vuoto o rimosso completamente */}
            {isVisible && <CardFooter className="pt-0"></CardFooter>}
        </Card>
    );
};

export default CheckoutSummary;