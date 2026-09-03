import Image from "next/image";
import { Card, CardContent, CardHeader } from "../../card";
import Link from "next/link";
import ProductPrice from "./product-price";
import { Product } from "@/types";
import Rating from "../../rating";
import { normalizeProductImage } from "@/lib/image-utils";

const ProductCard = ({ product }: { product: Product }) => {
  const imageUrl = normalizeProductImage(
    Array.isArray(product.images) ? product.images[0] : (product.images as unknown as string)
  );

  const priceNum = Number(product.price) || 0;
  const installment = (priceNum / 3).toFixed(2);

  return (
    <Card className="group relative w-full overflow-hidden rounded-2xl border border-border/60 bg-card hover:border-indigo-300 dark:hover:border-indigo-700/60 shadow-xs hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between">
      <div>
        <CardHeader className="p-0 relative overflow-hidden bg-muted/20">
          <Link href={`/product/${product.slug}`} className="block relative aspect-square w-full overflow-hidden">
            <Image
              src={imageUrl}
              alt={product.name}
              fill
              unoptimized
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              priority={false}
              className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            />

            {/* Overlay Gradient on Hover */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </Link>

          {/* Badges sopra l'immagine */}
          <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
            {product.category && (
              <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-background/90 dark:bg-zinc-900/90 text-foreground backdrop-blur-md shadow-xs border border-border/40 capitalize">
                {product.category}
              </span>
            )}

            {product.stock > 0 ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-50/90 dark:bg-emerald-950/90 text-emerald-700 dark:text-emerald-300 backdrop-blur-md border border-emerald-200/60 dark:border-emerald-800/60">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Disponibile
              </span>
            ) : (
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-destructive/10 text-destructive border border-destructive/20 backdrop-blur-md">
                Esaurito
              </span>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-4 space-y-2.5">
          {/* Brand */}
          <div className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
            {product.brand}
          </div>

          {/* Titolo Prodotto */}
          <Link href={`/product/${product.slug}`} className="block">
            <h2 className="font-semibold text-sm sm:text-base text-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
              {product.name}
            </h2>
          </Link>

          {/* Rating */}
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Rating value={Number(product.rating) || 0} />
            {product.numReviews > 0 && (
              <span className="text-[11px] text-muted-foreground ml-1">
                ({product.numReviews})
              </span>
            )}
          </div>
        </CardContent>
      </div>

      {/* Prezzo & Rate Klarna */}
      <div className="px-4 pb-4 pt-1 border-t border-border/40 flex items-end justify-between gap-2">
        <div>
          {product.stock > 0 ? (
            <div className="space-y-0.5">
              <ProductPrice value={priceNum} className="text-base sm:text-lg font-bold text-foreground" />
              {priceNum >= 30 && (
                <p className="text-[10px] text-muted-foreground">
                  o 3 rate da <span className="font-semibold text-pink-600 dark:text-pink-400">€{installment}</span>
                </p>
              )}
            </div>
          ) : (
            <p className="text-xs font-semibold text-destructive">Non disponibile</p>
          )}
        </div>

        <Link
          href={`/product/${product.slug}`}
          className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-1"
        >
          Dettagli →
        </Link>
      </div>
    </Card>
  );
};

export default ProductCard;
