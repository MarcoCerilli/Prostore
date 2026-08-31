"use client";

import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  LayoutGrid,
  ChevronRight,
  Sparkles,
  Truck,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { getCategoryMeta } from "@/lib/category-config";

export interface CategoryItem {
  name: string;
  slug: string;
  _count?: number;
}

const CategoryDrawer = ({ categories }: { categories: CategoryItem[] }) => {
  // De-duplicazione delle categorie (usando slug)
  const slugMap = new Map<string, CategoryItem>();
  categories.forEach((cat) => {
    if (cat.slug && !slugMap.has(cat.slug)) {
      slugMap.set(cat.slug, cat);
    }
  });

  const uniqueCategories = Array.from(slugMap.values());
  const totalProducts = uniqueCategories.reduce(
    (acc, curr) => acc + (curr._count || 0),
    0
  );

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          className="group relative flex items-center gap-2 px-3 sm:px-4 py-2 h-10 border-border/60 bg-background/80 hover:bg-accent hover:border-indigo-300 dark:hover:border-indigo-700/60 shadow-sm transition-all duration-200"
          aria-label="Apri menu categorie"
        >
          <LayoutGrid className="w-4 h-4 text-indigo-600 dark:text-indigo-400 transition-transform group-hover:scale-110" />
          <span className="hidden sm:inline font-medium text-sm">Categorie</span>
        </Button>
      </SheetTrigger>

      <SheetContent
        side="left"
        className="w-full sm:max-w-md p-0 flex flex-col h-full bg-background border-r shadow-2xl"
      >
        {/* Header Drawer con gradiente */}
        <SheetHeader className="p-6 pb-4 border-b bg-gradient-to-br from-indigo-50/50 via-background to-purple-50/30 dark:from-indigo-950/30 dark:via-background dark:to-purple-950/20 text-left">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-indigo-600 text-white shadow-md shadow-indigo-500/20">
              <LayoutGrid className="w-5 h-5" />
            </div>
            <div>
              <SheetTitle className="text-xl font-bold tracking-tight bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400 bg-clip-text text-transparent">
                Esplora Categorie
              </SheetTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Tutte le collezioni e i trend di ModernStore
              </p>
            </div>
          </div>
        </SheetHeader>

        {/* Lista Categorie Scrollabile */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
          {/* Card: Tutti i Prodotti */}
          <SheetClose asChild>
            <Link
              href="/search?category=all"
              className="group flex items-center justify-between p-3 rounded-xl border border-indigo-200/60 dark:border-indigo-800/40 bg-gradient-to-r from-indigo-500/10 via-purple-500/5 to-transparent hover:from-indigo-500/20 hover:via-purple-500/15 hover:border-indigo-400/60 dark:hover:border-indigo-600/60 transition-all duration-200 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-600 text-white shadow-sm shadow-indigo-600/30 group-hover:scale-105 transition-transform">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-semibold text-sm text-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    Tutti i Prodotti
                  </span>
                  <p className="text-xs text-muted-foreground">
                    Sfoglia il catalogo completo
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {totalProducts > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60">
                    {totalProducts}
                  </span>
                )}
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
              </div>
            </Link>
          </SheetClose>

          {/* Divisore categorie */}
          <div className="pt-2 pb-1 px-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Collezioni ({uniqueCategories.length})
            </span>
          </div>

          {/* Singole Categorie */}
          {uniqueCategories.map((cat) => {
            const meta = getCategoryMeta(cat.slug || cat.name);
            const Icon = meta.icon;

            return (
              <SheetClose asChild key={cat.slug}>
                <Link
                  href={`/search?category=${cat.slug}`}
                  className="group flex items-center justify-between p-2.5 rounded-xl border border-transparent hover:border-border/80 hover:bg-accent/60 transition-all duration-200"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`p-2.5 rounded-xl ${meta.bgLight} ${meta.bgDark} ${meta.color} transition-transform group-hover:scale-110 shadow-sm`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="truncate">
                      <span className="font-medium text-sm text-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors block truncate">
                        {cat.name}
                      </span>
                      <span className="text-xs text-muted-foreground line-clamp-1">
                        {meta.description}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    {typeof cat._count === "number" && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-muted text-muted-foreground border border-border/40">
                        {cat._count}
                      </span>
                    )}
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
                  </div>
                </Link>
              </SheetClose>
            );
          })}
        </div>

        {/* Footer Drawer con Vantaggi Store */}
        <div className="p-4 border-t bg-muted/30 dark:bg-zinc-950/50 space-y-2.5">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="flex flex-col items-center p-2 rounded-lg bg-background border border-border/40 text-[11px] text-muted-foreground">
              <Truck className="w-4 h-4 mb-1 text-indigo-600 dark:text-indigo-400" />
              <span className="font-medium text-foreground">Spedizione</span>
              <span>Veloce 24/48h</span>
            </div>
            <div className="flex flex-col items-center p-2 rounded-lg bg-background border border-border/40 text-[11px] text-muted-foreground">
              <RotateCcw className="w-4 h-4 mb-1 text-emerald-600 dark:text-emerald-400" />
              <span className="font-medium text-foreground">Reso Facile</span>
              <span>30 Giorni</span>
            </div>
            <div className="flex flex-col items-center p-2 rounded-lg bg-background border border-border/40 text-[11px] text-muted-foreground">
              <ShieldCheck className="w-4 h-4 mb-1 text-amber-600 dark:text-amber-400" />
              <span className="font-medium text-foreground">Sicurezza</span>
              <span>100% Garantita</span>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default CategoryDrawer;
