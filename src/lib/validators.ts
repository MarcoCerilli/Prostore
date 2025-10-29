import z, { email } from "zod";
import { formatNumberWithDecimal } from "./utils";

const currency =  z
    .string()
    .refine((value) => /^\d+(\.\d{2})?$/.test(formatNumberWithDecimal(Number(value))),
"Il prezzo deve avere esattamente due cifre decimali")

// Schema per inserire prodotti

export const insertProductschema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters!"),
  slug: z.string().min(3, "Slug must be at least 3 characters!"),
  category: z.string().min(3, "Category must be at least 3 characters!"),
  brand: z.string().min(3, "Brand must be at least 3 characters!"),
  description: z.string().min(3, "Description must be at least 3 characters!"),
  stock: z.coerce.number(), //coerce lo costringerà a diventare un numero arrivando da un modulo probabilmente come stringa
  images: z.array(z.string()).min(1, "Product must have at least one image"),
  isFeatured: z.boolean(),
  banner: z.string().nullable(),
  price: currency,
});

// Schema for signin User in 
export const signInFormSchema = z.object({
    email: z.string().email("Indirizzo email non valido"),
    password: z.string().min(6, "La password deve avere almeno 6 caratteri ")
})













// Assumendo che questo sia parte di una catena di validazione Zod:

/**
 * .refine() è un metodo Zod utilizzato per aggiungere una validazione personalizzata
 * che va oltre le verifiche di tipo standard (come 'string', 'number', ecc.).
 * * SCOPO: Verificare che il 'value' (che è stato precedentemente convalidato come numero)
 * sia nel formato corretto DOPO essere stato elaborato dalla funzione.
 * 
 * * 1. Number(value): Converte l'input (spesso una stringa da un modulo) in un numero.
 * 2. formatNumberWithDecimal(...): Applica una formattazione al numero (es. aggiunge decimali, virgole, ecc.).
 * 3. /^/.test(...): Esegue un test di espressione regolare (regex) sulla stringa formattata.
 * - NOTA: L'espressione regolare /^/ è un test POSITIVO che controlla l'inizio della stringa.
 * In questo caso, è un test che restituirà SEMPRE 'true' su qualsiasi stringa,
 * il che suggerisce che questa validazione NON È COMPLETA, ma che mancano 
 * i criteri REALI che dovrebbero essere inseriti dopo il '^' (inizio stringa), 
 * come ad esempio i requisiti di lunghezza o formato specifico dei decimali.
 */
