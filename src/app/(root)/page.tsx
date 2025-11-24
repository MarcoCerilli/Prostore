import ProductList from "@/components/ui/shared/product/product-list";
import {
  getLatestProducts,
  getFeaturedProducts,
} from "@/lib/actions/product.actions";
import { Product } from "@/types";
import ProductCarousel from "@/components/ui/shared/product/product-carousel"; // Aggiungi l'import del Carousel
import ViewAllProductsButton from "@/components/view-all-products-button";

const Homepage = async () => {
  // 1. CHIAMATE API
  // dataLatest è di tipo Product[] | null
  const dataLatest = await getLatestProducts();
  // dataFeatured è di tipo Product[] | null (assumendo che getFeaturedProducts sia tipizzata così)
  const dataFeatured = await getFeaturedProducts();

  // 2. INIZIALIZZAZIONE SICURA (latestProducts)
  let latestProducts: Product[] = [];
  if (dataLatest && Array.isArray(dataLatest)) {
    latestProducts = dataLatest;
  }

  // 3. INIZIALIZZAZIONE SICURA (featuredProducts)
  let featuredProducts: Product[] = [];
  if (dataFeatured && Array.isArray(dataFeatured)) {
    // Qui applichi il tuo filtro, assicurandoti che abbiano il banner
    featuredProducts = dataFeatured.filter((p) => p.banner);
  }

  // DEBUGGING (Verifica finale)
  console.log("Prodotti Nuovi Arrivi (Latest):", latestProducts.length);
  console.log("Prodotti In Vetrina (Featured):", featuredProducts.length);

  // 4. Controllo per la visualizzazione di fallback
  if (latestProducts.length === 0 && featuredProducts.length === 0) {
    return (
      <div className="wrapper">
        <h1 className="h1-bold text-center mt-10 mb-8">
          Benvenuto su ProStore
        </h1>
        <div className="text-center mt-20 text-gray-500">
          Al momento non sono disponibili prodotti in vetrina o nuovi arrivi.
        </div>
        <ViewAllProductsButton /> {/* 🛑 INCLUSO NEL FALLBACK */}
      </div>
    );
  }

  // 5. Renderizzazione finale
  return (
    <div className="wrapper">
            <h1 className="h1-bold text-center mt-10 mb-8">Benvenuto su ModernStore</h1>

            {/* Mostra il Carousel solo se ci sono prodotti in vetrina */}
            {featuredProducts.length > 0 && <ProductCarousel data={featuredProducts} />}

            {/* Mostra la lista Nuovi Arrivi solo se ci sono prodotti */}
            {latestProducts.length > 0 && <ProductList data={latestProducts} title="Nuovi Arrivi" />}
            
            <ViewAllProductsButton /> 
        </div>
  );
};

export default Homepage;
