import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { shippingAddress } from "@/types";

// ----------------------------------------------------
// 1. Interfaccia Aggiornata per includere onSave
// ----------------------------------------------------
interface ShippingAddressFormProps {
    address: shippingAddress;
    // La callback che prende il nuovo indirizzo e lo salva/reindirizza nel componente padre
    onSave: (newAddress: shippingAddress) => void;
}

// ----------------------------------------------------
// 2. Componente ShippingAddressForm
// ----------------------------------------------------
const ShippingAddressForm = ({ address, onSave }: ShippingAddressFormProps) => {
    
    // NOTA: Ho rinominato 'street' in 'streetAddress' e 'postalCode' in 'zipCode'
    // per coerenza con il tipo shippingAddress definito altrove.
    const [formData, setFormData] = useState<shippingAddress>(address);
    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSaveAddress = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validazione minima
        if (!formData.firstName || !formData.lastName || !formData.street || !formData.postalCode) {
            return toast({
                title: "Campi Mancanti",
                description: "Per favore, compila tutti i campi obbligatori.",
                variant: "destructive",
            });
        }

        setIsSaving(true);
        console.log("Simulazione salvataggio indirizzo su database/server...");
        
        // Simula la chiamata API/Server Action
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // 1. CHIAMA LA FUNZIONE PASSTA DAL GENITORE
        onSave(formData);
        
        setIsSaving(false);
        
        toast({
            title: "Indirizzo Salvato!",
            description: "Procedi al metodo di pagamento.",
            // Uso di "default" per evitare l'errore di tipizzazione
            variant: "default", 
        });
        
        // NOTA: Il reindirizzamento al passo 'payment' è ora gestito all'interno di onSave in CheckoutClientWrapper.
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold tracking-tight border-b pb-2">1. Dettagli di Spedizione</h2>
            
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="text-xl">Informazioni di Contatto e Indirizzo</CardTitle>
                    <CardDescription>Inserisci l'indirizzo a cui spediremo il tuo ordine.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSaveAddress} className="space-y-6">
                        
                        {/* Nome e Cognome */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="firstName">Nome</Label>
                                <Input 
                                    id="firstName" 
                                    name="firstName"
                                    type="text" 
                                    value={formData.firstName} 
                                    onChange={handleChange} 
                                    required 
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="lastName">Cognome</Label>
                                <Input 
                                    id="lastName" 
                                    name="lastName"
                                    type="text" 
                                    value={formData.lastName} 
                                    onChange={handleChange} 
                                    required 
                                />
                            </div>
                        </div>

                        {/* Indirizzo e Numero Civico */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="space-y-2 col-span-3">
                                <Label htmlFor="streetAddress">Via/Piazza</Label>
                                <Input 
                                    id="streetAddress" 
                                    name="streetAddress"
                                    type="text" 
                                    value={formData.street} 
                                    onChange={handleChange} 
                                    required 
                                />
                            </div>
                            <div className="space-y-2 col-span-1">
                                <Label htmlFor="houseNumber">N° Civico</Label>
                                <Input 
                                    id="houseNumber" 
                                    name="houseNumber"
                                    type="text" 
                                    value={formData.houseNumber} 
                                    onChange={handleChange} 
                                />
                            </div>
                        </div>
                        
                        {/* Città, CAP e Nazione */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="city">Città</Label>
                                <Input 
                                    id="city" 
                                    name="city"
                                    type="text" 
                                    value={formData.city} 
                                    onChange={handleChange} 
                                    required 
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="zipCode">CAP</Label>
                                <Input 
                                    id="zipCode" 
                                    name="zipCode"
                                    type="text" 
                                    value={formData.postalCode} 
                                    onChange={handleChange} 
                                    required 
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="country">Nazione</Label>
                                <Input 
                                    id="country" 
                                    name="country"
                                    type="text" 
                                    value={formData.country} 
                                    onChange={handleChange} 
                                    required 
                                />
                            </div>
                        </div>

                        {/* Telefono */}
                         <div className="space-y-2">
                            <Label htmlFor="phoneNumber">Numero di Telefono</Label>
                            <Input 
                                id="phoneNumber" 
                                name="phoneNumber"
                                type="tel" 
                                value={formData.houseNumber} 
                                onChange={handleChange} 
                                required 
                            />
                        </div>

                        {/* Note (Facoltativo) */}
                        <div className="space-y-2">
                            <Label htmlFor="notes">Note (es. orari di consegna, citofono)</Label>
                            <Textarea 
                                id="notes" 
                                name="notes" 
                                value={formData.notes || ''} 
                                onChange={handleChange} 
                                rows={3} 
                            />
                        </div>

                        {/* Pulsante Salva */}
                        <div className="pt-4 border-t">
                            <Button
                                type="submit"
                                disabled={isSaving}
                                className="w-full h-12 text-lg bg-indigo-600 hover:bg-indigo-700 transition"
                            >
                                {isSaving ? "Salvataggio..." : "Salva e Continua"}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}

export default ShippingAddressForm;
