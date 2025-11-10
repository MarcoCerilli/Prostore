// File: src/components/ui/shared/header/menu.tsx

import { EllipsisVertical, ShoppingCart, User, Package } from "lucide-react"; // AGGIUNGI User e Package
import { Button } from "@/components/ui/button";
import ModeToggle from "./mode-toggle";
import Link from "next/link";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "../../sheet";
import UserButton from "./user-button";

// ⭐ AGGIUNGI QUI LA LOGICA PER RECUPERARE LO STATO DI AUTENTICAZIONE (ES: DA HOOK/CONTEXT)
// Per l'esempio, simuleremo l'autenticazione con una costante booleana.
const IS_AUTHENTICATED = true; // DOVRAI SOSTITUIRLO CON IL VERO STATO DELL'UTENTE

const dashboardLinks = [
    { href: "/dashboard/profile", label: "Il Mio Profilo", icon: User },
    { href: "/dashboard/orders", label: "I Miei Ordini", icon: Package },
];

const Menu = () => {
    return (
        <div className="flex justify-end gap-3">
            {/* Navigazione Desktop (invariata) */}
            <nav className="hidden md:flex w-full max-w-xs gap-1">
                <ModeToggle />
                <Button asChild variant="ghost">
                    <Link href="/cart">
                        <ShoppingCart />Carrello
                    </Link>
                </Button>
                <UserButton/>
            </nav>

            {/* Navigazione Mobile */}
            <nav className="md-hidden">
                <Sheet>
                    <SheetTrigger className="align-middle">
                        <EllipsisVertical />
                    </SheetTrigger>
                    <SheetContent className="flex flex-col items-start">
                        <SheetTitle>Menu</SheetTitle>
                        
                        {/* Contenuti statici (ModeToggle, Carrello) */}
                        <ModeToggle />
                        <Button asChild variant="ghost" className="w-full justify-start">
                            <Link href="/cart" className="flex items-center">
                                <ShoppingCart className="w-5 h-5 mr-2"/> Carrello
                            </Link>
                        </Button>
                        
                        {/* ⭐ NUOVO BLOCCO: Link Dashboard (Solo se loggato) */}
                        {IS_AUTHENTICATED && (
                            <>
                                {dashboardLinks.map(item => (
                                    // Usiamo Button asChild per l'accessibilità e lo stile
                                    <Button key={item.href} asChild variant="ghost" className="w-full justify-start">
                                        <Link href={item.href} className="flex items-center">
                                            <item.icon className="w-5 h-5 mr-2" />
                                            {item.label}
                                        </Link>
                                    </Button>
                                ))}
                            </>
                        )}
                        {/* FINE NUOVO BLOCCO */}
                        
                        {/* UserButton, gestisce probabilmente Login/Logout */}
                        <UserButton/>
                        <SheetDescription></SheetDescription>
                    </SheetContent>
                </Sheet>
            </nav>
        </div>
    );
};

export default Menu;