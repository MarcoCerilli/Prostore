// src/types/react-hook-form.d.ts

import { FieldValues } from "react-hook-form";

// Definizione del tipo UserFormType (DEVE COPIARE LA TUA INTERFACCIA ZOD INFERITA)
// Nota: Rimuovi la parte 'password?: string | undefined' se vuoi includere solo i campi minimi
// ma includerla è più sicuro in questo contesto.
interface IUserFormType {
  id: string;
  name: string;
  email: string;
  role: string;
  password?: string | undefined; 
}

// Estensione del modulo React Hook Form
declare module "react-hook-form" {
  // Estendi l'interfaccia FieldValues per includere i campi minimi del tuo schema.
  // Questo costringe RHF a vedere i tuoi campi come obbligatori.
  export interface FieldValues extends IUserFormType {}
}