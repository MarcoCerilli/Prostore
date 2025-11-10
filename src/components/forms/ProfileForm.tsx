"use client";
import React, { useEffect, useState, HTMLInputTypeAttribute } from 'react';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

// =========================================================
// RIFACIMENTO DEI COMPONENTI BASE IN STILE SHADCN/UI (Con Tipi Corretti)
// Il componente Card è mantenuto QUI SOLO SE LO VUOI USARE NELLA PAGINA ESTERNA.
// Se la tua pagina Next.js ha già i componenti Card importati, puoi rimuovere questo blocco.
// Lo mantengo per l'autonomia del file.
// =========================================================

// Interfaccia per i componenti con children
interface ComponentWithChildren {
    children: React.ReactNode;
    className?: string;
}

// Componente Card per il contenitore principale
const Card = ({ children, className = "" }: ComponentWithChildren) => (
    <div className={`rounded-xl border bg-white text-gray-900 shadow-2xl ${className}`}>
        {children}
    </div>
);
const CardHeader = ({ children }: { children: React.ReactNode }) => <div className="flex flex-col space-y-1.5 p-6">{children}</div>;
const CardTitle = ({ children }: { children: React.ReactNode }) => <h3 className="text-2xl font-bold leading-none tracking-tight">{children}</h3>;
const CardDescription = ({ children }: { children: React.ReactNode }) => <p className="text-sm text-gray-500">{children}</p>;
const CardContent = ({ children, className = "" }: ComponentWithChildren) => <div className={`p-6 pt-0 ${className}`}>{children}</div>;

// Componente Label (shadcn/ui style)
const Label = ({ htmlFor, children }: { htmlFor: string, children: React.ReactNode }) => (
    <label 
        htmlFor={htmlFor} 
        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-700"
    >
        {children}
    </label>
);

// Componente Input (shadcn/ui style)
interface InputProps {
    id: string;
    name: string;
    defaultValue: string | number | string[] | undefined;
    type?: HTMLInputTypeAttribute;
    readOnly?: boolean;
    disabled?: boolean;
    required?: boolean;
    placeholder?: string;
    className?: string;
}

const Input = ({ id, name, defaultValue, type = 'text', readOnly = false, disabled = false, required = false, placeholder, className = "" }: InputProps) => (
    <input 
        id={id} 
        name={name} 
        defaultValue={defaultValue} 
        type={type} 
        readOnly={readOnly}
        disabled={disabled}
        required={required}
        placeholder={placeholder}
        className={`flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm
                   ring-offset-white placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 
                   focus-visible:ring-indigo-500 focus-visible:ring-offset-2 
                   disabled:cursor-not-allowed disabled:bg-gray-50 disabled:opacity-70 ${className}`}
    />
);

// Componente Button (shadcn/ui style)
const Button = ({ children, pending, type = "submit" }: { children: React.ReactNode, pending: boolean, type?: "submit" | "button" }) => (
    <button
        type={type} 
        className="inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium 
                   ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 
                   focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:pointer-events-none 
                   disabled:opacity-50 bg-indigo-600 text-white hover:bg-indigo-700 h-10 px-6 py-2 shadow-md"
        disabled={pending}
    >
        {pending ? (
            <div className="flex items-center">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvataggio...
            </div>
        ) : (
            children
        )}
    </button>
);

// Componente per il feedback (Alert style)
interface FormState {
    success: boolean;
    message: string;
}
const StatusMessage = ({ state }: { state: FormState }) => {
    if (!state.message) return null;
    
    const Icon = state.success ? CheckCircle : XCircle;
    const displayedMessage = state.message.startsWith('Errore di validazione:') 
        ? state.message.replace('Errore di validazione: ', 'Campi mancanti: ')
        : state.message;

    const color = state.success ? "text-green-700 bg-green-100 border-green-300" : "text-red-700 bg-red-100 border-red-300";

    return (
        <div className={`p-4 rounded-lg flex items-center border ${color} mb-6`} role="alert">
            <Icon className="w-5 h-5 mr-3 flex-shrink-0" />
            <p className="text-sm font-medium">{displayedMessage}</p>
        </div>
    );
};


// =========================================================
// DATI DI MOCK E LOGICA DI SUBMISSION (INVARIATA)
// =========================================================

// Simula i dati utente estesi
const MOCK_USER = {
    name: 'Marco Cerilli',
    email: 'cerillimarco15@gmail.com',
    address: {
        street: 'Via Roma',
        houseNumber: '15/B',
        city: 'Milano',
        postalCode: '20121',
        country: 'Italia',
    },
    role: 'USER',
};

