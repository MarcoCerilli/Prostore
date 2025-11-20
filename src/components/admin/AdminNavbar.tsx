"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import AdminSearch from "@/components/admin/admin-search"; // Assicurati che il percorso sia corretto

const navItems = [
  { name: "Overview", href: "/admin" },
  { name: "Products", href: "/admin/products" },
  { name: "Orders", href: "/admin/orders" },
  { name: "Users", href: "/admin/users" },
];

const AdminNavbar = () => {
  const pathname = usePathname();

  return (
    <nav className="bg-white border-b border-gray-200 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo/Icona (a sinistra) */}
          <div className="flex items-center">
            <Link
              href="/admin"
              className="p-2 bg-yellow-600 rounded-lg text-white font-bold text-xl"
            >
              {/* Sostituisci con il tuo componente logo/icona */}
            </Link>
          </div>

          {/* Link di Navigazione Centrali */}
          <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition duration-150 ease-in-out
                  ${
                    pathname === item.href
                      ? "border-indigo-600 text-indigo-900"
                      : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                  }
                `}
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Barra di Ricerca e Azioni (a destra) */}
          <div className="flex items-center space-x-4">
            {/* Componente AdminSearch */}
            <AdminSearch />
            {/* {/* Azioni Carrello/Impostazioni (se presenti) */}
            {/*  <button className="text-gray-400 hover:text-gray-500">
            </button> 
            <Link href="/cart" className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition duration-150">
                Carrello
            </Link> */}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default AdminNavbar;
