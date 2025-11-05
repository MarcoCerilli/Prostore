"use client";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

// 1. IMPORTIAMO LE COSTANTI E I TIPI DAI NOSTRI FILES
import { shippingAddress } from "@/types";

// Definiamo il tipo di dato che questo form passerà al componente genitore
export type SavedPaymentDetails = {
    method: string; // Il nome del metodo (es. "PayPal", "Contrassegno")
    lastFourDigits: string; // Aggiungiamo un campo simulato per i dettagli della carta
}

// ----------------------------------------------------
// 2. Interfaccia Aggiornata con la callback onSave
// ----------------------------------------------------
interface PaymentFormPlaceholderProps {
    existingAddress: shippingAddress;
    // La funzione che il componente genitore userà per salvare i dati
    onSave: (details: SavedPaymentDetails) => void; 
}

// ----------------------------------------------------
// 3. Componente PaymentFormPlaceholder
// ----------------------------------------------------

const PaymentFormPlaceholder = ({ existingAddress, onSave }: PaymentFormPlaceholderProps) => {
    
    const { toast } = useToast();
    const router = useRouter(); 

    // TODO: QUESTE COSTANTI DEVONO ESSERE DEFINITE! Ho creato dei placeholder temporanei
    // Se non hai un file types.ts con queste costanti, usa quelle che ti ho dato prima in src/lib/constants/PAYMENT_METHODS.ts
    const PAYMENT_METHODS = ["PayPal", "Carta di Credito / Debito", "Contrassegno"];
    const DEFAULT_PAYMENT_METHOD = "PayPal";
    // ----------------------------------------------------------------------------------------

    const [isProcessing, setIsProcessing] = useState(false);

    // Stato per il metodo di pagamento selezionato, inizializzato con la costante DEFAULT
    const [selectedMethod, SetselectedMethod] = useState(DEFAULT_PAYMENT_METHOD);

    // Determiniamo se il form è completo (qui basato solo sulla selezione del metodo)
    const isFormComplete = !!selectedMethod;

    const handlePayment = async () => {
        if(!selectedMethod){
            return toast({
                title:"Selezione Mancante",
                description: "Per favore, seleziona un metodo di pagamento.",
                variant: "destructive",
            })
        }
        
        setIsProcessing(true);

        // --- LOGICA DI SALVATAGGIO DEI DATI PRIMA DEL REINDIRIZZAMENTO ---
        let paymentData: SavedPaymentDetails;
        
        // Simula la creazione dei dati finali da salvare
        switch (selectedMethod) {
            case 'Carta di Credito / Debito':
                // In una vera app, questo sarebbe un token o le ultime 4 cifre mascherate
                paymentData = { method: selectedMethod, lastFourDigits: '4242' }; 
                break;
            case 'PayPal':
                // PayPal non ha cifre finali, ma lo stato viene salvato
                paymentData = { method: selectedMethod, lastFourDigits: '' };
                break;
            case 'Contrassegno':
                paymentData = { method: selectedMethod, lastFourDigits: '' };
                break;
            default:
                // Fallback di sicurezza
                paymentData = { method: selectedMethod, lastFourDigits: '' }; 
        }

        // Simula la chiamata API/Server Action
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // 1. SALVA I DATI NEL COMPONENTE PADRE
        onSave(paymentData); 
        
        setIsProcessing(false);
        
        // 2. REINDIRIZZA AL PASSO SUCCESSIVO (Ora che i dati sono salvati)
        router.push("/checkout?step=review"); 
        
        toast({
            title: "Selezione Salvata!",
            description: `Procedi alla revisione dell'ordine. Metodo: ${selectedMethod}. `,
            variant: "default",
        });
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold tracking-tight border-b pb-2">2. Metodo di Pagamento</h2>

            {/* ------------------------------------------- */}
            {/* 2. SEZIONE SELEZIONE METODO DI PAGAMENTO DINAMICA  */}
            {/* ------------------------------------------- */}
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="text-xl flex items-center">
                        Seleziona un Metodo
                        <Lock className="w-4 h-4 ml-2 text-gray-500" />
                    </CardTitle>
                    <CardDescription>Tutte le transazioni sono sicure e crittografate.</CardDescription>
                </CardHeader>
                <CardContent>
                    {/* Utilizza il componente RadioGroup per la selezione */}
                    <RadioGroup 
                        defaultValue={DEFAULT_PAYMENT_METHOD} 
                        onValueChange={SetselectedMethod}
                        className="space-y-4"
                    >
                        {/* Mappa i metodi definiti nel file delle costanti */}
                        {PAYMENT_METHODS.map((method) => (
                            <div 
                                key={method} 
                                // Aggiunto onClick per migliorare l'usabilità touch/click sull'intera area
                                onClick={() => SetselectedMethod(method)}
                                className={`flex items-center space-x-3 p-3 border rounded-lg transition-colors cursor-pointer ${
                                    selectedMethod === method ? 'border-indigo-500 bg-indigo-50' : 'hover:bg-gray-50'
                                }`}
                            >
                                <RadioGroupItem value={method} id={method} />
                                <Label htmlFor={method} className="text-base font-medium flex-1 cursor-pointer">
                                    {method}
                                    {/* Aggiungi un'indicazione visiva per i metodi noti */}
                                    {method === DEFAULT_PAYMENT_METHOD && (
                                        <span className="ml-2 inline-block text-xs font-semibold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full">Predefinito</span>
                                    )}
                                </Label>
                            </div>
                        ))}
                    </RadioGroup>
                </CardContent>
            </Card>

            {/* ------------------------------------------- */}
            {/* 3. SEZIONE PULSANTE CONFERMA  */}
            {/* ------------------------------------------- */}
            <div className="pt-4 mt-6 border-t">
                <Button
                    type="button"
                    onClick={handlePayment}
                    disabled={isProcessing || !isFormComplete}
                    className="w-full h-12 text-lg bg-indigo-600 hover:bg-indigo-700 transition"
                >
                    {isProcessing ? "Elaborazione..." : "Paga e Completa Ordine"}
                </Button>
            </div>
        </div>
    );
}

export default PaymentFormPlaceholder;
