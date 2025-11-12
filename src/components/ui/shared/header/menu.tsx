// 📁 File: src/components/ui/shared/header/menu.tsx
"use client"; // Necessario per usare useSession()

import { EllipsisVertical, ShoppingCart, User, Package, ListOrdered } from "lucide-react"; // Aggiungi ListOrdered
import { Button } from "@/components/ui/button";
import ModeToggle from "./mode-toggle";
import Link from "next/link";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "../../sheet"; // SheetDescription non necessaria
import UserButton from "./user-button";
import { useSession } from "next-auth/react"; // ⭐ IMPORTAZIONE FONDAMENTALE

const Menu = () => {
    // ⭐ 1. RECUPERA LO STATO E IL RUOLO DALLA SESSIONE
    const { data: session, status } = useSession();
    const isAuthenticated = status === 'authenticated';
    const isAdmin = isAuthenticated && session?.user?.role === 'ADMIN';

    // 2. Definisce i link della dashboard standard
    let dashboardLinks = [
        { href: "/dashboard/profile", label: "Il Mio Profilo", icon: User },
        { href: "/dashboard/orders", label: "I Miei Ordini", icon: Package },
    ];
    
    // ⭐ 3. AGGIUNGI IL LINK ADMIN SOLO SE L'UTENTE È ADMIN (Per il menu mobile)
    if (isAdmin) {
        dashboardLinks.unshift(
            { href: "/admin/orders", label: "Gestione Ordini (Admin)", icon: ListOrdered }
        );
    }
    
    // La logica Desktop e Mobile ora si basa sullo stesso stato 'isAdmin' / 'isAuthenticated'

    return (
        <div className="flex justify-end gap-3">
            {/* Navigazione Desktop */}
            <nav className="hidden md:flex w-full max-w-xs gap-1 items-center">
                <ModeToggle />
                
                {/* ⭐ AGGIUNGI QUI IL PULSANTE ORDINI ADMIN (VISTA DESKTOP) */}
                {isAdmin && (
                    <Button asChild variant="ghost" className="flex items-center p-2">
                        <Link href="/admin/orders">
                            <ListOrdered className="w-5 h-5" />
                        </Link>
                    </Button>
                )}
                
                <Button asChild variant="ghost">
                    <Link href="/cart">
                        <ShoppingCart className="w-5 h-5" />
                    </Link>
                </Button>
                <UserButton/>
            </nav>

            {/* Navigazione Mobile */}
            <nav className="md:hidden"> 
                <Sheet>
                    <SheetTrigger asChild>
                         <Button variant="ghost" size="icon">
                            <EllipsisVertical />
                         </Button>
                    </SheetTrigger>
                    <SheetContent className="flex flex-col items-start pt-10">
                        <SheetTitle className="self-center">Menu</SheetTitle>
                        
                        {/* Contenuti statici (ModeToggle, Carrello) */}
                        <ModeToggle />
                        <Button asChild variant="ghost" className="w-full justify-start">
                            <Link href="/cart" className="flex items-center">
                                <ShoppingCart className="w-5 h-5 mr-2"/> Carrello
                            </Link>
                        </Button>
                        
                        {/* ⭐ BLOCCO: Link Dashboard (inclusi Admin) */}
                        {isAuthenticated && (
                            <>
                                {dashboardLinks.map(item => (
                                    <Button key={item.href} asChild variant="ghost" className="w-full justify-start">
                                        <Link href={item.href} className="flex items-center">
                                            <item.icon className="w-5 h-5 mr-2" />
                                            {item.label}
                                        </Link>
                                    </Button>
                                ))}
                            </>
                        )}
                        {/* FINE BLOCCO */}
                        
                        <UserButton/>
                        
                    </SheetContent>
                </Sheet>
            </nav>
        </div>
    );
};

export default Menu;