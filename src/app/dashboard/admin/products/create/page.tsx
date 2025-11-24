import { Metadata } from "next";
import ProductForm from "@/components/admin/product-form";
export const metadata: Metadata = {
  title: "Crea un prodotto",
};

// 1. Definisci il componente come una funzione
const ProductCreatePage = () => {
  return (
    <>
      <h2 className="h2-bold pt-6 text-center">Crea un Prodotto</h2>
      <div className="my-8">
        <ProductForm type ='Create'/>
      </div>
    </>
  );
};

// 2. Esportalo come default
export default ProductCreatePage;
