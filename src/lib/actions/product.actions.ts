"use server"; // Indica che questa funzione viene eseguita sul server (Next.js Server Action)

import { Product } from "@/types"; // Importiamo l'interfaccia tipizzata Product (il tipo di output atteso)
import { LATEST_PRODUCTS_LIMIT } from "../constants"; // Probabilmente non usato, ma mantenuto
import { convertToPlainObject } from "../utils"; // Import non usato in questo snippet
import { prisma } from "@/db/prisma"; // Connessione al database (Prisma Client)
import { error } from "console"; // Import non necessario (non fa nulla in questo contesto)

// Tipizziamo la funzione per restituire Promise<Product[] | null>
export async function getLatestProducts(): Promise<Product[] | null> {
  try {
    // 1. Fetch dei dati da Prisma
    // Prisma restituisce un array di oggetti 'Product' tipizzati come da schema,
    // ma con 'price' e 'rating' come Decimal/stringa se non gestito esplicitamente.
    const rawProducts = await prisma.product.findMany({
      // take: LATEST_PRODUCTS_LIMIT, // Limitazione disattivata, ma pronta per l'uso
      orderBy: { createdAt: "desc" }, // Ordina i risultati per data di creazione, dal più recente
    });

    // 2. Conversione e Mappatura dei dati
    // Usiamo .map() per iterare su ogni 'rawProduct' e convertirlo nel tipo 'Product' finale.
    const latestProducts: Product[] = rawProducts.map((rawProduct: any) => ({
      // Manteniamo le proprietà stringa e number (stock, numReviews, isFeatured, ecc.)
      name: rawProduct.name,
      slug: rawProduct.slug,
      category: rawProduct.category,
      brand: rawProduct.brand,
      description: rawProduct.description,
      stock: rawProduct.stock,
      images: rawProduct.images,
      isFeatured: rawProduct.isFeatured,
      banner: rawProduct.banner,
      id: rawProduct.id as string,
      numReviews: rawProduct.numReviews,

      createdAt: rawProduct.createdAt,
      // 💥 CORREZIONE CHIAVE: Converti 'price' e 'rating' da stringa (o Decimal) a numero.
      price: parseFloat(rawProduct.price),
      rating: parseFloat(rawProduct.rating),
    }));

    // 3. Ritorno serializzabile
    // L'array 'latestProducts' è ora tipizzato correttamente (Product[]) e serializzabile.
    return latestProducts;
  } catch (error) {
    // Gestione degli errori: registra e ritorna null in caso di fallimento del fetch.
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
