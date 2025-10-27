"use server";
import { Product } from "@/types"; // Importiamo il tipo Product
import { LATEST_PRODUCTS_LIMIT } from "../constants";
import { convertToPlainObject } from "../utils";
import { prisma } from "@/db/prisma"; // O il path corretto per la tua configurazione
import { error } from "console";

//Tpizziamo la funzione per restituire Promise<Product[] | null>
export async function getLatestProducts(): Promise<Product[] | null> {
  try {
    const data = await prisma.product.findMany({
//take: LATEST_PRODUCTS_LIMIT,
      orderBy: { createdAt: "desc" },
    });
    // 💡 NUOVA LOGICA: Mappa e converte i campi Decimal in stringa
    // Usiamo 'any' nel map per accedere ai metodi Decimal di Prisma
    const latestProducts: Product[] = data.map(item => ({
      // Copiamo tutti i campi con lo spread
      ...item,
      // CONVERSIONE CRUCIALE: Decimal -> String
      price: item.price.toString(),
      rating: item.rating.toString(),

      // Aggiungi qui anche altre conversioni se la tua interfaccia Product
      // richiede 'id: string' (se Prisma restituisce un oggetto ID complesso)
      // o createdAt (se vuoi una stringa ISO)
    })) as Product[]; // Cast finale per garantire il tipo Product[]

    // Ora l'oggetto ritornato è completamente serializzabile e tipizzato
    return latestProducts;
  } catch (error) {
    console.error("ERRORE PRISMA in getLatestProducts:", error);
    return null;
  }
}

//Otteniamo il singolo prodotto in base al suo slug

export async function getProductBySlug(slug: string) {
  const product = await prisma.product.findFirst({
    where: { slug: slug },
  });

  if (!product) {
    return null;
  }
  // *** CORREZIONE: Converte i campi Decimal in stringa ***
  // Questo garantisce che i dati siano serializzabili in JSON e che
  // TypeScript non dia errore nei Componenti Client/React.

  return {
    ...product /*Operatore spread per copiare tutte le proprietà dell' oggetto */,
    price: product.price.toString(),
    rating:
      product.rating.toString() /* Forziamo la conversione da Decimal (tipo Prisma) a string (tipo JSON-safe) con il metodo .toString().   */,
  };
}
