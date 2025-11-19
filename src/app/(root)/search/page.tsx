import ProductCard from "@/components/ui/shared/product/product-card";
import {
  getAllProducts,
  getAllCategories,
} from "@/lib/actions/product.actions";
import Link from "next/link";
import SortSelect from "@/components/ui/search/SortSelect";
import RatingStars from "@/components/ui/search/RatingStars";
import ProductPagination from "@/components/ui/search/ProductPagination";

// --- Dati Statici per i Filtri ---
const prices = [
  { name: "Tutti", value: "all" },
  { name: "€1 to €50", value: "1-50" },
  { name: "€51 to €200", value: "51-200" },
  { name: "€201 to €1000", value: "201-1000" },
];

// --- Interfaccia Categoria ---
// Definiamo il tipo esatto che ci aspettiamo da getAllCategories()
type CategoryItem = {
  name: string;
  slug: string; // Lo slug è fondamentale per il filtro URL
  _count?: number; // Contatore opzionale di prodotti
};

const ratings: number[] = [4, 3, 2, 1];

// --- Componente Pagina di Ricerca ---
const SearchPage = async (props: {
  searchParams: {
    query?: string;
    category?: string;
    price?: string;
    rating?: string;
    sort?: string;
    page?: string;
  };
}) => {
  const {
    query = "all",
    category = "all",
    price = "all",
    rating = "all",
    sort = "newest",
    page = "1",
  } = await props.searchParams;

  // --- Funzione Helper: Costruzione URL ---
  const getFilterUrl = ({
    q,
    c,
    s,
    p,
    r,
    pg,
  }: {
    q?: string;
    c?: string;
    s?: string;
    p?: string;
    r?: string;
    pg?: string;
  }) => {
    // Use a Partial typed params so properties can be deleted safely
    const params: Partial<
      Record<
        "query" | "category" | "price" | "rating" | "sort" | "page",
        string
      >
    > = {
      query,
      category,
      price,
      rating,
      sort,
      page,
    };

    if (q) params.query = q;
    if (c) params.category = c;
    if (s) params.sort = s;
    if (p) params.price = p;
    if (r) params.rating = r;
    if (pg) params.page = pg;

    // Rimuoviamo il parametro 'page' se stiamo cambiando un filtro
    if (q || c || s || p || r) {
      delete params.page;
    }

    // Filter out undefined values before creating URLSearchParams
    const filtered = Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== undefined)
    ) as Record<string, string>;

    return `/search?${new URLSearchParams(filtered).toString()}`;
  };

  // --- Fetch Dati ---
  const products = await getAllProducts({
    query: query,
    category,
    price,
    rating,
    sort,
    page: Number(page),
  });

  // 🛑 Nota: Assumiamo che getAllCategories() ritorni CategoryItem[] o sia castabile.
  const fetchedCategories = (await getAllCategories()) as CategoryItem[];

  // --- FIX CHIAVE DUPLICATA/DE-DUPLICAZIONE ---
  const slugMap = new Map<string, CategoryItem>();

  fetchedCategories.forEach((c) => {
    // Usiamo lo slug come chiave unica e controlliamo che esista
    if (c.slug && !slugMap.has(c.slug)) {
      slugMap.set(c.slug, c);
    }
  });

  // Array finale pulito e de-duplicato per la mappatura
  const uniqueCategories: CategoryItem[] = Array.from(slugMap.values());

  // ----------------------------------------------------
  // --- FUNZIONI HELPER PER NOMI LEGGIBILI DEI FILTRI ---
  // ----------------------------------------------------

  // Trova il nome leggibile della categoria attiva
  const activeCategoryName =
    uniqueCategories.find((c) => c.slug === category)?.name ||
    (category === "all" ? "Tutte" : category);

  // Trova il nome leggibile del range di prezzo attivo
  const activePriceName =
    prices.find((p) => p.value === price)?.name ||
    (price === "all" ? "Tutti" : price);

  // Genera il nome leggibile della valutazione attiva
  const activeRatingName =
    rating !== "all" && rating !== "" ? `${rating} Stelle & Oltre` : "Tutte";

  console.log("DEBUG CATEGORIES: UNIQUE CATEGORIES ARRAY:", uniqueCategories);

  return (
    // CLASSI LAYOUT MANTENUTE
    <div className="py-4 pr-4 pl-6">
      <div className="grid md:grid-cols-6 md:gap-8">
        {/* -------------------- 1. COLONNA FILTRI (SIDEBAR) -------------------- */}
        <div className="md:col-span-1 border-r md:pr-4">
          {/* Filtri Categorie */}
          <div className="text-xl mb-4 mt-3 font-semibold">Categorie</div>
          <ul className="space-y-2">
            {/* Link "Tutte" */}
            <li>
              <Link
                className={`${category === "all" || category === "" ? "font-bold text-indigo-600" : "hover:text-indigo-600"}`}
                href={getFilterUrl({ c: "all" })}
              >
                Tutte
              </Link>
            </li>

            {/* 🛑 MAPPATURA DELLE CATEGORIE (ORA VISIBILE) 🛑 */}
            {uniqueCategories.map((c) => {
              // Estraiamo i dati in modo sicuro
              const cSlug = c.slug;
              const cName = c.name;

              return (
                <li key={cSlug}>
                  <Link
                    className={`${category === cSlug ? "font-bold text-indigo-600" : "hover:text-indigo-600"}`}
                    href={getFilterUrl({ c: cSlug })}
                  >
                    {cName} {c._count ? `(${c._count})` : ""}{" "}
                    {/* Mostra conteggio se disponibile */}
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Filtri Prezzi */}
          <div className="text-xl mb-4 mt-6 font-semibold border-t pt-4">
            Prezzo
          </div>
          <ul className="space-y-2">
            {prices.map((pObj) => (
              <li key={pObj.value}>
                <Link
                  className={`${price === pObj.value ? "font-bold text-indigo-600" : "hover:text-indigo-600"}`}
                  href={getFilterUrl({ p: pObj.value })}
                >
                  {pObj.name}
                </Link>
              </li>
            ))}
          </ul>
          {/* Filtri Valutazioni */}
          <div className="text-xl mb-4 mt-6 font-semibold border-t pt-4">
            Valutazioni
          </div>
          <ul className="space-y-2">
            {/* Link "Tutte" */}
            <li>
              <Link
                className={`${rating === "all" ? "font-bold text-indigo-600" : "hover:text-indigo-600"}`}
                href={getFilterUrl({ r: "all" })}
              >
                Tutte le valutazioni
              </Link>
            </li>

            {/* Mappatura delle Valutazioni */}
            {ratings.map((r) => (
              <li key={r}>
                <Link
                  // Converto r in stringa per il confronto
                  className={`${rating === r.toString() ? "font-bold text-indigo-600" : "hover:text-indigo-600"}`}
                  // Converto r in stringa per la creazione dell'URL
                  href={getFilterUrl({ r: `${r}` })}
                >
                  <RatingStars
                    starCount={r} // Ad esempio 4 stelle piene
                    size={18}
                    // Passiamo la classe di colore dinamica al componente
                    colorClass={
                      rating === r.toString()
                        ? "text-indigo-600"
                        : "text-yellow-500"
                    }
                  />
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* -------------------- 2. COLONNA RISULTATI -------------------- */}
        <div className="md:col-span-5 space-y-6 md:pt-0 pt-8">
          {/* Blocco Ordina Per (Aggiunto per completezza) */}

          <div className="flex justify-end">
            <SortSelect currentSort={sort} />
          </div>

          <div className="flex flex-wrap items-center space-x-4 text-sm font-medium border-t pt-4">
            <span className="text-gray-700">Filtrando per:</span>

            {/* 1. Tag QUERY di Ricerca (Resetta la query) */}
            {query !== "all" && query !== "" && (
              <Link
                href={getFilterUrl({ q: "all" })} // Resetta la query a "all"
                className="flex items-center bg-gray-100 px-3 py-1 rounded-full text-gray-800 font-medium hover:bg-red-50 hover:text-red-600 transition-colors group"
              >
                🔎 Query: {query}
                <span className="ml-2 text-red-500 group-hover:text-red-600">
                  x
                </span>
              </Link>
            )}

            {/* 2. Tag Filtro CATEGORIA (Resetta la categoria) */}
            {category !== "all" && category !== "" && (
              <Link
                href={getFilterUrl({ c: "all" })} // Resetta la categoria a "all"
                className="flex items-center bg-indigo-100 px-3 py-1 rounded-full text-indigo-800 font-medium hover:bg-red-50 hover:text-red-600 transition-colors group"
              >
                🏷️ Categoria: {activeCategoryName}
                <span className="ml-2 text-red-500 group-hover:text-red-600">
                  x
                </span>
              </Link>
            )}

            {/* 3. Tag Filtro PREZZO (Resetta il prezzo) */}
            {price !== "all" && price !== "" && (
              <Link
                href={getFilterUrl({ p: "all" })} // Resetta il prezzo a "all"
                className="flex items-center bg-green-100 px-3 py-1 rounded-full text-green-800 font-medium hover:bg-red-50 hover:text-red-600 transition-colors group"
              >
                💶 Prezzo: {activePriceName}
                <span className="ml-2 text-red-500 group-hover:text-red-600">
                  x
                </span>
              </Link>
            )}

            {/* 4. Tag Filtro VALUTAZIONE (Resetta la valutazione) */}
            {rating !== "all" && rating !== "" && (
              <Link
                href={getFilterUrl({ r: "all" })} // Resetta la valutazione a "all"
                className="flex items-center bg-yellow-100 px-3 py-1 rounded-full text-yellow-800 font-medium hover:bg-red-50 hover:text-red-600 transition-colors group"
              >
                ⭐ Valutazione: {activeRatingName}
                <span className="ml-2 text-red-500 group-hover:text-red-600">
                  x
                </span>
              </Link>
            )}
          </div>

          {/* Griglia Risultati */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.data.length === 0 ? (
              <div className="md:col-span-4 text-center py-10 text-gray-500">
                Prodotti non trovati
              </div>
            ) : (
              products.data.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))
            )}
          </div>
            {/* Paginazione */}
            <ProductPagination
                currentPage={Number(page)}      // Pagina corrente
                totalPages={products.totalPages} // Deve arrivare dalla tua API/Azione
                getFilterUrl={getFilterUrl}      // Funzione URL helper
            />
        </div>
      </div>
    </div>
  );
};

export default SearchPage;
