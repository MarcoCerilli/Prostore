// 📁 File: src/components/auth/AuthSessionProvider.tsx
"use client";

import { SessionProvider } from 'next-auth/react';
import { Session } from 'next-auth'; // Importa il tipo Session di NextAuth per la tipizzazione
import React from 'react';

export function AuthSessionProvider({ 
  children, 
  session 
}: { 
  children: React.ReactNode, 
  session: Session | null | undefined 
}) {
  return <SessionProvider session={session}>{children}</SessionProvider>;
}