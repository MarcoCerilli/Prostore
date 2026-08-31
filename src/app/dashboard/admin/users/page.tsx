import { Metadata } from "next";
import Link from "next/link";
import { getAllUsers, deleteUser } from "@/lib/actions/user.actions";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Table, 
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { formatId } from "@/lib/utils";
import { DeleteDialog } from "@/components/ui/shared/DeleteDialog";

export const metadata: Metadata = {
  title: "Gestione Utenti | ModernStore Admin",
};

const AdminUserPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) => {
  const resolvedSearchParams = await searchParams;

  const pageString = resolvedSearchParams?.page;
  const queryString = resolvedSearchParams?.query || "";

  const page =
    pageString && !Array.isArray(pageString) ? parseInt(pageString) : 1;

  const query = queryString && !Array.isArray(queryString) ? queryString : undefined;
  const searchText = query || "";     

  const userResult = await getAllUsers({ page, query });
  const users = userResult?.data || [];
  const totalUsers = userResult?.dataCount || 0;
  const totalPages = userResult?.totalPages || 1;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl sm:text-3xl font-bold">Gestione Utenti</h1>
          {searchText && (
            <div className="flex items-center space-x-2"> 
              <span className="text-gray-500 text-sm font-medium"> 
                - Risultati per: &ldquo;{searchText}&rdquo;
              </span>
              <Link 
                href="/dashboard/admin/users" 
                className="text-xs font-medium text-red-600 hover:text-red-700 underline"
              >
                Resetta
              </Link>
            </div>
          )}
        </div>
      </div>

      <Card className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        <CardHeader className="bg-gray-50/50 dark:bg-zinc-800/30 border-b border-gray-100 dark:border-zinc-800 py-4">
          <CardTitle className="text-base font-semibold">Utenti Registrati ({totalUsers})</CardTitle>
        </CardHeader>
        
        <CardContent className="p-0">
          {users.length === 0 ? (
            <p className="text-center text-gray-500 py-12">Nessun utente trovato.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table className="min-w-full">
                <TableHeader className="bg-gray-50 dark:bg-zinc-800/50">
                  <TableRow>
                    <TableHead className="w-[120px]">ID</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="text-center">Ruolo</TableHead>
                    <TableHead className="text-right">Azioni</TableHead>
                  </TableRow>
                </TableHeader>
                
                <TableBody>
                  {users.map((user: { id: string; name?: string | null; email?: string | null; role: string }) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-mono text-xs text-muted-foreground">{formatId(user.id)}</TableCell>
                      <TableCell className="font-medium text-gray-900 dark:text-gray-100">{user.name || "N/A"}</TableCell>
                      <TableCell className="text-sm text-gray-600 dark:text-zinc-400">{user.email}</TableCell>
                      <TableCell className="text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            user.role?.toLowerCase() === "admin"
                              ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300"
                              : "bg-gray-100 text-gray-700 dark:bg-zinc-800 dark:text-zinc-300"
                          }`}
                        >
                          {user.role}
                        </span>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/dashboard/admin/users/edit/${user.id}`}>Modifica</Link>
                        </Button>
                        <DeleteDialog
                          id={user.id}
                          action={deleteUser}
                          title={`Eliminare l'utente "${user.name || user.email}"?`}
                          description="Sei sicuro di voler eliminare questo utente? L'azione è irreversibile."
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="pt-2">
          <AdminPagination page={page} totalPages={totalPages} />
        </div>
      )}
    </div>
  );
};

export default AdminUserPage;