import { Metadata } from "next";
import Link from "next/link"; // Importa Link da next/link per <Link href>
import { getAllUsers } from "@/lib/actions/user.actions"; // Assicurati che il percorso sia corretto
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Table, 
  TableCaption,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
} from "@/components/ui/table";
import { Home, Plus } from "lucide-react";
import AdminSearch from "@/components/admin/admin-search";



export const metadata: Metadata = {
  title: "Gestione Utenti",
};

// Componente segnaposto per la riga dell'utente
const AdminUserRow = ({ user }: { user: any }) => (
  <TableRow>
    {/* ID Utente */}
    <td className="text-left font-mono text-xs text-gray-500 py-3 px-6">{user.id}</td>
    {/* Nome */}
    <td className="text-center font-medium py-3 px-6">{user.name || "N/A"}</td>
    {/* Email */}
    <td className="text-center text-sm py-3 px-6">{user.email}</td>
    {/* Ruolo */}
    <td className="text-right py-3 px-6">
      <span
        className={`px-2 py-0.5 rounded-full text-xs font-semibold ${user.role === "ADMIN" ? "bg-indigo-100 text-indigo-700" : "bg-gray-100 text-gray-700"}`}
      >
        {user.role}
      </span>
    </td>
    {/* ✅ CORREZIONE: Aggiunto spazio corretto tra le classi: `text-center space-x-2` */}
    <td className="text-center space-x-2 py-3 px-6">
      <Button variant="outline" size="sm" asChild>
        <Link href={`/admin/users/edit/${user.id}`}>Modifica</Link>
      </Button>
      <Button variant="destructive" size="sm">
        Elimina
      </Button>
    </td>
  </TableRow>
);

const AdminUserPage = async ({
  searchParams,
}: {
    searchParams: { [key: string]: string | string[] | undefined };
}) => {
//Accesso sicuro e  default per la pagina 
  const resolvedSearchParams = await Promise.resolve(searchParams);

  // 1. Ora accedi alla proprietà dall'oggetto risolto
  const  pageString = resolvedSearchParams?.page;
  const queryString = resolvedSearchParams?.query || "";

// Se è presente e non è un array, parsifica. Altrimenti, usa 1.
    const page =
        pageString && !Array.isArray(pageString) ? parseInt(pageString) : 1;

   // La query deve essere una stringa o undefined per la funzione getAllUsers
       const query = queryString && !Array.isArray(queryString) ? queryString : undefined;
       const searchText = query || "";     


//Assumiamo che getAllUsers restituisca { data: User[], totalPages: number}
const userResult = await getAllUsers({page, query})
const users = userResult?.data  || []
const totalUsers = userResult?.dataCount || 0;


/*   console.log(users); */

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center border-b pb-4">
        <div className="flex items-center gap-4">
                <h1 className="text-3xl font-extrabold text-gray-900">Gestione Utenti</h1>
                {/* 🚀 VISUALIZZAZIONE RICERCA E RESET */}
                {searchText && (
                    <div className="flex items-center space-x-2"> 
                        <span className="text-gray-600 text-lg font-medium"> 
                            - Risultati per: "{searchText}"
                        </span>
                        <Link 
                            href="/admin/users" 
                            className="text-sm font-medium text-red-600 hover:text-red-700 transition-colors duration-150"
                        >
                            (Resetta Filtri)
                        </Link>
                    </div>
                )}
            </div>
        <div className="flex  gap-3">
            <Button asChild variant="outline" className="text-sm">
                <Link href="/">
                    <Home className="mr-2 h-4 w-4" />
                    Torna al Sito
                </Link>
            </Button>
            {/* L'azione "Nuovo Utente" potrebbe non avere senso se usi solo autenticazione esterna */}
            {/* ✅ MODIFICA STILE: Ho usato bg-green-600 per coerenza con gli altri admin button */}
            <Button asChild className="text-sm bg-indigo-600 hover:bg-indigo-700"> 
                <Link href="/admin/users/create"> 
                    <Plus className="mr-2 h-4 w-4" />
                    Crea Utente
                </Link>
            </Button>
        </div>
      </div>


        {/* CARD PRINCIPALE PER LA TABELLA */}
      <Card>
        <CardHeader>
          <CardTitle>Lista Utenti ({totalUsers})</CardTitle>
        </CardHeader>
        
        <CardContent>
          {users.length === 0 ? (
            <p className="text-center text-gray-500 py-8">Nessun utente trovato per questa pagina.</p>
          ) : (
            <div className="overflow-x-auto border rounded-lg shadow-sm">
              <Table className="min-w-full divide-y divide-gray-200">
                <TableCaption className="mt-4">Lista completa degli utenti registrati.</TableCaption>
                
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead className="w-[180px] text-left text-xs font-semibold text-gray-600 uppercase tracking-wider px-6"> ID</TableHead>
                    <TableHead className="w-[150px] text-center text-xs font-semibold text-gray-600 uppercase tracking-wider px-6">Nome</TableHead>
                    <TableHead className="w-[200px] text-center text-xs font-semibold text-gray-600 uppercase tracking-wider px-6">Email</TableHead>
                    <TableHead className="w-[100px] text-right text-xs font-semibold text-gray-600 uppercase tracking-wider px-6">Ruolo</TableHead>
                    <TableHead className="w-[150px] text-center text-xs font-semibold text-gray-600 uppercase tracking-wider px-6">Azioni</TableHead>
                  </TableRow>
                </TableHeader>
                
                <TableBody className="bg-white divide-y divide-gray-200">
                    {users.map((user: any) => (
                        <AdminUserRow key={user.id} user={user} />
                    ))}
                </TableBody>
              </Table>
            </div>
          )}
          {/* Qui andrebbe implementata la paginazione, basata su usersResult.totalPages */}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminUserPage;