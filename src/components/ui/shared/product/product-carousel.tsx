"use client";

import { Product } from "@/types";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import Link from "next/link";
import Image from "next/image";
import React from "react";
import { Sparkles, ArrowRight } from "lucide-react";
import ProductPrice from "./product-price";

const ProductCarousel = ({ data }: { data: Product[] }) => {
  const autoplayOptions = {
    delay: 4500,
    stopOnInteraction: true,
    stopOnMouseEnter: true,
  };

  const plugins = React.useMemo(
    () => [
      Autoplay(autoplayOptions),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return (
    <Carousel
      className="w-full mb-8 overflow-hidden rounded-3xl shadow-xl border border-border/40"
      opts={{
        loop: true,
      }}
      plugins={plugins}
    >
      <CarouselContent>
        {data.map((product: Product) => (
          <CarouselItem key={product.id}>
            <Link href={`/product/${product.slug}`} className="group block relative w-full h-[280px] sm:h-[380px] md:h-[460px]">
              <Image
                src={`/images/${product.banner!}`}
                alt={product.name}
                fill
                priority
                sizes="100vw"
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              />

              {/* Gradient Overlays */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent hidden sm:block" />

              {/* Glassmorphism Product Card on Banner */}
              <div className="absolute bottom-6 left-6 right-6 sm:right-auto sm:max-w-md p-5 sm:p-6 rounded-2xl bg-black/40 backdrop-blur-md border border-white/20 text-white space-y-2.5 shadow-2xl transition-all duration-300 group-hover:bg-black/50">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white backdrop-blur-md border border-white/30">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>In Evidenza • Collezione 2026</span>
                </div>

                <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-white leading-tight">
                  {product.name}
                </h2>

                <div className="flex items-center justify-between gap-4 pt-1">
                  <ProductPrice
                    value={Number(product.price)}
                    className="text-xl sm:text-2xl font-bold text-white"
                  />

                  <span className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-xl bg-white text-zinc-950 group-hover:bg-indigo-500 group-hover:text-white transition-colors duration-200 shadow-md">
                    <span>Acquista Ora</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </div>
            </Link>
          </CarouselItem>
        ))}
      </CarouselContent>

      <CarouselPrevious className="left-4 bg-background/80 backdrop-blur-md border-white/20 hover:bg-background shadow-lg" />
      <CarouselNext className="right-4 bg-background/80 backdrop-blur-md border-white/20 hover:bg-background shadow-lg" />
    </Carousel>
  );
};

export default ProductCarousel;
