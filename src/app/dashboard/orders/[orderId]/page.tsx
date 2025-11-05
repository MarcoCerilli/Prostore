import Link from "next/link";
import { DollarSign, Clock, Package, MapPin, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';
import { notFound } from 'next/navigation';
import prisma from "@/db/prisma";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback"; // ✅ Ora funziona!

// --- DEFINIZIONI DI TIPO (Type Definitions) ---

// Tipo specifico per l'indirizzo di spedizione (campo JSON nel DB)
type ShippingAddressDB = {
    name: string;
    street: string;
    city: string;
    zip: string;
    country: string;
    // Aggiungi altri campi se presenti nel JSON, es. phone
};

type OrderItemRender = {
    name: string;
    price: number;
    qty: number;
    slug: string;
    image: string;
};

// Tipo adattato per riflettere i campi del tuo modello Order
type OrderDetails = {
    itemsPrice: any;
    taxPrice: any;
    deliveredAt: Date | null;
    id: string; // ID interno
    orderNumber: string; // Il numero leggibile
    createdAt: Date;
    isPaid: boolean;
    isDelivered: boolean;
    totalPrice: number;
    shippingPrice: number;
    shippingAddress: ShippingAddressDB; // Tipizzazione corretta del campo JSON
    OrderItem: OrderItemRender[];
    paymentmethod: string;
};


// --- FUNZIONE DI RECUPERO DATI (Server Side) ---

/**
 * Funzione per il recupero dei dettagli dell'ordine DA PRISMA
 * @param orderNumber Il numero d'ordine leggibile
 */
const getOrderDetails = async (orderNumber: string): Promise<OrderDetails | null> => {
    try {
        const order = await prisma.order.findUnique({
            where: {
                orderNumber: orderNumber, // Usiamo orderNumber per il lookup
            },
            include: {
                OrderItem: true, // Se hai un 'select' limitato, usa quello, altrimenti 'true' è più semplice
                // user: { select: { name: true } }, // Lasciato commentato se non usato
            },
        }) as OrderDetails | null; 

        return order;
    } catch (error) {
        console.error("Errore nel recupero dell'ordine da DB:", error);
        return null;
    }
};

// --- MAPPA DELLO STATO ---

const statusMap = {
    'In elaborazione': { icon: Clock, color: 'text-yellow-600 bg-yellow-100', text: 'In Elaborazione' },
    'Spedito': { icon: Package, color: 'text-blue-600 bg-blue-100', text: 'Spedito' },
    'Consegnato': { icon: CheckCircle, color: 'text-green-600 bg-green-100', text: 'Consegnato' },
    'Annullato': { icon: XCircle, color: 'text-red-600 bg-red-100', text: 'Annullato' },
};


// --- COMPONENTE PAGE (Server Component) ---

interface OrderDetailsPageProps {
    params: {
        orderId: string; // Il router passa il parametro come orderId, che è l'orderNumber
    };
}

export default async function OrderDetailsPage({ params }: OrderDetailsPageProps) {
    // Destrutturazione diretta: non è necessario l'await sui params
    const { orderId } = await params; 
    
    const order = await getOrderDetails(orderId);

    if (!order) {
        notFound();
    }
    
    // Logica di determinazione dello stato (basata sui flag)
    let statusKey: keyof typeof statusMap;
    if (order.isDelivered && order.deliveredAt) { // Controlliamo anche deliveredAt per sicurezza
        statusKey = 'Consegnato';
    } else if (order.isPaid) {
        statusKey = 'Spedito'; 
    } else {
        statusKey = 'In elaborazione';
    }

    const currentStatus = statusMap[statusKey];
    const subtotal = order.OrderItem.reduce((sum, item) => sum + item.price * item.qty, 0);

    return (
       <main className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
    <div className="max-w-6xl mx-auto">
        
        {/* --- 1. Intestazione e Link --- */}
        <div className="flex justify-between items-center mb-8 border-b pb-4">
            <h1 className="text-3xl font-extrabold text-gray-900">
                Dettagli Ordine: <span className="text-indigo-600">{order.orderNumber}</span>
            </h1>
            <Link href="/dashboard/orders" className="text-indigo-600 hover:text-indigo-800 flex items-center transition font-medium">
                <ArrowLeft className="w-4 h-4 mr-1"/> Tutti gli Ordini
            </Link>
        </div>

        {/* --- 2. Stato e Riassunto (3 Card) --- */}
        {/* ✅ Card inserite nel loro contenitore a griglia */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            
            {/* Card 1: Stato */}
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 flex flex-col justify-between">
                <div className={`flex items-center w-full`}>
                    <div className={`p-2 rounded-full mr-3 ${currentStatus.color} ${currentStatus.color.replace('text-', 'bg-').replace('600', '100')}`}>
                        <currentStatus.icon className="w-5 h-5" />
                    </div>
                    <span className="text-xl font-bold text-gray-800">{currentStatus.text}</span>
                </div>
                
                <p className="mt-4 text-sm text-gray-500 pt-3 border-t border-gray-100">
                    {order.isDelivered && order.deliveredAt ? 'Consegnato il:' : 'Creato il:'} 
                    <span className="font-semibold text-gray-700">
                        {order.isDelivered && order.deliveredAt ? order.deliveredAt.toLocaleDateString('it-IT') : order.createdAt.toLocaleDateString('it-IT')}
                    </span>
                </p>
            </div>

            {/* Card 2: Data Ordine */}
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 flex items-start"> 
                <Clock className="w-8 h-8 text-gray-500 mr-4 mt-1" />
                <div>
                    <p className="text-sm font-medium text-gray-500">Data Ordine</p>
                    <p className="text-2xl font-bold text-gray-800">{order.createdAt.toLocaleDateString('it-IT')}</p>
                </div>
            </div>

            {/* Card 3: Totale */}
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 flex items-start">
                <DollarSign className="w-8 h-8 text-green-600 mr-4 mt-1" />
                <div>
                    <p className="text-sm font-medium text-gray-500">Totale Pagato</p>
                    <p className="text-2xl font-bold text-green-700">€ {order.totalPrice.toFixed(2)}</p>
                </div>
            </div>
        </div>

        {/* --- 3. Contenuto principale: Prodotti e Dettagli (Griglia 2:1) --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Colonna 1 (2/3): Articoli Ordinati */}
            <div className="lg:col-span-2">
                <section className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-3">Articoli Ordinati</h2>

                    <div className="space-y-4 divide-y divide-gray-100"> 
                        {order.OrderItem.map((item, index) => (
                            <div key={index} className="flex items-start justify-between py-4 sm:py-5 first:pt-0">
                                <div className="flex items-start">
                                    {/* Immagine */}
                                    <ImageWithFallback
                                        src={item.image} 
                                        alt={item.name} 
                                        className="w-16 h-16 object-cover rounded-lg mr-4 border border-gray-100 flex-shrink-0" 
                                    />
                                    <div className="pt-1">
                                        <Link href={`/products/${item.slug}`} className="font-semibold text-gray-800 hover:text-indigo-600 transition text-lg">
                                            {item.name}
                                        </Link>
                                        <p className="text-sm text-gray-500 mt-1">Quantità: {item.qty}</p>
                                        <p className="text-xs text-gray-400">Prezzo unità: € {item.price.toFixed(2)}</p> 
                                    </div>
                                </div>
                                
                                {/* Totale riga */}
                                <div className="text-right ml-4 flex-shrink-0">
                                    <p className="font-bold text-gray-900 text-xl">€ {(item.price * item.qty).toFixed(2)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>

            {/* Colonna 2 (1/3): Indirizzo e Costi */}
            <div className="lg:col-span-1 space-y-8">
                
                {/* Indirizzo di Spedizione */}
                <section className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                    <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                        <MapPin className="w-5 h-5 mr-2 text-indigo-500" /> Indirizzo di Spedizione
                    </h2>
                    <address className="not-italic text-gray-700 space-y-1 text-base">
                        <p className="font-semibold text-gray-900">{order.shippingAddress.name}</p>
                        <p>{order.shippingAddress.street}</p>
                        <p>{order.shippingAddress.zip} {order.shippingAddress.city}</p>
                        <p>{order.shippingAddress.country}</p>
                    </address>
                </section>

                {/* Riepilogo Economico */}
                <section className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                    <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-3">Riepilogo Costi</h2>
                    
                    <div className="space-y-3 text-gray-600">
                        <div className="flex justify-between text-base">
                            <span>Subtotale Articoli:</span>
                            <span className="font-medium text-gray-800">€ {subtotal.toFixed(2)}</span> 
                        </div>
                        <div className="flex justify-between text-base">
                            <span>Spedizione:</span>
                            <span className="font-medium text-gray-800">€ {order.shippingPrice.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-base">
                            <span>Tasse (IVA):</span>
                            <span className="font-medium text-gray-800">€ {order.taxPrice.toFixed(2)}</span> 
                        </div>
                        
                        <div className="flex justify-between pt-4 border-t border-gray-200 text-xl font-bold text-gray-800">
                            <span>Totale Ordine:</span>
                            <span className="text-green-700 text-2xl">€ {order.totalPrice.toFixed(2)}</span>
                        </div>
                    </div>
                    
                    <p className="mt-6 text-sm text-gray-500 border-t pt-3">
                        Metodo di pagamento: <span className="font-semibold text-gray-700">{order.paymentmethod}</span>
                    </p>
                </section>
            </div>
        </div>
    </div>
</main>
    );
}