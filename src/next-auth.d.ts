import 'next-auth';
import { DefaultSession } from 'next-auth';
import { DefaultJWT } from 'next-auth/jwt';

// 1. Estendi il tipo JWT
declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    id: string;
    role: string;
    // ⭐ AGGIUNTA CHIAVE: Per tenere traccia se l'utente ha una password hash nel DB
    password: string | null; 
  }
}

// 2. Estendi il tipo Session
declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: {
      id: string;
      role: string;
      password: string | null; 
      // Il resto delle proprietà standard (name, email, image)
    } & DefaultSession['user'];
  }

  // 3. Estendi il tipo User (usato nel callback authorize)
  interface User {
    id: string;
    role: string;
    password: string | null; 
  }
}