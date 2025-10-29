import ProductList from "@/components/ui/shared/product/product-list";
import { getLatestProducts } from "@/lib/actions/product.actions";
import { Product } from "@/types"; // Importiamo il tipo Product

const Homepage = async () => {
  // data è di tipo Product[] | null
  const data = await getLatestProducts();
  // Inizializziamo l'array vuoto. Se i dati sono nulli o vuoti, useremo questo.
  let latestProducts: Product[] = [];
  // 1. Controllo per evitare che 'null' venga passato
  if (data && Array.isArray(data)) {
    latestProducts = data;
  }
  // 2. Controllo per la visualizzazione di fallback (NESSUN PRODOTTO)
  if (latestProducts.length === 0) {
    return (
      <div className="wrapper py-20 text-center min-h-screen pt-40">
        <h2 className="text-3xl font-bold text-gray-800">
          Nessun Prodotto Trovato
        </h2>
        <p className="text-muted-foreground mt-4 text-lg">
          Non ci sono prodotti nel database.
        </p>
      </div>
    );
  }

  // 3. Renderizzazione finale (Il codice arriva qui SOLO se latestProducts è Product[] e ha elementi)
  return (
    <div className="wrapper">
      <h1 className="h1-bold text-center mt-10 mb-8">Benvenuto su ProStore</h1>

      {/* Ora latestProducts è garantito essere Product[] (non Product[] | null) */}
      <ProductList data={latestProducts} title="Nuovi Arrivi" />
    </div>
  );
};

export default Homepage;
