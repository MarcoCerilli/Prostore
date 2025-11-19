// src/components/ui/shared/header/HeaderWrapper.tsx 
import { getAllCategories } from "@/lib/actions/product.actions";
import Header from "./index"; // Importa il tuo Header Client

export default async function HeaderWrapper() {
    // 🛑 Esegui il fetch lato SERVER, dove è consentito
    const categories = await getAllCategories(); 

    return (
        // Passa i dati al Client Component
        <Header categories={categories} />
    );
}