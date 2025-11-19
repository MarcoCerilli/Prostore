// src/lib/types.ts
import * as z from 'zod';

export const AuthSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  email: z.string().email(),
  role: z.string(),
  password: z.string().optional(),
});

export type AuthFormType = z.infer<typeof AuthSchema>;