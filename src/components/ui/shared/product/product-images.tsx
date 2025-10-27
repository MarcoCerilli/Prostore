"use client";
import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

const ProductImages = ({ images }: { images: string[] }) => {
  const [current, setCurrent] = useState(0);
  // URL placeholder nel caso l'immagine non sia valida o l'array sia vuoto
  const placeholderUrl =
    "https://placehold.co/1000x1000/E5E7EB/4B5563?text=Nessuna+Immagine";

  // --- Gestione Dati Vuoti ---
  if (!images || images.length === 0) {
    return (
      <div className="space-y-4">
        {/* Usiamo <Image> anche per il placeholder */}
        <Image
          src={placeholderUrl}
          alt="Immagine non disponibile"
          width={1000}
          height={1000}
          priority // Carica subito il placeholder se non ci sono immagini
          className="w-full h-auto min-h-[300px] object-cover object-center rounded-xl shadow-lg"
        />
      </div>
    );
  }

  // --- Renderizzazione con Immagini ---
  return (
    <div className="space-y-4">
      {/* 1. Immagine Principale */}
      <div className="relative w-full aspect-square min-h-[300px]">
        <Image
          src={images[current]} // L'URL dell'immagine selezionata
          alt="Immagine principale del prodotto"
          fill // Usa 'fill' in un contenitore relativo per rispettare l'aspect ratio
          sizes="(max-width: 768px) 100vw, 50vw" // Ottimizzazione
          className="object-cover object-center rounded-xl shadow-lg"
          // In caso di errore nel caricamento dell'immagine, reindirizziamo al placeholder
          onError={(e) => {
            (e.target as HTMLImageElement).src = placeholderUrl;
          }}
        />
      </div>

      {/* 2. Miniatura (Galleria interattiva) */}
      <div className="flex overflow-x-auto p-1">
        {images.map((image, index) => (
          // Contenitore della singola miniatura
          <div
            key={image}
            // LOGICA DI INTERAZIONE: Al click, imposta l'indice corrente
            onClick={() => setCurrent(index)}
            className={cn(
              "border-2 mr-2 cursor-pointer transition duration-200 p-1 rounded-md flex-shrink-0",
              "hover:border-indigo-600",
              current === index
                ? "border-indigo-500 scale-105" // Miniatura selezionata
                : "border-gray-200 opacity-75" // Miniatura non selezionata
            )}
          >
            {/* Immagine Miniatura */}
            <div className="relative w-20 h-20">
              <Image
                src={image || placeholderUrl}
                alt={`Miniatura ${index + 1}`}
                fill
                sizes="100px"
                className="object-cover rounded-sm"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = placeholderUrl;
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductImages;
