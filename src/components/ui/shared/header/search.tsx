"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// NOTA: Se la tua funzione getAllCategories è stata aggiornata, potrebbe restituire 'name' e 'slug'
// anziché 'category' e '_count'. Assumo qui il formato che stai mappando.

interface CategoryItem {
  category: string; // Il nome grezzo (da usare come chiave di de-duplicazione)
  slug?: string; // Lo slug (se disponibile dalla fetch, altrimenti lo generiamo)
  _count: number;
}

// Funzione helper per creare uno slug (copiata da quella suggerita per getAllCategories)
function createSlug(text: string): string {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}


const Search = ({ categories }: { categories: CategoryItem[] }) => {

    const uniqueCategoriesMap = new Map<string, CategoryItem>();
    
    // Filtriamo e deduplichiamo
    categories.forEach(cat => {
      if (cat.category && !uniqueCategoriesMap.has(cat.category)) {
          // Aggiungiamo lo slug se mancante
          if (!cat.slug) {
              cat.slug = createSlug(cat.category);
          }
          uniqueCategoriesMap.set(cat.category, cat);
      }
    });

    const uniqueCategories = Array.from(uniqueCategoriesMap.values());

  return (
    <form action="/search" method="GET">
      <div className="flex w-full items-center space-x-2">
        
        {/* Campo Categoria */}
        <Select name="category">
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Tutte le Categorie" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutte le Categorie</SelectItem>
            {uniqueCategories.map((cat) => (
              // 🛑 USA LO SLUG COME VALORE DI RICERCA
              <SelectItem key={cat.category} value={cat.slug || cat.category}> 
                {cat.category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {/* Campo di input per la ricerca testuale */}
        <Input type="text" name="query" placeholder="Cerca Prodotti..." className="w-full" />
        
        {/* Bottone Submit */}
        <Button type="submit" className="bg-indigo-600 
          hover:bg-indigo-700 
          text-white 
          font-bold 
          py-2 
          px-4 
          rounded 
          transition 
          duration-150">Cerca</Button>
      </div>
    </form>
  );
};

export default Search;