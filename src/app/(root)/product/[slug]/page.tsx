import { getProductBySlug } from "@/lib/actions/product.actions";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import ProductPrice from "@/components/ui/shared/product/product-price";
import ProductImages from "@/components/ui/shared/product/product-images";
import AddToCart from "@/components/ui/shared/product/add-to-cart";
import { getMyCart } from "@/lib/actions/cart.queries";
import { Decimal } from "@prisma/client/runtime/library"; // Importa Decimal
import { CartItem } from "@/types"; // Importa CartItem dal tuo types file

export const dynamic = 'force-dynamic';

// 🛑 STEP 1: Definisci il tipo serializzato che AddToCart si aspetterà
// Questo è il tipo CLAN_CART definito in add-to-cart.tsx
type SerializedCart = {
    id: string; 
    createdAt: string; 
    userId: string | null; 
    sessionCartId: string; 
    items: CartItem[]; // Array di tipi puliti
    itemsPrice: number; 
    totalPrice: number;
    shippingPrice: number;
    taxPrice: number;
} | null;

// 🛑 STEP 2: Funzione di serializzazione (CRITICA PER RISOLVERE L'ERRORE)
// Converte l'oggetto Prisma (con Decimal e Date) in un oggetto JavaScript puro
const serializeCart = (cart: Awaited<ReturnType<typeof getMyCart>>): SerializedCart => {
    if (!cart) return null;

    // Funzione di REPLACEMENT per JSON.stringify che converte Decimal in number e Date in stringa
    const replacer = (key: string, value: any) => {
        if (value instanceof Decimal) {
            return value.toNumber();
        }
        if (value instanceof Date) {
            return value.toISOString();
        }
        return value;
    };

    // Serializzazione completa dell'oggetto rawCart utilizzando il replacer
    const jsonString = JSON.stringify(cart, replacer);
    
    // Deserializzazione dell'oggetto serializzato
    // Usiamo il cast al tipo atteso SerializedCart
    const serializedObject = JSON.parse(jsonString) as SerializedCart;

    // Next.js richiede che i campi itemsPrice, totalPrice, etc. siano number.
    // Dobbiamo estrarli per assicurarci che il casting sia corretto
    return {
        id: serializedObject!.id,
        createdAt: serializedObject!.createdAt,
        userId: serializedObject!.userId,
        sessionCartId: serializedObject!.sessionCartId,
        items: serializedObject!.items,
        // Questi sono ora garantiti essere number grazie al replacer/parse:
        itemsPrice: serializedObject!.itemsPrice, 
        totalPrice: serializedObject!.totalPrice,
        shippingPrice: serializedObject!.shippingPrice,
        taxPrice: serializedObject!.taxPrice,
    } as SerializedCart;
}


const ProductDetailsPage = async (props: {
  params: Promise<{ slug: string }>;
}) => {
  const { slug } = await props.params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  // 1. Esegui la query
  const rawCart = await getMyCart();
  
  // 2. 🛑 APPLICA LA SERIALIZZAZIONE ROBUSTA PRIMA DI PASSARE AL CLIENT COMPONENT
  const cart = serializeCart(rawCart);

  return (
    <>
      <section>
        <div className="grid grid-cols-1 md:grid-cols-5">
          {/* Images Column*/}
          <div className="col-span-2">
            <ProductImages images={product.images} />
          </div>
          {/* Details Column*/}
          <div className="col-span-2 p-5">
            <div className="flex flex-col gap-6">
              <p>
                {product.brand}
                {product.category}
              </p>
              <h1 className="h3-bold">{product.name}</h1>
              <p>
                {product.rating.toString()} of {product.numReviews} Reviews
              </p>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <ProductPrice
                  // Assicurati che il prezzo del prodotto sia un number (Prisma lo restituisce come Decimal)
                  value={Number(product.price)} 
                  className="w-24 roundend-full bg-green-100 text-green-700 px-5 py-2"
                />
              </div>
            </div>
            <div className="mt-10">
              <p className="font-semibold">Description</p>
              <p>{product.description}</p>
            </div>
          </div>
          {/*Action column */}
          <div>
            <Card>
              <CardContent className="p-4">
                <div className="mb-2 flex justify-between">
                  <div>Price</div>
                  <div>
                    <ProductPrice value={Number(product.price)} />
                  </div>
                </div>
                <div className="mb-2 flex justify-between">
                  <div>Status</div>
                  {product.stock > 0 ? (
                    <Badge variant="outline">In Stock</Badge>
                  ) : (
                    <Badge variant="destructive">Out of Stock</Badge>
                  )}
                </div>
                {product.stock > 0 && (
                  <div className="flex-center">
                    <AddToCart
                      // 3. PASSA IL CARRELLO SERIALIZZATO
                      cart={cart}
                      item={{
                        productId: product.id,
                        name: product.name,
                        slug: product.slug,
                        // Assicurati che il prezzo dell'articolo sia un number
                        price: Number(product.price), 
                        qty: 1,
                        image: product.images?.[0],
                      }}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </>
  );
};

export default ProductDetailsPage;
