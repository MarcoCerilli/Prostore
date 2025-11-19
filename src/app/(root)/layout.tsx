// Rimosso l'importazione di Menu, Header, Footer, PayPalClientProvider, Link, ecc.
// Non è necessario importare Menu qui se lo hai messo nel layout principale.

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    // Questo layout è annidato e il layout genitore (app/layout.tsx)
    // fornisce già <Header />, <Menu />, <main> e <Footer />.
    // Dobbiamo solo rendere i contenuti specifici della rotta pubblica.
    
    return (
        // Usiamo un frammento per far fluire i children direttamente nel <main> del genitore.
        <>
            {children}
        </>
    );
}