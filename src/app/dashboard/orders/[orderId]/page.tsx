import Link from "next/link";
import {
  Euro, // Importata l'icona Euro
  Clock,
  Package,
  MapPin,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Calendar,
  CreditCard,
  Home,
  Tag,
} from "lucide-react";
import { notFound } from "next/navigation";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import { OrderStatus } from "@/types";
import { getOrderDetailsAction } from "@/lib/actions/user.actions";
import { formatCurrency, formatOrderDate } from "@/lib/utils"; // Import delle utility

// --- DEFINIZIONI DI TIPO AGGIORNATE (Mantenute Invariate) ---
type OrderDetails = {
  itemsPrice: number;
  taxPrice: number;
  totalPrice: number;
  shippingPrice: number;

  deliveredAt: Date | null;
  id: string;
  orderNumber: string;
  createdAt: Date;
  status: OrderStatus;
  shippingAddress: {
    firstName: string;
    lastName: string;
    street: string;
    houseNumber: string;
    postalCode: string;
    city: string;
    country: string;
    phoneNumber: string;
  };
  paymentmethod: string;
  OrderItem: {
    name: string;
    price: number;
    qty: number;
    slug: string;
    image: string;
  }[];
};

// --- MAPPA DELLO STATO ---
const statusMap: Record<
  OrderStatus,
  { icon: any; color: string; text: string }
> = {
  PENDING_PAYMENT: {
    icon: Clock,
    color: "text-yellow-700 bg-yellow-100",
    text: "In Attesa di Pagamento",
  },
  PAID: {
    icon: Euro, // Usiamo Euro come icona di Pagato
    color: "text-green-700 bg-green-200", 
    text: "Pagato / In Elaborazione",
  },
  SHIPPED: {
    icon: Package,
    color: "text-blue-600 bg-blue-100",
    text: "Spedito",
  },
  DELIVERED: {
    icon: CheckCircle,
    color: "text-lime-700 bg-lime-100", 
    text: "Consegnato",
  },
  CANCELLED: {
    icon: XCircle,
    color: "text-red-600 bg-red-100",
    text: "Annullato",
  },
};

// --- COMPONENTE PAGE (Server Component) ---

