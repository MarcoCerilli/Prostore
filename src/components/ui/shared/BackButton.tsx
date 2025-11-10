'use client';

import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

/**
 * Pulsante di navigazione che torna alla pagina precedente del browser.
 * Utilizza lo stile Shadcn/UI e l'hook useRouter.
 */
export function BackButton() {
    const router = useRouter();
    
    return (
        <Button 
            variant="outline" 
            onClick={() => router.back()} 
            className="gap-2 text-gray-700 hover:bg-gray-100"
        >
            <ArrowLeft className="h-4 w-4" />
            Torna indietro
        </Button>
    );
}