// Simula la funzione Server Action updateUserProfile
const mockUpdateUserProfile = async (formData: FormData) => {
    const requiredFields = ['firstName', 'lastName', 'street', 'houseNumber', 'city', 'postalCode', 'country'];
    const data = Object.fromEntries(formData.entries());
    const missingFields = requiredFields.filter(field => !data[field] || String(data[field]).trim() === '');

    if (missingFields.length > 0) {
        const fieldNames = missingFields.map(f => f.charAt(0).toUpperCase() + f.slice(1)).join('; ');
        return { success: false, message: `Errore di validazione: ${fieldNames}: campo richiesto.` };
    }

    await new Promise(resolve => setTimeout(resolve, 1500)); 
    return { success: true, message: "Profilo aggiornato con successo (Simulato)!" };
};

// =========================================================
// COMPONENTE PRINCIPALE PROFILEFORM
// =========================================================

interface ProfileFormProps {
    user: any; 
}
const initialState: FormState = {
    success: false,
    message: "",
};


// Definizione esplicita del componente
function ProfileForm({ user = MOCK_USER }: ProfileFormProps) {
    
    const [state, setState] = useState(initialState);
    const [isPending, setIsPending] = useState(false);

    // Gestione dati
    const address = user.address || {}; 
    const [firstName, lastName] = user.name?.split(' ') || ['', ''];

    // Simula l'effetto di useSession().update()
    useEffect(() => {
        if (state.success) {
            console.log("Sessione aggiornata (Simulato): dati utente salvati.");
        }
    }, [state.success]);

    // Simula l'azione del form (sostituisce action={formAction})
    const handleFormSubmit = async (formData: FormData) => {
        setState(initialState); 
        setIsPending(true);
        const newState = await mockUpdateUserProfile(formData);
        setState(newState);
        setIsPending(false);
    }
    
    // 4. Render della Form: Rimosse Card esterne e intestazioni
    return (
        // Contenitore principale: Non ha più div esterni di centraggio o Card. 
        // Presume che il contenitore (es. CardContent) sia fornito dal componente genitore.
        <form 
            onSubmit={(e) => { 
                e.preventDefault(); 
                handleFormSubmit(new FormData(e.target as HTMLFormElement)); 
            }} 
            className="space-y-8"
        >
            <StatusMessage state={state} />

            {/* Il titolo 'Ciao, Marco!' e la descrizione sono rimossi da qui,
                in quanto devono essere gestiti dal componente genitore (ProfilePage) */}
            
            {/* DATI PERSONALI */}
            <section className="space-y-4">
                <h3 className="text-xl font-semibold border-b pb-3 text-gray-800">Dati Personali</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Primo Nome */}
                    <div className="space-y-2">
                        <Label htmlFor="firstName">Nome</Label>
                        <Input id="firstName" name="firstName" defaultValue={firstName} placeholder="Marco" required />
                    </div>
                    {/* Cognome */}
                    <div className="space-y-2">
                        <Label htmlFor="lastName">Cognome</Label>
                        <Input id="lastName" name="lastName" defaultValue={lastName} placeholder="Cerilli" required />
                    </div>
                </div>
                {/* Email (Sola Lettura) */}
                <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" defaultValue={user.email || ''} readOnly disabled />
                </div>
            </section>

            {/* INDIRIZZO DI SPEDIZIONE */}
            <section className="space-y-4">
                <h3 className="text-xl font-semibold border-b pb-3 text-gray-800">Indirizzo di Spedizione</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Via */}
                    <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="street">Via</Label>
                        <Input id="street" name="street" defaultValue={address.street || address.address || ''} placeholder="Es: Via Roma" required />
                    </div>
                    {/* Numero Civico */}
                    <div className="space-y-2">
                        <Label htmlFor="houseNumber">N. Civico</Label>
                        <Input id="houseNumber" name="houseNumber" defaultValue={address.houseNumber || ''} placeholder="Es: 15/B" required />
                    </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Città */}
                    <div className="space-y-2">
                        <Label htmlFor="city">Città</Label>
                        <Input id="city" name="city" defaultValue={address.city || ''} required />
                    </div>
                    {/* Codice Postale */}
                    <div className="space-y-2">
                        <Label htmlFor="postalCode">CAP</Label>
                        <Input id="postalCode" name="postalCode" defaultValue={address.postalCode || ''} required />
                    </div>
                     {/* Paese */}
                    <div className="space-y-2">
                        <Label htmlFor="country">Nazione</Label>
                        <Input id="country" name="country" defaultValue={address.country || ''} required />
                    </div>
                </div>
            </section>
            
            {/* Bottone di Submission */}
            <div className="flex justify-end pt-4">
                <Button pending={isPending}>Salva Modifiche</Button>
            </div>
        </form>
    );
}

// Export predefinito esplicito
export default ProfileForm;