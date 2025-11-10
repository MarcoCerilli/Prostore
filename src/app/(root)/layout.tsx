// src/app/root/layout.tsx (Versione CORRETTA)

import Header from "@/components/ui/shared/header";
import Footer from "@/components/footer";
import PayPalClientProvider from "@/components/providers/PayPalClientProvider";

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div className="flex h-screen flex-col">
            <Header />
                <main className="flex-1 w-full"> 
                    <PayPalClientProvider>
                    {children}
                </PayPalClientProvider>
            </main>
            
            <Footer />
        </div>
    );
}