import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/assets/styles/globals.css";
import { APP_NAME, APP_DESCRIPTION, SERVER_URL } from "@/lib/constants/index";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/toaster";
import "@/lib/zod-i18n";
import { AuthSessionProvider } from "@/components/auth/AuthSessionProvider";
import { auth } from "@/auth";

import Footer from "@/components/footer";
import PayPalClientProvider from "@/components/providers/PayPalClientProvider";
import HeaderWrapper from "@/components/ui/shared/header/HeaderWrapper";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    template: `%s | ${APP_NAME}`,
    default: APP_NAME,
  },
  description: APP_DESCRIPTION,
  metadataBase: new URL(SERVER_URL),
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth(); 

  let safeSession = null;

  if (session?.user) {
    const cleanedUser = {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      role: session.user.role,
    };
    
    safeSession = { 
      ...session,
      user: cleanedUser,
    };
  }

  const finalSafeSession = safeSession ? JSON.parse(JSON.stringify(safeSession)) : null;

  return (
    <html lang="it" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <PayPalClientProvider>
            <AuthSessionProvider session={finalSafeSession}>
              <div className="flex min-h-screen flex-col">
                <HeaderWrapper />
                <main className="flex-1 w-full">
                  {children}
                </main>
                <Footer />
              </div>
              <Toaster />
            </AuthSessionProvider>
          </PayPalClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}