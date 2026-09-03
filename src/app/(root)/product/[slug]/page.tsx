import { getProductBySlug } from "@/lib/actions/product.actions";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Star, Truck, RotateCcw, ShieldCheck } from "lucide-react";
import ProductPrice from "@/components/ui/shared/product/product-price";
import ProductImages from "@/components/ui/shared/product/product-images";
import AddToCart from "@/components/ui/shared/product/add-to-cart";
import { getMyCart } from "@/lib/actions/cart.queries";
import { Decimal } from "@prisma/client/runtime/library";
import { CartItemFrontend } from "@/types";
import ReviewList from "./review-list";
import { auth } from "@/auth";
import {
  InstallmentBanner,
  PaymentBadgesList,
} from "@/components/ui/shared/payment-badges";
import { normalizeProductImage } from "@/lib/image-utils";

export const dynamic = "force-dynamic";

// --- Tipi per Serializzazione ---
type SerializedCart = {
  id: string;
  createdAt: string;
  userId: string | null;
  sessionCartId: string;
  items: CartItemFrontend[];
  itemsPrice: number;
  totalPrice: number;
  shippingPrice: number;
  taxPrice: number;
} | null;

const serializeCart = (
  cart: Awaited<ReturnType<typeof getMyCart>>
): SerializedCart => {
  if (!cart) return null;
  const replacer = (key: string, value: unknown) => {
    if (value instanceof Decimal) return value.toNumber();
    if (value instanceof Date) return value.toISOString();
    return value;
  };
  const jsonString = JSON.stringify(cart, replacer);
  return JSON.parse(jsonString) as SerializedCart;
};

// --- Componente: Visualizzazione Stelle Grafiche ---
interface StarRatingProps {
  value: number;
}

const StarRatingDisplay = ({ value }: StarRatingProps) => {
  const maxStars = 5;
  const fullStars = Math.floor(value);
  const hasHalfStar = value % 1 >= 0.25 && value % 1 < 0.75;
  const emptyStars = maxStars - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div className="flex items-center space-x-0.5">
      {/* Stelle Piene */}
      {Array.from({ length: fullStars }).map((_, i) => (
        <Star
          key={`full-${i}`}
          className="w-4 h-4 text-yellow-500 fill-yellow-500"
        />
      ))}
      {/* Mezza Stella */}
      {hasHalfStar && (
        <div className="relative">
          <Star
            className="w-4 h-4 text-yellow-500 fill-yellow-500 absolute top-0 left-0"
            style={{ clipPath: "inset(0 50% 0 0)" }}
          />
          <Star className="w-4 h-4 text-muted-foreground/30" />
        </div>
      )}
      {/* Stelle Vuote */}
      {Array.from({ length: emptyStars }).map((_, i) => (
        <Star key={`empty-${i}`} className="w-4 h-4 text-muted-foreground/30" />
      ))}
    </div>
  );
};

