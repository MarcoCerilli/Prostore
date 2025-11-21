import Image from "next/image";
import { Card, CardContent, CardHeader } from "../../card";
import Link from "next/link";
import ProductPrice from "./product-price";
import { Product } from "@/types";
import Rating from "../../rating";

const ProductCard = ({ product }: { product: Product }) => {
  // URL dell'immagine: usa la prima immagine O un placeholder se non esiste
  const imageUrl =
    (Array.isArray(product.images) && product.images[0]) ||
    "https://i.placehold.co/300x300/e5e7eb/777777?text=No+Image";

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="p-0 items-center">
        <Link href={`/product/${product.slug}`}>
          <Image
            src={imageUrl}
            alt={product.name}
            height={300}
            width={300}
            priority={true}
            className="rounded-t-lg object-cover"
          />
        </Link>
      </CardHeader>
      <CardContent className="p-4 grid gap-4">
        <div className="text-xs">{product.brand}</div>
        <Link href={`/product/${product.slug}`}>
          <h2 className="h2 text-sm font-medium">{product.name}</h2>
        </Link>
        <div className="flex justify-between items-center gap-4">
         <Rating 
                value={Number(product.rating) || 0} 
                // Se hai il conteggio delle recensioni, aggiungilo qui:
                // reviewCount={product.numReviews} 
            />
          {product.stock > 0 ? (
            <ProductPrice value={Number(product.price)} className="text-500" />
          ) : (
            <p className="text-destructive">Out of Stock</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductCard;
