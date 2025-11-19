// 📁 File: src/components/ui/search/ProductPagination.tsx

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination" // Assicurati che il percorso sia corretto

// Definiamo le props necessarie
interface ProductPaginationProps {
    currentPage: number;
    totalPages: number;
    // Funzione per costruire l'URL con il nuovo numero di pagina
    getFilterUrl: (params: { pg: string }) => string;
}

const ProductPagination: React.FC<ProductPaginationProps> = ({ currentPage, totalPages, getFilterUrl }) => {
    
    // Se non ci sono almeno 2 pagine, non mostriamo nulla
    if (totalPages <= 1) {
        return null;
    }

    const pages: (number | 'ellipsis')[] = [];
    const maxPagesToShow = 5; // Limite al numero di pagine visibili nel centro
    
    // Logica per determinare quali numeri di pagina mostrare, inclusa l'ellissi
    if (totalPages <= maxPagesToShow + 2) {
        // Mostra tutti i numeri di pagina se sono pochi
        for (let i = 1; i <= totalPages; i++) {
            pages.push(i);
        }
    } else {
        // Logica per mostrare l'ellissi se ci sono molte pagine
        const firstPage = 1;
        const lastPage = totalPages;
        const boundary = 2; // Mostra le prime 2 e le ultime 2 pagine sempre

        if (currentPage <= boundary + 1) {
            // Caso: inizio (es. 1, 2, 3, 4, ..., 10)
            for (let i = 1; i <= boundary + 2; i++) {
                pages.push(i);
            }
            pages.push('ellipsis', lastPage);
        } else if (currentPage >= totalPages - boundary) {
            // Caso: fine (es. 1, ..., 7, 8, 9, 10)
            pages.push(firstPage, 'ellipsis');
            for (let i = totalPages - boundary - 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            // Caso: centro (es. 1, ..., 4, 5, 6, ..., 10)
            pages.push(firstPage, 'ellipsis');
            for (let i = currentPage - 1; i <= currentPage + 1; i++) {
                pages.push(i);
            }
            pages.push('ellipsis', lastPage);
        }
    }

    // --- Calcolo URL ---
    const prevUrl = getFilterUrl({ pg: (currentPage - 1).toString() });
    const nextUrl = getFilterUrl({ pg: (currentPage + 1).toString() });
    
    const isPrevDisabled = currentPage <= 1;
    const isNextDisabled = currentPage >= totalPages;


    return (
        <Pagination>
            <PaginationContent>
                {/* Pulsante Precedente */}
                <PaginationItem>
                    <PaginationPrevious 
                        href={isPrevDisabled ? '#' : prevUrl} 
                        // Per disabilitare il link, usiamo aria-disabled e un'azione vuota
                        onClick={isPrevDisabled ? (e) => e.preventDefault() : undefined}
                        className={isPrevDisabled ? "pointer-events-none opacity-50" : ""}
                    />
                </PaginationItem>

                {/* Pulsanti Numerici / Ellissi */}
                {pages.map((item, index) => (
                    <PaginationItem key={index}>
                        {item === 'ellipsis' ? (
                            <PaginationEllipsis />
                        ) : (
                            <PaginationLink
                                href={getFilterUrl({ pg: item.toString() })}
                                isActive={item === currentPage}
                            >
                                {item}
                            </PaginationLink>
                        )}
                    </PaginationItem>
                ))}

                {/* Pulsante Successivo */}
                <PaginationItem>
                    <PaginationNext 
                        href={isNextDisabled ? '#' : nextUrl} 
                        onClick={isNextDisabled ? (e) => e.preventDefault() : undefined}
                        className={isNextDisabled ? "pointer-events-none opacity-50" : ""}
                    />
                </PaginationItem>
            </PaginationContent>
        </Pagination>
    );
};

export default ProductPagination;