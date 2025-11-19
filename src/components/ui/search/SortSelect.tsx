// 📁 File: src/components/ui/search/SortSelect.tsx
'use client'; // 🛑 QUESTO LO CONTRASSEGNA COME CLIENT COMPONENT

import { useSearchParams } from 'next/navigation';

// Se getFilterUrl è definito solo in SearchPage, dovrai passarlo o ricrearlo qui.
// Per semplicità, lo ricreiamo o usiamo una versione esterna/utility.

// Versione semplificata di getFilterUrl per uso client-side
// Per farla funzionare, devi passare i parametri di ricerca attuali
const updateSearchParams = (searchParams: URLSearchParams, key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams.toString());
    newParams.set(key, value);
    newParams.delete('page'); // Resetta la pagina quando si cambia l'ordinamento
    return `?${newParams.toString()}`;
};


export default function SortSelect({ currentSort }: { currentSort: string }) {
    const searchParams = useSearchParams();

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newSortValue = e.target.value;
        
        // 🛑 Usa useSearchParams per costruire il nuovo URL client-side
        const newPath = updateSearchParams(searchParams, 'sort', newSortValue);
        
        window.location.href = `/search${newPath}`;
    };

    return (
        <select 
            defaultValue={currentSort}
            onChange={handleChange}
            className="p-2 border rounded-md"
        >
            <option value="newest">Ordina: Più recenti</option>
            <option value="lowest">Ordina: Prezzo più basso</option>
            <option value="highest">Ordina: Prezzo più alto</option>
            <option value="rating">Ordina: Voto clienti</option>
        </select>
    );
}