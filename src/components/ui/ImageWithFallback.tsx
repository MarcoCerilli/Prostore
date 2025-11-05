// File: components/ui/ImageWithFallback.tsx
"use client";

import React, { useState } from 'react';

interface ImageProps {
    src: string;
    alt: string;
    className?: string;
    // URL di riserva per l'immagine placeholder
    fallbackSrc?: string; 
}

export const ImageWithFallback = ({ src, alt, className, fallbackSrc = 'https://placehold.co/60x60/808080/ffffff?text=Img' }: ImageProps) => {
    
    // Per prevenire loop infiniti, usiamo uno stato per tracciare se l'errore è già avvenuto
    const [hasError, setHasError] = useState(false);
    
    const imageSource = hasError ? fallbackSrc : src;

    const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
        // Imposta lo stato per usare l'immagine di riserva solo alla prima occorrenza
        if (!hasError) {
            setHasError(true);
        }
    };

    return (
        <img 
            src={imageSource} 
            alt={alt} 
            className={className} 
            onError={handleError}
            // Se la prop `src` è vuota, potremmo voler renderizzare direttamente il fallback
            // Potresti anche aggiungere `loading="lazy"` qui
        />
    );
};