// 📁 components/ui/shared/header/user-button.tsx
"use client"; // ⭐ ADESSO È UN CLIENT COMPONENT

import Link from "next/link";
// Importiamo useSession e signOut direttamente per i Client Component
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
// ⭐ Importato ListOrdered per il link Admin
import { UserIcon, LogOut, Package, ListOrdered } from "lucide-react";

const UserButton = () => {
  // ⭐ 1. Legge lo stato e i dati dell'utente tramite hook
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated";

  // 2. Se NON autenticato, mostra il link Sign In
  if (!isAuthenticated) {
    return (
      <Button asChild>
        <Link href="/sign-in">
          <UserIcon className="w-5 h-5 mr-2" />
          Accedi
        </Link>
      </Button>
    );
  }

  const isAdmin = session.user?.role?.toUpperCase() === "ADMIN";

  // 3. Se AUTENTICATO, mostra il dropdown
  const firstInitial = session.user?.name?.charAt(0).toUpperCase() ?? "U";

  return (
    <div className="flex gap-2 items-center">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div className="flex items-center">
            <Button
              variant="ghost"
              className="relative w-8 h-8 rounded-full ml-2 flex items-center justify-center bg-gray-200"
            >
              {firstInitial}
            </Button>
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          {/* Informazioni Utente (include il Ruolo per debug/verifica) */}
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <div className="text-sm font-medium leading-none">
                {session.user?.name}
              </div>
              <div className="text-sm text-muted-foreground leading-none">
                {session.user?.email}
              </div>
              {/* ⭐ DEBUG: MOSTRA IL RUOLO LETTO DAL CLIENT */}
              <div
                className={`text-xs leading-none ${isAdmin ? "text-red-500 font-semibold" : "text-blue-500"}`}
              >
                Ruolo: {session.user?.role || "Non Definito"}
              </div>
            </div>
          </DropdownMenuLabel>

          <DropdownMenuSeparator />

          {/* ⭐ NUOVO: Link all'Area Admin, visibile solo se isAdmin è true */}
          {isAdmin && (
            <DropdownMenuItem asChild>
              <Link href="/admin" className="flex items-center w-full">
                <ListOrdered className="w-4 h-4 mr-2" />
                Area Admin
              </Link>
            </DropdownMenuItem>
          )}

          {/* Link alla Dashboard Ordini standard (per tutti) */}
          <DropdownMenuItem asChild>
            <Link href="/dashboard/orders" className="flex items-center w-full">
              <Package className="w-4 h-4 mr-2" />I Miei Ordini
            </Link>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* Funzione di Logout Diretta */}
          <DropdownMenuItem
            className="text-red-500 focus:text-red-600 cursor-pointer"
            onClick={() => signOut({ callbackUrl: "/" })}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Esci
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default UserButton;
