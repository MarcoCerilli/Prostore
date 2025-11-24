import {
    Html,
    Body,
    Container,
    Head,
    Heading,
    Text,
    Tailwind,
    Preview,
    Row,
    Column,
    Img,
    Section, 
} from "@react-email/components";

import { Order } from "@/types";
import { formatCurrency } from "../utils";
import sampleData from "@/db/sample-data";

// --- Dati di Anteprima (PreviewProps) ---
// I dati di anteprima rimangono corretti e usano ID statici.
PurchaseReceiptEmail.PreviewProps = {
    order: {
        // --- Campi Base ---
        id: 'ORDER_PREVIEW_123', // Static ID
        userId: 'USER_PREVIEW_123', // Static ID
        createdAt: new Date(),
        
        // --- Campi di Stato ---
        status: 'PAID',
        isDelivered: true, 
        deliveredAt: new Date(),
        isPaid: true,
        paidAt: new Date(), 

        // --- Campi Utente e Pagamento ---
        user: {
            name: 'Marco Cerilli',
            email: 'test@test.com'
        },
        paymentMethod: 'Stripe', 
        
        paymentResult: {
            id: 'PI_PREVIEW_456', // Static ID
            status: 'succeeded',
            price_paid: '100',
            email_address:'test@test.com'
        },

        // --- Campi Prezzo (Numeri) ---
        totalPrice: 100,
        taxPrice: 10,
        shippingPrice: 10,
        itemsPrice: 80,

        // --- Campi Spedizione ---
        shippingAddress: {
            firstName: 'Marco',
            lastName: 'Cerilli',
            street: 'Via della fortuna 5',
            houseNumber: '5', 
            city: 'Terracina',
            postalCode: '04019',
            country:'IT',
        },

        // --- Articoli dell'Ordine (orderItems: OrderItem[]) ---
        orderItems: sampleData.products.slice(0, 2).map((x: any) => ({
            id: 'ITEM_' + x.id, // Static ID
            orderId: 'ORDER_PREVIEW_123', 
            productId: x.id ? x.id.toString() : 'PROD_FALLBACK_1', 
            name: x.name,
            slug: x.slug,
            qty: 1,
            image: x.images[0] || '/images/default.jpg',
            price: parseFloat(x.price) || 50, 
        })).filter((x: any) => x.price > 0),
        
    }     
} as OrderInformationProps

const dateFormatter = new Intl.DateTimeFormat("it", { dateStyle: "medium" });

type OrderInformationProps = {
    order: Order;
};

export default function PurchaseReceiptEmail({ order }: OrderInformationProps) {
    const userName = order.user?.name ?? 'Cliente'; 

    return (
        <Html>
            <Preview>Ricevuta del tuo ordine #{order.id}</Preview>
            
            <Tailwind>
                <Head /> 
                
                <Body className="font-sans bg-gray-50"> 
                    <Container className="max-w-xl p-6 bg-white shadow-lg rounded-xl">
                        
                        <Heading className="text-3xl font-bold text-center text-indigo-700">
                            Ricevuta d'Acquisto
                        </Heading>
                        <Text className="text-center text-lg text-gray-700">Grazie per il tuo ordine, {userName}!</Text>

                        {/* === RIQUADRO INFORMAZIONI PRINCIPALI (INDIGO) === */}
                        <Section className="my-6 p-4 border border-solid border-indigo-300 rounded-lg bg-indigo-50/50">
                            <Row>
                                <Column>
                                    <Text className="mb-0 text-sm font-semibold text-gray-500 whitespace-nowrap text-nowrap">
                                        ID Ordine
                                    </Text>
                                    <Text className="mb-0 text-indigo-700 text-lg font-bold">{order.id.toString()}</Text>
                                </Column>
                                <Column>
                                    <Text className="mb-0 text-sm font-semibold text-gray-500 whitespace-nowrap text-nowrap">
                                        Data
                                    </Text>
                                    <Text className="mb-0 text-indigo-700 text-lg">
                                        {dateFormatter.format(order.createdAt)}
                                    </Text>
                                </Column>
                                <Column>
                                    <Text className="mb-0 text-sm font-semibold text-gray-500 whitespace-nowrap text-nowrap">
                                        Totale
                                    </Text>
                                    <Text className="mb-0 text-indigo-700 text-xl font-extrabold">
                                        {formatCurrency(order.totalPrice)}
                                    </Text>
                                </Column>
                            </Row>
                        </Section>

                        <Text className="text-xl font-semibold mt-8 mb-4">Dettagli Ordine</Text>

                        {/* === LISTA ARTICOLI (BORDO INDIGO) === */}
                        <Section className="border border-solid border-indigo-300 rounded-lg p-4 md:p-6 my-4 bg-white">
                            {order.orderItems.map((item, index) => (
                                <Row 
                                    key={item.productId} 
                                    className={`py-4 ${index > 0 ? 'border-t border-gray-200' : ''}`}
                                >
                                    {/* Colonna Immagine (Logica corretta per URL assoluto) */}
                                    <Column className="w-20">
                                        <Img
                                            width="80"
                                            alt={item.name}
                                            className="rounded"
                                            src={
                                                item.image.startsWith("/")
                                                    ? `${process.env.NEXT_PUBLIC_SERVER_URL}${item.image}` // Logica definitiva per Vercel
                                                    : item.image 
                                            }
                                        />
                                    </Column>
                                    {/* Colonna Dettagli */}
                                    <Column className="align-top px-4">
                                        <Text className="m-0 text-gray-800 font-medium">
                                            {item.name}
                                        </Text>
                                        <Text className="m-0 text-sm text-gray-500">
                                            Qtà: {item.qty}
                                        </Text>
                                    </Column>
                                    {/* Colonna Prezzo */}
                                    <Column align="right" className="align-top">
                                        <Text className="m-0 text-gray-800 font-semibold">
                                            {formatCurrency(item.price)}{" "}
                                        </Text>
                                    </Column>
                                </Row>
                            ))}

                            {/* === RIASSUNTO PREZZI === */}
                            <Section className="mt-6 border-t border-gray-200 pt-4">
                                {[
                                    { name: "Subtotale (Articoli)", price: order.itemsPrice },
                                    { name: "Tasse", price: order.taxPrice },
                                    { name: "Spedizione", price: order.shippingPrice },
                                ].map(({ name, price }) => (
                                    <Row key={name} className="py-0.5">
                                        <Column align="right" className="text-gray-600 pr-2">{name}: </Column>
                                        <Column align="right" width={100} className="align-top text-gray-800">
                                            <Text className="m-0 text-sm">{formatCurrency(price)}</Text>
                                        </Column>
                                    </Row>
                                ))}

                                {/* Totale Finale Evidenziato */}
                                <Row className="py-2 border-t border-indigo-400 mt-2">
                                    <Column align="right" className="font-bold text-indigo-700 pr-2">Totale:</Column>
                                    <Column align="right" width={100} className="align-top font-bold text-indigo-700">
                                        <Text className="m-0 text-lg">{formatCurrency(order.totalPrice)}</Text>
                                    </Column>
                                </Row>
                            </Section>
                        </Section>
                        
                        <Text className="text-center text-sm text-gray-500 mt-8">
                            Se hai domande sul tuo ordine, rispondi a questa email.
                        </Text>
                    </Container>
                </Body>
            </Tailwind>
        </Html>
    );
}