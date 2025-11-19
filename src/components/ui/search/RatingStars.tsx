// 📁 File: src/components/ui/search/RatingStars.tsx

import { Star } from "lucide-react";
import React from "react";

/**
 * Componente per visualizzare le stelle di valutazione.
 * Mostra 'starCount' stelle piene, seguite da stelle vuote fino a 5 totali.
 */
const RatingStars = ({ 
    starCount, 
    size = 18, 
    colorClass = "text-yellow-500" 
}: { 
    starCount: number; 
    size?: number;
    colorClass?: string;
}) => {
    // Array per le stelle piene (ad esempio, se starCount è 4, array di 4 elementi)
    const filledStars = Array(starCount).fill(0);
    
    // Array per le stelle vuote/grigie (5 totali meno quelle piene)
    const emptyStars = Array(5 - starCount).fill(0);

    return (
        <span className="flex items-center space-x-0.5">
            {/* Stelle Piene */}
            {filledStars.map((_, index) => (
                <Star
                    key={`filled-${index}`}
                    className={colorClass}
                    size={size}
                    fill="currentColor" // Riempie l'icona con il colore del testo
                />
            ))}
            {/* Stelle Vuote (opzionale, per mantenere un layout fisso di 5 stelle totali) */}
            {emptyStars.map((_, index) => (
                <Star
                    key={`empty-${index}`}
                    className="text-gray-300" // Colore grigio per le stelle non selezionate
                    size={size}
                />
            ))}
            {/* Testo di supporto */}
            <span className="ml-1 text-sm text-gray-700 font-normal">
                & Oltre
            </span>
        </span>
    );
};

export default RatingStars;