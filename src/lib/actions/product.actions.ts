"use server"; // Indica che questa funzione viene eseguita sul server (Next.js Server Action)

import { Product } from "@/types"; // Importiamo l'interfaccia tipizzata Product (il tipo di output atteso)
import { LATEST_PRODUCTS_LIMIT } from "../constants"; // Probabilmente non usato, ma mantenuto
import { convertToPlainObject, formatError } from "../utils"; // Import non usato in questo snippet
import { prisma } from "@/db/prisma"; // Connessione al database (Prisma Client)
import { revalidatePath } from "next/cache";
import { insertProductschema, updateProductSchema } from "../validators";
import z, { success } from "zod";
import { Prisma } from "../generated/prisma/browser";

const PAGE_SIZE = 20; // Ad esempio, 10 prodotti per pagina. Puoi regolarlo a piacere.


export async function getLatestProducts(): Promise<Product[] | null> {
  try {
    // 1. Fetch dei dati da Prisma
    const rawProducts = await prisma.product.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
    });

    // 🛑 NUOVO LOG PER DEBUGGING: verifica i dati grezzi
    console.log("DEBUG: rawProducts count:", rawProducts.length);
    console.log("DEBUG: Esempio di prodotto grezzo:", rawProducts[0]);

    // 2. Serializzazione Universale
    const serializedProducts = JSON.parse(JSON.stringify(rawProducts));

    // 🛑 NUOVO LOG PER DEBUGGING: verifica la serializzazione
    console.log("DEBUG: serializedProducts count:", serializedProducts.length);

    // 3. Mappatura finale per conversione da stringa a numero (se necessario)
    const latestProducts: Product[] = serializedProducts.map((p: any) => ({
      ...p,
      price: parseFloat(p.price),
      rating: parseFloat(p.rating),
      createdAt: new Date(p.createdAt),
    }));

    return latestProducts;
  } catch (error) {
    // Gestione degli errori: restituisce un array vuoto se fallisce
    console.error("ERRORE PRISMA in getLatestProducts:", error);
    // Se si verifica un errore, restituisce un array vuoto per evitare interruzioni
    return [];
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

export async function getProductById(productId: string) {
  const data = await prisma.product.findFirst({
    where: { id: productId },
  });

  return convertToPlainObject(data);
}



// Funzione helper per convertire uno slug (es. 'men-s-denim') in un nome (es. 'Men\'s Denim')
// Questo è necessario se il DB non salva lo slug.
function slugToCategoryName(slug: string): string {
    // Sostituisce i trattini con spazi, capitalizza ogni parola.
    let name = slug.replace(/-/g, ' ').split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    
    // Gestisce l'apostrofo (es. Men s Denim -> Men's Denim)
    // Questa parte è molto specifica e può richiedere ulteriori aggiustamenti.
    if (name.includes(' S ')) {
        name = name.replace(' S ', "'S ");
    }
    return name;
}


// Otteniamo tutti i prodotti
export async function getAllProducts({
  query,
  limit = PAGE_SIZE,
  page,
  category,
  price,
  rating,
  sort,
}: {
  query: string;
  limit?: number;
  page: number;
  category?: string;
  price?: string;
  rating?: string;
  sort?: string;
}) {

    // 🛑 Clausola WHERE unificata di Prisma
    const where: Prisma.ProductWhereInput = {};
    
    // --- FILTRO CATEGORIA ---
    if (category && category !== "all") {
        // 1. Converto lo slug dell'URL (es. 'men-s-denim') nel nome della categoria che hai nel DB (es. 'Men\'s Denim').
        const categoryNameFromSlug = slugToCategoryName(category);
        
        // 2. Filtriamo per trovare corrispondenze nel campo 'category' del DB.
        // Usiamo 'contains' insensitive per una ricerca flessibile, 
        // nel caso in cui la conversione dello slug non sia perfetta.
        where.category = {
            contains: categoryNameFromSlug,
            mode: 'insensitive',
        };
    }
    
    // --- FILTRO PREZZO ---
    if (price && price !== 'all') {
        const [minPriceStr, maxPriceStr] = price.split('-');
        const minPrice = parseInt(minPriceStr);
        const maxPrice = parseInt(maxPriceStr);

        if (!isNaN(minPrice) || !isNaN(maxPrice)) {
            where.price = {
                // gte (Greater Than or Equal): Se minPrice è valido
                ...(isNaN(minPrice) ? {} : { gte: minPrice }),
                // lte (Less Than or Equal): Se maxPrice è valido
                ...(isNaN(maxPrice) ? {} : { lte: maxPrice }),
            };
        }
    }
    
    // --- FILTRO RICERCA TESTUALE (QUERY) ---
    if (query && query !== "all") {
        // Usiamo OR per cercare il testo sia nel nome che nella descrizione
        where.OR = [
            { name: { contains: query, mode: "insensitive" } },
            { description: { contains: query, mode: "insensitive" } },
        ];
    }
    
    // --- FILTRO RATING ---
    if (rating && rating !== "all") {
        where.rating = {
            gte: Number(rating),
        };
    }

    // --- ORDER BY ---
    const orderBy: Prisma.ProductOrderByWithRelationInput = {};
    if (sort === 'lowest') {
        orderBy.price = 'asc';
    } else if (sort === 'highest') {
        orderBy.price = 'desc';
    } else if (sort === 'rating') {
        orderBy.rating = 'desc';
    } else { // default 'newest'
        orderBy.createdAt = 'desc';
    }

    const skip = (page - 1) * limit;

    // Eseguiamo la transazione per ottenere prodotti e conteggio totale
    const [products, count] = await prisma.$transaction([
        prisma.product.findMany({
            where,
            take: limit,
            skip,
            orderBy,
        }),
        prisma.product.count({ where }), // Usiamo lo stesso filtro 'where' per il conteggio
    ]);

    // Conversione dei tipi Decimali di Prisma in Number
    const data = products.map(p => ({
        ...p,
        price: p.price.toNumber(),
        rating: p.rating.toNumber(),
    }));

    return {
        data,
        totalPages: Math.ceil(count / limit),
    };
}

// CANCELLARE UN PRODOTTO

export async function deleteProduct(id: string) {
  try {
    const productExists = await prisma.product.findFirst({
      where: { id },
    });
    if (!productExists) throw new Error("Prodotto non trovato");
    await prisma.product.delete({ where: { id } });

    revalidatePath("/admin/products");

    return {
      success: true,
      message: "Prodotto cancellato con successo!",
    };
  } catch (error) {
    return { success: false, message: formatError };
  }
}

//Creiamo un prodotto
export async function createProduct(data: z.infer<typeof insertProductschema>) {
  try {
    const product = insertProductschema.parse(data);
    await prisma.product.create({ data: product });

    revalidatePath("/admin/products");

    return {
      success: true,
      message: "Prodotto creato con successo!",
    };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

//Aggiorniamo un prodotto
export async function updateProduct(data: z.infer<typeof updateProductSchema>) {
  try {
    const product = updateProductSchema.parse(data);
    const productExists = await prisma.product.findFirst({
      where: { id: product.id } /* id = product.id */,
    });

    if (!productExists) throw new Error("Prodotto non trovato");

    await prisma.product.update({
      where: { id: product.id },
      data: product,
    });

    revalidatePath("/admin/products");

    return {
      success: true,
      message: "Prodotto aggiornato con successo!",
    };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}


// Funzione di utilità per creare uno slug (ad esempio: "Men's Denim" -> "men-s-denim")
function createSlug(text: string): string {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

}

//Otteniamo tutte le categorie
export async function getAllCategories() {
  const data = await prisma.product.groupBy({
    by: ["category"],
    _count: {
        id:true,
    },
  });

  //  1. CONVERSIONE FORZATA JSON PER ELIMINARE METODI NASCOSTI
  // Questa riga rimuove i metodi e le funzioni interne di Prisma.
  const categoriesJson = JSON.stringify(data);
  const safeCategories = JSON.parse(categoriesJson);

  //  2. MAPPA PER GARANTIRE IL FORMATO CORRETTO (Opzionale, ma consigliato)
  // Questo ti assicura che il formato sia Category[] pulito:
  return safeCategories
  .filter((item: any)=> item.category && item.category !== 'all') // Filtra eventuali categorie nulle o "all"
  .map((item: any) => ({
    name: item.category,
    slug: createSlug(item.category),
    _count: item._count.id,
  }));
}

//Otteniamo prodotti in vetrina
export async function getFeaturedProducts() {
  try {
    const data = await prisma.product.findMany({
      where: {
        isFeatured: true,
        banner: { not: null },
      },
      orderBy: { createdAt: "desc" },
      take: 4,
    });
    return convertToPlainObject(data);
  } catch (error) {
    // <-- Spazio e parentesi graffe corrette
    console.error("Errore nel recupero dei prodotti in evidenza:", error);
    return []; // Restituisci un array vuoto in caso di errore
  }
}
