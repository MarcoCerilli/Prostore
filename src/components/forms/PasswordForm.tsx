"use client";
import React, { useActionState, useEffect, useRef } from 'react';
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { updatePasswordAction } from '@/lib/actions/user.actions'; // ⭐ La tua Server Action
import { CheckCircle, XCircle } from 'lucide-react';

interface PasswordFormProps {
    userId: string; // ID dell'utente
}

// Stato iniziale per useFormState
const initialState = {
    success: false,
    message: "",
};

export default function PasswordForm({ userId }: PasswordFormProps) {
    const formRef = useRef<HTMLFormElement>(null);
    
    // 1. Inizializzazione della Server Action
    const [state, formAction] = useActionState(updatePasswordAction, initialState);

    // 2. Effetto per resettare la form dopo il successo
    useEffect(() => {
        if (state.success && formRef.current) {
            // Resetta tutti i campi dopo il cambio password riuscito
            formRef.current.reset();
        }
    }, [state.success]);

    // 3. Componente di Feedback
    const StatusMessage = () => {
        if (!state.message) return null;
        
        const Icon = state.success ? CheckCircle : XCircle;
        const color = state.success ? "text-green-600 bg-green-50 border-green-200" : "text-red-600 bg-red-50 border-red-200";

        return (
            <div className={`p-3 rounded-md flex items-center border ${color} mb-4`} role="alert">
                <Icon className="w-5 h-5 mr-3 flex-shrink-0" />
                <p className="text-sm font-medium">{state.message}</p>
            </div>
        );
    };

    return (
        // ⭐ Associa la ref alla form
        <form ref={formRef} action={formAction} className="space-y-4 max-w-md">
            <StatusMessage />

            <p className="text-sm text-gray-500">
                La tua password deve essere lunga almeno 8 caratteri.
            </p>
            <div>
                <Label htmlFor="currentPassword">Password Corrente</Label>
                <Input id="currentPassword" name="currentPassword" type="password" required />
            </div>
            <div>
                <Label htmlFor="newPassword">Nuova Password</Label>
                <Input id="newPassword" name="newPassword" type="password" required />
            </div>
            <div>
                <Label htmlFor="confirmPassword">Conferma Nuova Password</Label>
                <Input id="confirmPassword" name="confirmPassword" type="password" required />
            </div>
            <Button type="submit">Aggiorna Password</Button>
        </form>
    );
}