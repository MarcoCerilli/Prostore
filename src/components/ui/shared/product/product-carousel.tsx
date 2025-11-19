

"use client"

import { Product } from "@/types";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"; // Assumendo che tu stia usando il tuo componente personalizzato Carousel
import Autoplay from "embla-carousel-autoplay"; // Importazione corretta
import Link from "next/link";
import Image from "next/image";
import React from "react";

// Il tuo codice deve essere 'use client' se usi hooks o interazioni DOM
// "use client"

const ProductCarousel = ({ data }: { data: Product[] }) => {
  // Configurazione del plugin Autoplay (Tempo e Opzioni)
  // Se vuoi opzioni personalizzate, passale qui:
  const autoplayOptions = {
    delay: 2000, // 2 secondi di ritardo
    stopOnInteraction: true, // Si ferma se l'utente interagisce
    stopOnMouseEnter: true, // Si ferma se il mouse entra
  };
// Questo assicura che l'oggetto plugin sia creato solo una volta sul client 
  // e che il riferimento rimanga stabile.
  const plugins = React.useMemo(() => [
      Autoplay(autoplayOptions)
  ], [autoplayOptions.delay, autoplayOptions.stopOnInteraction, autoplayOptions.stopOnMouseEnter]);
  
  return (
    <Carousel
      className="w-full mb-12"
      opts={{
        loop: true,
      }}
     // Passa l'array di plugin stabile
      plugins={plugins}
    >
      <CarouselContent>
        {data.map((product: Product) => (
          <CarouselItem key={product.id}>
            <Link href={`/product/${product.slug}`}>
              <div className=" relative mx-auto aspect-video h-60 w-full">
                <Image
                 src={`/images/${product.banner!}`}
                  alt={product.name}
                    fill={true}
                  sizes="100vw"
                  className="object-cover"
                />
            <div className="absolute inset-0 flex items-end justify-end">
                <h2 className="bg-gray-900 bg-opacity-50 text-2xl font-bold px-2 text-white">
                    {product.name}
                </h2>
            </div>


              </div>
            </Link>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  );
};
export default ProductCarousel;
