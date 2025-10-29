
import 'next-auth';
import { DefaultSession } from 'next-auth';
import { DefaultJWT } from 'next-auth/jwt';

// 1. Estendi il tipo JWT
declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    id: string;
    role: string;
  }
}

// 2. Estendi il tipo Session
declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: {
      id: string;
      role: string;
      // Il resto delle proprietà standard (name, email, image)
    } & DefaultSession['user'];
  }

  // 3. Estendi il tipo User (usato nel callback authorize)
  interface User {
    id: string;
    role: string;
  }
}
