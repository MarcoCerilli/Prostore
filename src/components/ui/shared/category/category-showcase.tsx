import Link from "next/link";
import { getCategoryMeta } from "@/lib/category-config";
import { ArrowRight, Sparkles } from "lucide-react";

export interface CategoryItem {
  name: string;
  slug: string;
  _count?: number;
}

interface CategoryShowcaseProps {
  categories: CategoryItem[];
}

const CategoryShowcase = ({ categories }: CategoryShowcaseProps) => {
  // De-duplicazione
  const slugMap = new Map<string, CategoryItem>();
  categories.forEach((cat) => {
    if (cat.slug && !slugMap.has(cat.slug)) {
      slugMap.set(cat.slug, cat);
    }
  });

  const uniqueCategories = Array.from(slugMap.values());

  if (uniqueCategories.length === 0) {
    return null;
  }

  return (
    <section className="my-10 sm:my-14">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 gap-2">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/50 mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Collezioni in Evidenza</span>
          </div>
          <h2 className="h2-bold tracking-tight">Esplora per Categoria</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Scopri i capi perfetti per ogni stile ed occasione
          </p>
        </div>

        <Link
          href="/search?category=all"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors group self-start sm:self-auto"
        >
          <span>Vedi tutte le categorie</span>
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
        {uniqueCategories.map((cat) => {
          const meta = getCategoryMeta(cat.slug || cat.name);
          const Icon = meta.icon;

          return (
            <Link
              key={cat.slug}
              href={`/search?category=${cat.slug}`}
              className="group relative flex flex-col items-center text-center p-4 sm:p-5 rounded-2xl border border-border/60 bg-card hover:bg-accent/40 hover:border-indigo-300 dark:hover:border-indigo-700/60 transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
            >
              {/* Icon Container */}
              <div
                className={`p-3.5 rounded-2xl mb-3 ${meta.bgLight} ${meta.bgDark} ${meta.color} transition-all duration-300 group-hover:scale-110 shadow-sm`}
              >
                <Icon className="w-6 h-6" />
              </div>

              {/* Title & Count */}
              <h3 className="font-semibold text-sm text-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate max-w-full">
                {cat.name}
              </h3>

              {typeof cat._count === "number" && (
                <span className="text-xs text-muted-foreground mt-1">
                  {cat._count} {cat._count === 1 ? "prodotto" : "prodotti"}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </section>
  );
};

export default CategoryShowcase;
