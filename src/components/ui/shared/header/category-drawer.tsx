// 📁 File: src/components/ui/shared/header/category-drawer.tsx

import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "../../drawer";
import { Button } from "../../button"; // Non usato, ma ok se è importato altrove
import { MenuIcon } from "lucide-react";
import Link from "next/link";

// Usiamo l'interfaccia CategoryItem per coerenza con SearchPage.tsx
interface CategoryItem {
  name: string;
  slug: string; // Lo slug è fondamentale per il filtro URL
  _count?: number;
}

const CategoryDrawer = ({ categories }: { categories: CategoryItem[] }) => {
  console.log("DEBUG DRAWER: CATEGORIES RECEIVED:", categories);

  // FIX CHIAVE DUPLICATA: De-duplicazione delle categorie (Usando slug)
  const slugMap = new Map<string, CategoryItem>();
  categories.forEach((cat) => {
    // Usiamo lo slug come chiave unica e controlliamo che esista
    if (cat.slug && !slugMap.has(cat.slug)) {
      slugMap.set(cat.slug, cat);
    }
  });

  const uniqueCategories = Array.from(slugMap.values());

  return (
    <Drawer direction="left">
      {/* DrawerTrigger: Usa le classi del button invece del componente Button per evitare annidamenti */}
      <DrawerTrigger className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
        <MenuIcon />
      </DrawerTrigger>

      <DrawerContent className="h-full max-w-sm">
        <DrawerHeader>
          <DrawerTitle>Seleziona una Categoria</DrawerTitle>
          <div className="space-y-1 mt-4">
            {/*  CORREZIONE: Usiamo 'x' (o cambiamo in 'c') e usiamo x.slug e x.name 🛑 */}
            {uniqueCategories.map((x) => (
              // FIX: DrawerClose deve contenere ESATTAMENTE un elemento
              <DrawerClose asChild key={x.slug}>
                {/* L'elemento Link è l'unico figlio diretto di DrawerClose */}
                <Link
                  href={`/search?category=${x.slug}`}
                  className="block p-2 text-lg hover:bg-gray-100 transition-colors rounded-md"
                >
                  {x.name} {x._count ? `(${x._count})` : ""}
                </Link>
              </DrawerClose>
            ))}
          </div>
        </DrawerHeader>
      </DrawerContent>
    </Drawer>
  );
};

export default CategoryDrawer;
