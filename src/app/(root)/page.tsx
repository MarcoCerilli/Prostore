import ProductList from "@/components/ui/shared/product/product-list";
import {
  getLatestProducts,
  getFeaturedProducts,
  getAllCategories,
} from "@/lib/actions/product.actions";
import { Product } from "@/types";
import ProductCarousel from "@/components/ui/shared/product/product-carousel";
import ViewAllProductsButton from "@/components/view-all-products-button";
import CategoryShowcase from "@/components/ui/shared/category/category-showcase";
import StorePerks from "@/components/ui/shared/store-perks";

const Homepage = async () => {
  // 1. CHIAMATE API
  const dataLatest = await getLatestProducts();
  const dataFeatured = await getFeaturedProducts();
  const categories = await getAllCategories();

  // 2. INIZIALIZZAZIONE SICURA (latestProducts)
  let latestProducts: Product[] = [];
  if (dataLatest && Array.isArray(dataLatest)) {
    latestProducts = dataLatest;
  }

  // 3. INIZIALIZZAZIONE SICURA (featuredProducts)
  let featuredProducts: Product[] = [];
  if (dataFeatured && Array.isArray(dataFeatured)) {
    featuredProducts = dataFeatured.filter((p) => p.banner);
  }

  // 4. Controllo per la visualizzazione di fallback
  if (latestProducts.length === 0 && featuredProducts.length === 0) {
    return (
      <div className="wrapper">
        <h1 className="h1-bold text-center mt-10 mb-8">
          Benvenuto su ModernStore
        </h1>
        <div className="text-center mt-20 text-muted-foreground">
          Al momento non sono disponibili prodotti in vetrina o nuovi arrivi.
        </div>
        <ViewAllProductsButton />
      </div>
    );
  }

  // 5. Renderizzazione finale
  return (
    <div className="wrapper space-y-12">
      {/* Mostra il Carousel solo se ci sono prodotti in vetrina */}
      {featuredProducts.length > 0 && <ProductCarousel data={featuredProducts} />}

      {/* Barra Garanzie e Vantaggi Store */}
      <StorePerks />

      {/* Sezione Visiva Categorie */}
      {categories.length > 0 && <CategoryShowcase categories={categories} />}

      {/* Mostra la lista Nuovi Arrivi solo se ci sono prodotti */}
      {latestProducts.length > 0 && (
        <ProductList data={latestProducts} title="Nuovi Arrivi" />
      )}

      <ViewAllProductsButton />
    </div>
  );
};

export default Homepage;
