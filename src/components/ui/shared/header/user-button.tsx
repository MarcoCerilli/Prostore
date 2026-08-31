"use client";

import Link from "next/link";
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
import { UserIcon, LogOut, Package, ShieldCheck, User } from "lucide-react";

const UserButton = () => {
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated";

  if (!isAuthenticated) {
    return (
      <Button asChild className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium">
        <Link href="/sign-in">
          <UserIcon className="w-4 h-4 mr-2" />
          Accedi
        </Link>
      </Button>
    );
  }

  const userRole = session?.user?.role?.toLowerCase();
  const isAdmin = userRole === "admin";

  const firstInitial = session?.user?.name?.charAt(0).toUpperCase() ?? "U";

  return (
    <div className="flex gap-2 items-center">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div className="flex items-center">
            <Button
              variant="ghost"
              className="relative w-9 h-9 rounded-full ml-1 flex items-center justify-center bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 font-bold border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-200 transition"
            >
              {firstInitial}
            </Button>
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <div className="text-sm font-semibold leading-none">
                {session?.user?.name}
              </div>
              <div className="text-xs text-muted-foreground leading-none">
                {session?.user?.email}
              </div>
              {isAdmin && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300 w-fit mt-1">
                  Amministratore
                </span>
              )}
            </div>
          </DropdownMenuLabel>

          <DropdownMenuSeparator />

          {/* Profilo */}
          <DropdownMenuItem asChild>
            <Link href="/dashboard/profile" className="flex items-center w-full cursor-pointer">
              <User className="w-4 h-4 mr-2 text-gray-500" />
              Il Mio Profilo
            </Link>
          </DropdownMenuItem>

          {/* I Miei Ordini */}
          <DropdownMenuItem asChild>
            <Link href="/dashboard/orders" className="flex items-center w-full cursor-pointer">
              <Package className="w-4 h-4 mr-2 text-gray-500" />
              I Miei Ordini
            </Link>
          </DropdownMenuItem>

          {/* Area Admin (solo per admin) */}
          {isAdmin && (
            <DropdownMenuItem asChild>
              <Link href="/dashboard/admin" className="flex items-center w-full cursor-pointer font-medium text-indigo-600 dark:text-indigo-400">
                <ShieldCheck className="w-4 h-4 mr-2" />
                Pannello Admin
              </Link>
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />

          {/* Logout */}
          <DropdownMenuItem
            className="text-red-600 dark:text-red-400 focus:text-red-700 cursor-pointer"
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
