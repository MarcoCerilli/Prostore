"use client";

import {
  EllipsisVertical,
  ShoppingCart,
  User,
  Package,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import ModeToggle from "./mode-toggle";
import Link from "next/link";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "../../sheet";
import UserButton from "./user-button";
import { useSession } from "next-auth/react";

const Menu = ({ cartCount = 0 }: { cartCount?: number }) => {
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated";
  const userRole = session?.user?.role?.toLowerCase();
  const isAdmin = isAuthenticated && userRole === "admin";

  const dashboardLinks = [
    { href: "/dashboard/profile", label: "Il Mio Profilo", icon: User },
    { href: "/dashboard/orders", label: "I Miei Ordini", icon: Package },
  ];

  if (isAdmin) {
    dashboardLinks.unshift({
      href: "/dashboard/admin",
      label: "Pannello Admin",
      icon: ShieldCheck,
    });
  }

  return (
    <div className="flex justify-end gap-2 sm:gap-3 items-center">
      {/* Navigazione Desktop */}
      <nav className="hidden md:flex w-full max-w-xs gap-2 items-center">
        <ModeToggle />

        {isAdmin && (
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="flex items-center text-indigo-600 dark:text-indigo-400 font-medium"
          >
            <Link href="/dashboard/admin" title="Pannello Amministrazione">
              <ShieldCheck className="w-5 h-5" />
            </Link>
          </Button>
        )}

        <Button asChild variant="ghost" size="icon" className="relative">
          <Link href="/cart" aria-label="Carrello">
            <ShoppingCart className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-[10px] font-bold rounded-full h-4 min-w-[16px] px-1 flex items-center justify-center shadow-xs">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            )}
          </Link>
        </Button>
        <UserButton />
      </nav>

      {/* Navigazione Mobile */}
      <nav className="md:hidden flex items-center gap-1">
        <Button asChild variant="ghost" size="icon" className="relative">
          <Link href="/cart" aria-label="Carrello">
            <ShoppingCart className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-[10px] font-bold rounded-full h-4 min-w-[16px] px-1 flex items-center justify-center shadow-xs">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            )}
          </Link>
        </Button>

        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Apri Menu">
              <EllipsisVertical className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent className="flex flex-col items-start pt-8 space-y-4">
            <SheetTitle className="self-center font-bold text-lg">Menu</SheetTitle>

            <div className="w-full flex items-center justify-between border-b pb-3">
              <span className="text-sm text-muted-foreground">Tema</span>
              <ModeToggle />
            </div>

            <Button asChild variant="ghost" className="w-full justify-between text-base">
              <Link href="/cart" className="flex items-center justify-between w-full">
                <div className="flex items-center">
                  <ShoppingCart className="w-5 h-5 mr-3 text-indigo-600 dark:text-indigo-400" />
                  <span>Carrello</span>
                </div>
                {cartCount > 0 && (
                  <span className="bg-indigo-600 text-white text-xs font-bold rounded-full px-2 py-0.5">
                    {cartCount}
                  </span>
                )}
              </Link>
            </Button>

            {isAuthenticated && (
              <div className="w-full space-y-1 border-t pt-3">
                {dashboardLinks.map((item) => (
                  <Button
                    key={item.href}
                    asChild
                    variant="ghost"
                    className="w-full justify-start text-base"
                  >
                    <Link href={item.href} className="flex items-center">
                      <item.icon className="w-5 h-5 mr-3 text-indigo-600 dark:text-indigo-400" />
                      {item.label}
                    </Link>
                  </Button>
                ))}
              </div>
            )}

            <div className="w-full border-t pt-4">
              <UserButton />
            </div>
          </SheetContent>
        </Sheet>
      </nav>
    </div>
  );
};

export default Menu;