// --- Componente Principale ---
const ProductDetailsPage = async (props: {
  params: Promise<{ slug: string }>;
}) => {
  const { slug } = await props.params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const session = await auth();
  const userId = session?.user?.id || null;
  const userIdString = userId || "";

  const rawCart = await getMyCart();
  const cart = serializeCart(rawCart);

  const productPriceNumber = Number(product.price);
  const productRatingNumber = Number(product.rating);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16 min-h-screen">
      {/* CONTENITORE PRINCIPALE: GRIGLIA */}
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-x-12 gap-y-10">
        {/* COLONNA 1 (Immagini: 3/7) */}
        <div className="lg:col-span-3">
          <ProductImages images={product.images} />
        </div>

        {/* COLONNA 2 (Dettagli Prodotto & Acquisto: 4/7) */}
        <div className="lg:col-span-4 space-y-6">
          {/* 1. Dettagli/Header Prodotto */}
          <header className="pb-6 border-b border-border/60 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <span>{product.brand}</span>
              <span>/</span>
              <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                {product.category}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-foreground">
              {product.name}
            </h1>

            {/* Sezione Recensioni con Stelle Grafiche */}
            <div className="flex items-center text-sm text-muted-foreground">
              <StarRatingDisplay value={productRatingNumber} />
              <span className="font-bold text-foreground ml-2">
                {productRatingNumber.toFixed(1)}
              </span>
              <span className="ml-2 border-l border-border pl-2">
                ({product.numReviews} Recensioni)
              </span>
            </div>
          </header>

          {/* 2. Box Acquisto (Prezzo, Stock, AddToCart) */}
          <Card className="shadow-lg border border-border/60 bg-card rounded-2xl overflow-hidden">
            <CardContent className="p-6 space-y-5">
              {/* Prezzo e Disponibilità */}
              <div className="flex justify-between items-center pb-4 border-b border-border/40">
                <div>
                  <span className="text-xs font-medium text-muted-foreground block mb-1">
                    Prezzo al pubblico:
                  </span>
                  <ProductPrice
                    value={productPriceNumber}
                    className="text-3xl font-extrabold text-foreground"
                  />
                </div>

                <div className="text-right">
                  {product.stock > 0 ? (
                    <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs py-1 px-3 rounded-full flex items-center gap-1.5 shadow-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      Disponibile ({product.stock} pz)
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="text-xs py-1 px-3 rounded-full">
                      Non Disponibile
                    </Badge>
                  )}
                </div>
              </div>

              {/* Banner Rateizzazione Klarna / PayPal */}
              {productPriceNumber >= 30 && (
                <InstallmentBanner price={productPriceNumber} />
              )}

              {/* Componente AddToCart */}
              {product.stock > 0 && (
                <div className="pt-2">
                  <AddToCart
                    cart={cart}
                    item={{
                      productId: product.id,
                      id: product.id,
                      name: product.name,
                      slug: product.slug,
                      price: productPriceNumber,
                      quantity: 1,
                      image: normalizeProductImage(
                        Array.isArray(product.images)
                          ? product.images[0]
                          : (product.images as unknown as string)
                      ),
                    }}
                  />
                </div>
              )}

              {/* Metodi di pagamento accettati */}
              <div className="pt-4 border-t border-border/40 space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="font-medium flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    Pagamenti protetti e crittografati
                  </span>
                </div>
                <PaymentBadgesList />
              </div>
            </CardContent>
          </Card>

          {/* Servizi & Garanzie Store */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-muted/40 border border-border/40 text-xs">
              <Truck className="w-4 h-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
              <div>
                <span className="font-semibold block text-foreground">Spedizione Veloce</span>
                <span className="text-muted-foreground">Consegna in 24/48 ore lavorative</span>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-muted/40 border border-border/40 text-xs">
              <RotateCcw className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              <div>
                <span className="font-semibold block text-foreground">Reso Facile 30gg</span>
                <span className="text-muted-foreground">Soddisfatti o rimborsati al 100%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 🌟 SEZIONE DESCRIZIONE & DETTAGLI 🌟 */}
      <section className="mt-16 pt-10 border-t border-border/60">
        <h2 className="text-2xl text-center font-bold text-foreground mb-4">
          Descrizione Prodotto
        </h2>

        <div className="text-muted-foreground leading-relaxed max-w-4xl mx-auto p-6 sm:p-8 border border-border/60 rounded-2xl shadow-xs bg-indigo-50/40 dark:bg-indigo-950/20 mt-6">
          <p className="text-foreground/90 whitespace-pre-line">{product.description}</p>
        </div>
      </section>

      <Separator className="my-12 max-w-4xl mx-auto" />

      {/* 📝 SEZIONE RECENSIONI */}
      <section className="max-w-4xl mx-auto">
        <ReviewList
          userId={userIdString}
          productId={product.id}
          productSlug={product.slug}
        />
      </section>
    </main>
  );
};

export default ProductDetailsPage;
