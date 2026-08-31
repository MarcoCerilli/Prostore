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
import { Plus } from "lucide-react";

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

  const products = await getAllProducts({
    query: searchText,
    limit: 10,
    page,
    category,
  });

  return (
    <div className="space-y-6">
      {/* Header e Ricerca */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl sm:text-3xl font-bold">Gestione Prodotti</h1>
          {searchText && (
            <div className="flex items-center space-x-2">
              <span className="text-gray-500 text-sm font-medium">
                - Risultati per: &ldquo;{searchText}&rdquo;
              </span>
              <Link
                href="/dashboard/admin/products"
                className="text-xs font-medium text-red-600 hover:text-red-700 underline"
              >
                Resetta
              </Link>
            </div>
          )}
        </div>

        <Button asChild className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-sm">
          <Link href="/dashboard/admin/products/create" className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            <span>Crea Prodotto</span>
          </Link>
        </Button>
      </div>

      {/* Tabella Prodotti */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        {products.data.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            Nessun prodotto trovato.
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-gray-50 dark:bg-zinc-800/50">
              <TableRow>
                <TableHead className="w-[100px]">ID</TableHead>
                <TableHead>NOME</TableHead>
                <TableHead className="text-right">PREZZO</TableHead>
                <TableHead>CATEGORIA</TableHead>
                <TableHead className="text-center">STOCK</TableHead>
                <TableHead className="text-center">VALUTAZIONE</TableHead>
                <TableHead className="text-right">AZIONI</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.data.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-mono text-xs text-muted-foreground">{formatId(product.id)}</TableCell>
                  <TableCell className="font-medium text-gray-900 dark:text-gray-100">{product.name}</TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatCurrency(product.price.toString())}
                  </TableCell>
                  <TableCell>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                      {product.category}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${product.stock > 0 ? "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300" : "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"}`}>
                      {product.stock}
                    </span>
                  </TableCell>
                  <TableCell className="text-center text-sm font-medium">★ {Number(product.rating).toFixed(1)}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/dashboard/admin/products/${product.id}`}>Modifica</Link>
                    </Button>
                    <DeleteDialog
                      id={product.id}
                      action={deleteProduct}
                      title={`Eliminare "${product.name}"?`}
                      description="Sei sicuro di voler eliminare questo prodotto? Questa operazione cancellerà il prodotto dal catalogo."
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {products?.totalPages && products.totalPages > 1 && (
        <div className="pt-2">
          <AdminPagination page={page} totalPages={products.totalPages} />
        </div>
      )}
    </div>
  );
};

export default AdminProductsPage;
