"use client"; // <-- AGGIUNGI QUESTA RIGA

// Importa TUTTI i componenti necessari da shadcn/ui/pagination
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { usePathname, useSearchParams } from "next/navigation"; // Utile per Next.js

interface AdminPaginationProps {
  page: number;
  totalPages: number;
}

// Definisci il tuo componente wrapper che accetta i props 'page' e 'totalPages'
export function AdminPagination({ page, totalPages }: AdminPaginationProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Funzione per creare il link di paginazione
  const createPageURL = (pageNumber: number | string) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', pageNumber.toString());
    return `${pathname}?${params.toString()}`;
  };

  return (
    <Pagination className="mt-8">
      <PaginationContent>
        {/* Bottone Indietro */}
        <PaginationItem>
          <PaginationPrevious 
            href={createPageURL(page - 1)} 
            // Disabilita se siamo sulla prima pagina
            className={page <= 1 ? "pointer-events-none opacity-50" : undefined}
          />
        </PaginationItem>

        {/* Esempio di Link alla Pagina Corrente/1 */}
        <PaginationItem>
          <PaginationLink 
            href={createPageURL(1)} 
            isActive={page === 1}
          >
            1
          </PaginationLink>
        </PaginationItem>
        
        {/* Aggiungere un'ellissi se ci sono troppe pagine */}
        {totalPages > 5 && page > 3 && (
            <PaginationItem>
                <PaginationEllipsis />
            </PaginationItem>
        )}

        {/* Esempio di Link Avanti */}
        {totalPages > 1 && (
            <PaginationItem>
                <PaginationNext 
                    href={createPageURL(page + 1)} 
                    // Disabilita se siamo sull'ultima pagina
                    className={page >= totalPages ? "pointer-events-none opacity-50" : undefined}
                />
            </PaginationItem>
        )}
      </PaginationContent>
    </Pagination>
  );
}