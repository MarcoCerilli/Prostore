import { getAllCategories } from "@/lib/actions/product.actions";
import { getMyCart } from "@/lib/actions/cart.queries";
import Header from "./index";

export default async function HeaderWrapper() {
  const categories = await getAllCategories();
  const cart = await getMyCart();
  const cartCount =
    cart?.items?.reduce((total, item) => total + (item.qty || 1), 0) || 0;

  return <Header categories={categories} cartCount={cartCount} />;
}