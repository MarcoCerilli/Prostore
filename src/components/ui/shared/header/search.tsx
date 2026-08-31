"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search as SearchIcon } from "lucide-react";

export interface CategoryItem {
  name: string;
  slug: string;
  _count?: number;
}

const Search = ({ categories }: { categories: CategoryItem[] }) => {
  const uniqueCategoriesMap = new Map<string, CategoryItem>();

  categories.forEach((cat) => {
    const key = cat.slug || cat.name;
    if (key && !uniqueCategoriesMap.has(key)) {
      uniqueCategoriesMap.set(key, cat);
    }
  });

  const uniqueCategories = Array.from(uniqueCategoriesMap.values());

  return (
    <form action="/search" method="GET" className="w-full">
      <div className="flex w-full items-center gap-1.5 p-1 rounded-2xl border border-border/60 bg-muted/40 dark:bg-zinc-900/60 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all shadow-xs">
        {/* Campo Categoria */}
        <Select name="category" defaultValue="all">
          <SelectTrigger className="w-[130px] sm:w-[150px] border-0 bg-transparent text-xs sm:text-sm font-medium focus:ring-0 shadow-none h-9">
            <SelectValue placeholder="Tutte" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="all">Tutte le Categorie</SelectItem>
            {uniqueCategories.map((cat) => (
              <SelectItem key={cat.slug} value={cat.slug}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="h-5 w-[1px] bg-border/80 my-auto" />

        {/* Campo di input con Icona */}
        <div className="relative flex-1 flex items-center">
          <Input
            type="text"
            name="query"
            placeholder="Cerca prodotti, brand, collezioni..."
            className="w-full text-xs sm:text-sm border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-3 h-9 shadow-none"
          />
        </div>

        {/* Bottone Submit */}
        <Button
          type="submit"
          size="sm"
          className="h-9 px-3 sm:px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex items-center gap-1.5 shadow-sm shadow-indigo-600/20 transition-all duration-200"
          aria-label="Cerca"
        >
          <SearchIcon className="w-4 h-4" />
          <span className="hidden sm:inline text-xs">Cerca</span>
        </Button>
      </div>
    </form>
  );
};

export default Search;