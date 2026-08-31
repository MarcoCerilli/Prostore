"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import AdminSearch from "@/components/admin/admin-search";
import { ShieldCheck, ArrowLeft, LayoutDashboard, Package, ShoppingBag, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems = [
  { name: "Overview", href: "/dashboard/admin", icon: LayoutDashboard },
  { name: "Prodotti", href: "/dashboard/admin/products", icon: Package },
  { name: "Ordini", href: "/dashboard/admin/orders", icon: ShoppingBag },
  { name: "Utenti", href: "/dashboard/admin/users", icon: Users },
];

const AdminNavbar = () => {
  const pathname = usePathname();

  return (
    <nav className="bg-white dark:bg-zinc-950 border-b border-gray-200 dark:border-zinc-800 shadow-sm sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo / Brand Admin */}
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/admin"
              className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white rounded-lg font-bold text-base hover:bg-indigo-700 transition"
            >
              <ShieldCheck className="w-5 h-5" />
              <span>ModernStore Admin</span>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-1 lg:space-x-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition duration-150 ease-in-out
                    ${
                      isActive
                        ? "bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-semibold"
                        : "text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 hover:bg-gray-100 dark:hover:bg-zinc-800"
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  {item.name}
                </Link>
              );
            })}
          </div>

          {/* Search Bar and Back to Site */}
          <div className="flex items-center space-x-3">
            <AdminSearch />
            <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex">
              <Link href="/" className="flex items-center gap-1.5">
                <ArrowLeft className="w-4 h-4" />
                <span>Torna al Negozio</span>
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default AdminNavbar;
