import { getProductBySlug } from "@/lib/actions/product.actions";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator"; // 🛑 CORREZIONE: Usa il tuo componente UI/Separator
import { Star } from "lucide-react"; // Importa l'icona Star
import ProductPrice from "@/components/ui/shared/product/product-price";
import ProductImages from "@/components/ui/shared/product/product-images";
import AddToCart from "@/components/ui/shared/product/add-to-cart";
import { getMyCart } from "@/lib/actions/cart.queries";
import { Decimal } from "@prisma/client/runtime/library"; 
import { CartItemFrontend } from "@/types"; 

export const dynamic = 'force-dynamic';

// --- Tipi per Serializzazione ---
// (Il blocco SerializedCart e serializeCart non necessita di modifiche funzionali, 
// ma il return è stato semplificato per chiarezza, è meno fragile.)

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

const serializeCart = (cart: Awaited<ReturnType<typeof getMyCart>>): SerializedCart => {
    if (!cart) return null;

    const replacer = (key: string, value: any) => {
        if (value instanceof Decimal) return value.toNumber();
        if (value instanceof Date) return value.toISOString();
        return value;
    };

    const jsonString = JSON.stringify(cart, replacer);
    return JSON.parse(jsonString) as SerializedCart;
}

// --- Componente: Visualizzazione Stelle Grafiche ---
interface StarRatingProps {
    value: number;
}

const StarRatingDisplay = ({ value }: StarRatingProps) => {
    const maxStars = 5;
    const fullStars = Math.floor(value);
    // Logica per mostrare mezza stella
    const hasHalfStar = value % 1 >= 0.25 && value % 1 < 0.75; 
    const emptyStars = maxStars - fullStars - (hasHalfStar ? 1 : 0);

    return (
        <div className="flex items-center space-x-0.5">
            {/* Stelle Piene */}
            {Array.from({ length: fullStars }).map((_, i) => (
                <Star key={`full-${i}`} className="w-4 h-4 text-yellow-500 fill-yellow-500" />
            ))}
            {/* Mezza Stella */}
            {hasHalfStar && (
                <div className="relative">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 absolute top-0 left-0" style={{ clipPath: 'inset(0 50% 0 0)' }} />
                    <Star className="w-4 h-4 text-gray-300" /> 
                </div>
            )}
            {/* Stelle Vuote */}
            {Array.from({ length: emptyStars }).map((_, i) => (
                <Star key={`empty-${i}`} className="w-4 h-4 text-gray-300" />
            ))}
        </div>
    );
};
// ----------------------------------------------------

// --- Componente Principale ---

const ProductDetailsPage = async (props: {
    params: Promise<{ slug: string }>;
}) => {
    const { slug } = await props.params;
    const product = await getProductBySlug(slug);
    if (!product) notFound();

    const rawCart = await getMyCart();
    const cart = serializeCart(rawCart);

    const productPriceNumber = Number(product.price); 
    // Assicurati di convertire rating
    const productRatingNumber = Number(product.rating); 

    return (
        // 🛑 CORREZIONE LAYOUT: Usa max-w-7xl mx-auto per centrare, SENZA 'container'
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16 min-h-screen">
            
            {/* CONTENITORE PRINCIPALE: GRIGLIA ASIMMETRICA 3:2 (Totale 5 colonne) */}
            <div className="grid grid-cols-1 lg:grid-cols-7 gap-x-12 gap-y-10">
                
                {/* COLONNA 1 (Immagini: 3/5) */}
                <div className="lg:col-span-3">
                    <ProductImages images={product.images} />
                </div>
                
                {/* COLONNA 2 (Dettagli Prodotto & Acquisto: 2/5) */}
                <div className="lg:col-span-3 space-y-6">
                    
                    {/* 1. Dettagli/Header Prodotto */}
                    <header className="pb-6 border-b border-gray-200 mb-6 space-y-3">
                        <p className="text-sm font-medium text-gray-500">
                            {product.brand} / <span className="text-indigo-600">{product.category}</span>
                        </p>
                        <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-gray-900">
                            {product.name}
                        </h1>
                        
                        {/* Sezione Recensioni con Stelle Grafiche */}
                        <div className="flex items-center text-sm text-gray-600">
                            <StarRatingDisplay value={productRatingNumber} />
                            
                            <span className="font-bold ml-2">
                                {productRatingNumber.toFixed(1)} 
                            </span>
                            <span className="ml-2 border-l border-gray-300 pl-2">
                                ({product.numReviews} Recensioni)
                            </span>
                        </div>
                    </header>

                    {/* 2. Box Acquisto (Prezzo, Stock, AddToCart) */}
                    <Card className="shadow-lg border border-gray-100">
                        <CardContent className="p-6 space-y-6">
                            
                            {/* Prezzo e Disponibilità */}
                            <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                                <div>
                                    <span className="text-sm font-medium text-gray-500 block mb-1">Prezzo:</span>
                                    <ProductPrice 
                                        value={productPriceNumber} 
                                        className="text-3xl font-bold text-gray-900" 
                                    />
                                </div>
                                
                                <div className="text-right">
                                    {product.stock > 0 ? (
                                        <Badge className="bg-green-500 hover:bg-green-600 text-sm py-1 px-3">In Stock</Badge>
                                    ) : (
                                        <Badge variant="destructive" className="text-sm py-1 px-3">Non Disponibile</Badge>
                                    )}
                                </div>
                            </div>

                            {/* Componente AddToCart */}
                            {product.stock > 0 && (
                                <div className="pt-2">
                                    <AddToCart
                                        cart={cart}
                                        item={{
                                            id: product.id,
                                            name: product.name,
                                            slug: product.slug,
                                            // Converte il prezzo in stringa per l'utilizzo nel carrello
                                            price: productPriceNumber.toFixed(2), 
                                            quantity: 1, 
                                            image: product.images?.[0] || '',
                                        }}
                                    />
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Servizi Aggiuntivi (Esempio) */}
                    <div className="mt-6 text-sm text-gray-600 space-y-2">
                        <div className="flex items-center">📦 Spedizione rapida in 24/48h</div>
                        <div className="flex items-center">🔄 Reso facile entro 30 giorni</div>
                    </div>

                </div>
            </div>
            
            {/* SEZIONE DESCRIZIONE & DETTAGLI (A tutta larghezza nel container principale) */}
            <section className="mt-16 pt-10 border-t border-gray-200">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Descrizione Prodotto</h2>
                <div className="text-gray-700 leading-relaxed max-w-4xl">
                    {product.description}
                </div>
            </section>
        </main>
    );
};

export default ProductDetailsPage;