interface OrderDetailsPageProps {
  params: {
    orderId: string;
  };
}
export default async function OrderDetailsPage({
  params,
}: OrderDetailsPageProps) {
  // Risoluzione definitiva del conflitto Next.js/TypeScript
  const resolvedParams = await (params as any);
  const { orderId } = resolvedParams;

  // Utilizziamo orderId per chiamare la Server Action
  const order = (await getOrderDetailsAction(orderId)) as OrderDetails | null;

  if (!order) {
    notFound();
  }

  const currentStatus = statusMap[order.status as OrderStatus];
  const orderItems = order.OrderItem || []; // Assicuriamo che sia un array per l'iterazione

  return (
    <main className="p-4 sm:p-8 lg:p-10 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 border-b pb-4">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-4 sm:mb-0">
            Dettagli Ordine:{" "}
            <span className="text-indigo-600">{order.orderNumber}</span>
          </h1>
          <div className="flex items-center space-x-4">
            <Link
              href="/dashboard/orders"
              className="text-indigo-600 hover:text-indigo-800 flex items-center transition font-medium text-base p-2 rounded-lg hover:bg-indigo-50"
            >
              <ArrowLeft className="w-5 h-5 mr-2" /> Vai agli Ordini
            </Link>
            <Link
              href="/"
              className="text-gray-500 hover:text-indigo-600 flex items-center transition font-medium text-base p-2 rounded-lg hover:bg-gray-100"
            >
              <Home className="w-5 h-5 mr-1" /> Home
            </Link>
          </div>
        </div>

        {/* --- 2. Stato e Riassunto (Layout a Griglia) --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {/* Card 1: Stato (Colorata in base al tuo statusMap) */}
          <div
            className={`p-6 rounded-xl shadow-xl transition hover:shadow-2xl border border-gray-100 flex flex-col justify-between ${currentStatus.color
              .replace(/text-(.*)-(\d+)/, "bg-$1-$2") // Usa il bg corretto
              .replace("700", "50")} border-l-4 ${currentStatus.color.replace("bg-", "border-").replace("100", "700")}`}
          >
            <div className="flex items-center w-full">
              <div
                className={`p-3 rounded-full mr-3 ${currentStatus.color
                  .replace("text-", "bg-")
                  .replace("700", "200")}`}
              >
                <currentStatus.icon
                  className={`w-7 h-7 ${currentStatus.color}`}
                />
              </div>
              <span className="text-2xl font-extrabold text-gray-800">
                {currentStatus.text}
              </span>
            </div>
            <p className="mt-4 text-sm text-gray-600 pt-3 border-t border-gray-200">
              {order.status === "DELIVERED" && order.deliveredAt
                ? "Consegnato il:"
                : "Ordine piazzato il:"}
              <span className="font-bold text-gray-900 ml-2">
                {order.status === "DELIVERED" && order.deliveredAt
                  ? formatOrderDate(order.deliveredAt)
                  : formatOrderDate(order.createdAt)}
              </span>
            </p>
          </div>

          {/* Card 2: Totale Ordine */}
          <div className="bg-white p-6 rounded-xl shadow-xl transition hover:shadow-2xl border border-gray-100 flex items-center">
            {/* ICONA AGGIORNATA: Euro */}
            <Euro className="w-7 h-7 text-green-600 mr-4" /> 
            <div>
              <p className="text-sm font-medium text-gray-500">Totale Speso</p>
              <p className="text-2xl font-bold text-gray-800">
                {formatCurrency(order.totalPrice)}
              </p>
            </div>
          </div>

          {/* Card 3: Data Ordine */}
          <div className="bg-white p-6 rounded-xl shadow-xl transition hover:shadow-2xl border border-gray-100 flex items-center">
            <Calendar className="w-7 h-7 text-indigo-500 mr-4" />
            <div>
              <p className="text-sm font-medium text-gray-500">Data Creazione</p>
              <p className="text-2xl font-bold text-gray-800">
                {formatOrderDate(order.createdAt)}
              </p>
            </div>
          </div>

          {/* Card 4: Metodo di Pagamento */}
          <div className="bg-white p-6 rounded-xl shadow-xl transition hover:shadow-2xl border border-gray-100 flex items-center">
            <CreditCard className="w-7 h-7 text-gray-500 mr-4" />
            <div>
              <p className="text-sm font-medium text-gray-500">
                Metodo Pagamento
              </p>
              <p className="text-2xl font-bold text-gray-800">
                {order.paymentmethod}
              </p>
            </div>
          </div>
        </div>

        {/* --- 3. Contenuto principale: Prodotti e Dettagli (Griglia 2:1) --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Colonna 1 (2/3): Articoli Ordinati */}
          <div className="lg:col-span-2">
            <section className="bg-white p-6 rounded-xl shadow-xl border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-3">
                Articoli Ordinati ({orderItems.length})
              </h2>
              <div className="space-y-4 divide-y divide-gray-100">
                {orderItems.length > 0 ? (
                  orderItems.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-start justify-between py-4 sm:py-5 first:pt-0"
                    >
                      <div className="flex items-start">
                        {/* Immagine */}
                        <ImageWithFallback
                          src={item.image}
                          alt={item.name}
                          className="w-24 h-24 object-cover rounded-lg mr-4 border border-gray-200 flex-shrink-0 shadow-md"
                        />
                        <div className="pt-1">
                          <Link
                            href={`/products/${item.slug}`}
                            className="font-semibold text-gray-800 hover:text-indigo-600 transition text-xl leading-tight"
                          >
                            {item.name}
                          </Link>
                          <p className="text-sm text-gray-500 mt-2 flex items-center">
                             <Tag className="w-4 h-4 mr-1 text-gray-400" /> Unitario:
                            <span className="font-semibold text-gray-700 ml-1">
                               {formatCurrency(item.price)}
                            </span>
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            Qtà:
                            <span className="font-bold text-gray-700 ml-1">{item.qty}</span>
                          </p>
                        </div>
                      </div>

                      {/* Totale riga */}
                      <div className="text-right ml-4 flex-shrink-0">
                        <p className="font-extrabold text-gray-900 text-2xl">
                          {formatCurrency(item.price * item.qty)}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 py-4 italic">
                    Nessun articolo trovato per questo ordine.
                  </p>
                )}
              </div>
            </section>
          </div>

          {/* Colonna 2 (1/3): Indirizzo e Costi */}
          <div className="lg:col-span-1 space-y-8">
            {/* Indirizzo di Spedizione */}
            <section className="bg-white p-6 rounded-xl shadow-xl transition hover:shadow-2xl border border-gray-100">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center border-b pb-3">
                <MapPin className="w-6 h-6 mr-2 text-indigo-500" /> Indirizzo di
                Spedizione
              </h2>
              <address className="not-italic text-gray-700 space-y-1 text-base">
                <p className="font-bold text-gray-900 text-lg">
                  {order.shippingAddress.firstName} {order.shippingAddress.lastName}
                </p>
                <p>
                  {order.shippingAddress.street}, {order.shippingAddress.houseNumber}
                </p>
                <p>
                  {order.shippingAddress.postalCode} {order.shippingAddress.city}
                </p>
                <p>{order.shippingAddress.country}</p>
                <p className="mt-3 text-sm text-gray-500 pt-2 border-t border-gray-100">
                  <span className="font-medium text-gray-600">Tel:</span>{" "}
                  {order.shippingAddress.phoneNumber}
                </p>
              </address>
            </section>

            {/* Riepilogo Economico */}
            <section className="bg-white p-6 rounded-xl shadow-xl transition hover:shadow-2xl border border-gray-100">
              <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-3">
                Riepilogo Costi
              </h2>
              <div className="space-y-3 text-gray-600">
                {/* Subtotale */}
                <div className="flex justify-between text-base">
                  <span>Subtotale Articoli:</span>
                  <span className="font-medium text-gray-800">
                    {formatCurrency(order.itemsPrice)}
                  </span>
                </div>

                {/* Spedizione */}
                <div className="flex justify-between text-base">
                  <span>Spedizione:</span>
                  <span className="font-medium text-gray-800">
                    {order.shippingPrice === 0 ? "Gratuita" : formatCurrency(order.shippingPrice)}
                  </span>
                </div>

                {/* Tasse */}
                <div className="flex justify-between text-base">
                  <span>Tasse (IVA):</span>
                  <span className="font-medium text-gray-800">
                    {formatCurrency(order.taxPrice)}
                  </span>
                </div>

                {/* Totale Finale */}
                <div className="flex justify-between pt-4 border-t border-gray-300 text-2xl font-bold text-gray-800">
                  <span>Totale Ordine:</span>
                  <span className="text-green-700 text-3xl">
                    {formatCurrency(order.totalPrice)}
                  </span>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}