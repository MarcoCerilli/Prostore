"use client";

import { SessionProvider } from 'next-auth/react';
import React from 'react';

// Questo wrapper deve essere un componente client
export function AuthSessionProvider({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}