"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import {
  DEFAULT_PRODUCT_PLACEHOLDER,
  normalizeProductImages,
} from "@/lib/image-utils";
import { ImageIcon } from "lucide-react";

interface ProductImagesProps {
  images?: string[] | string | null;
}

const ProductImages = ({ images }: ProductImagesProps) => {
  const [current, setCurrent] = useState(0);
  // Traccia gli indici delle immagini che hanno generato errore di caricamento
  const [failedIndices, setFailedIndices] = useState<Record<number, boolean>>({});

  const validImages = normalizeProductImages(images);

  // Se non ci sono immagini nel prodotto
  if (validImages.length === 0) {
    return (
      <div className="space-y-4">
        <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-muted/30 border border-border/60 shadow-md flex flex-col items-center justify-center p-6 text-center">
          <Image
            src={DEFAULT_PRODUCT_PLACEHOLDER}
            alt="Immagine non disponibile"
            fill
            unoptimized
            priority
            className="object-contain p-8 opacity-70"
          />
          <div className="relative z-10 mt-auto bg-background/80 backdrop-blur-md px-4 py-1.5 rounded-full border border-border/50 text-xs text-muted-foreground flex items-center gap-1.5 shadow-xs">
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Nessuna immagine disponibile</span>
          </div>
        </div>
      </div>
    );
  }

  // Se l'indice selezionato supera la lunghezza, resettiamo a 0
  const activeIndex = current < validImages.length ? current : 0;
  const isCurrentFailed = !!failedIndices[activeIndex];
  const activeImageSrc = isCurrentFailed
    ? DEFAULT_PRODUCT_PLACEHOLDER
    : validImages[activeIndex];

  return (
    <div className="space-y-4 w-full">
      {/* 1. Immagine Principale */}
      <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-muted/20 border border-border/60 shadow-lg">
        <Image
          key={`main-${activeIndex}-${activeImageSrc}`}
          src={activeImageSrc}
          alt={`Immagine principale del prodotto ${activeIndex + 1}`}
          fill
          unoptimized
          priority
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 40vw"
          className="object-cover object-center transition-all duration-300"
          onError={() => {
            if (!failedIndices[activeIndex]) {
              setFailedIndices((prev) => ({ ...prev, [activeIndex]: true }));
            }
          }}
        />
      </div>

      {/* 2. Miniature (mostrate solo se c'è più di una immagine) */}
      {validImages.length > 1 && (
        <div className="flex gap-2.5 overflow-x-auto pb-2 pt-1 scrollbar-thin">
          {validImages.map((image, index) => {
            const isThumbFailed = !!failedIndices[index];
            const thumbSrc = isThumbFailed ? DEFAULT_PRODUCT_PLACEHOLDER : image;
            const isSelected = activeIndex === index;

            return (
              <button
                type="button"
                key={`${image}-${index}`}
                onClick={() => setCurrent(index)}
                aria-label={`Visualizza immagine ${index + 1}`}
                className={cn(
                  "relative w-20 h-20 rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all duration-200 bg-muted/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
                  isSelected
                    ? "border-indigo-600 dark:border-indigo-400 ring-2 ring-indigo-600/30 scale-105 shadow-sm"
                    : "border-border/60 hover:border-indigo-300 dark:hover:border-indigo-700 opacity-75 hover:opacity-100"
                )}
              >
                <Image
                  src={thumbSrc}
                  alt={`Miniatura ${index + 1}`}
                  fill
                  unoptimized
                  sizes="80px"
                  className="object-cover"
                  onError={() => {
                    if (!failedIndices[index]) {
                      setFailedIndices((prev) => ({ ...prev, [index]: true }));
                    }
                  }}
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ProductImages;
