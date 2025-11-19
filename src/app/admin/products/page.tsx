import { Button } from "@/components/ui/button";
import { AdminPagination } from "@/components/admin/AdminPagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getAllProducts, deleteProduct } from "@/lib/actions/product.actions";
import { formatCurrency, formatId } from "@/lib/utils";
import Link from "next/link";
import { DeleteDialog } from "@/components/ui/shared/DeleteDialog";



const AdminProductsPage = async (props: {
  searchParams: Promise<{
    page: string;
    query: string;
    category: string;
  }>;
}) => {
  const searchParams = await props.searchParams;

  const page = Number(searchParams.page) || 1;
  const searchText = searchParams.query || "";
  const category = searchParams.category || "";

  // Assumo che 'getAllProducts' sia definito e funzionante.
  const products = await getAllProducts({
    query: searchText,
    limit: 2,
    page,
    category,
  });
  console.log(products);

  return (
    <div className="space-y-4"> {/* Aumentato lo spazio verticale */}
    
    {/* Contenitore Flessibile Principale: Allinea gli elementi sui lati opposti */}
    <div className="flex justify-between items-center"> 
        
        {/* Blocco 1: Titolo e Info Ricerca (Sinistra) */}
        <div className="flex items-center gap-4"> {/* Aumentato il gap tra gli elementi a 4 */}
            <h1 className="text-3xl font-bold">Prodotti</h1>
            
            {/* Mostra il testo della ricerca e il link Reset in linea se searchText è presente */}
            {searchText && (
                <div className="flex items-center space-x-2"> 
                    <span className="text-gray-600 text-lg font-medium"> 
                        - Risultati per: "{searchText}"
                    </span>
                    <Link 
                        href="/admin/products" 
                        className="text-sm font-medium text-red-600 hover:text-red-700 transition-colors duration-150"
                    >
                        (Resetta Filtri)
                    </Link>
                </div>
            )}
        </div>
        
        {/* Blocco 2: Bottone Crea Prodotto (Destra) */}
        <Button asChild className="text-sm bg-indigo-600 hover:bg-indigo-700 px-4 py-2">
            <Link href="/admin/products/create">
                Crea Prodotto
            </Link>
        </Button>
    </div>
      <Table>
        <TableHeader>
          {/* CORREZIONE: Tutti i TableHead devono essere figli di TableRow */}
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>NOME</TableHead>
            <TableHead className="text-right">PREZZO</TableHead>
            <TableHead>CATEGORIA</TableHead>
            <TableHead>DISPONIBILITA'</TableHead>
            <TableHead>VALUTAZIONI</TableHead>
            <TableHead className="W-[100PX]">AZIONI</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.data.map((product) => (
            <TableRow key={product.id}>
              <TableCell>{formatId(product.id)}</TableCell>
              <TableCell>{product.name}</TableCell>
              <TableCell className="text-right">
                {formatCurrency(product.price.toString())}
              </TableCell>
              <TableCell>{product.category}</TableCell>
              <TableCell>{product.stock}</TableCell>
              <TableCell>{product.rating.toString()}</TableCell>
              <TableCell className="flex gap-1">
                <Button asChild variant={"outline"}>
                  <Link href={`/admin/products/${product.id}`}>Modifica</Link>
                </Button>
                <DeleteDialog id={product.id} action={deleteProduct} title={""} description={""}/>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {products?.totalPages && products.totalPages > 1 && (
        <AdminPagination page={page} totalPages={products.totalPages} />
      )}
    </div>
  );
};

export default AdminProductsPage;
