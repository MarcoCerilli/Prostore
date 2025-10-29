import z from "zod";

// Assumo che formatNumberWithDecimal provenga da un file utils
import { formatNumberWithDecimal } from "./utils";

// --- SCHEMA PER LA VALUTA (PRICE) ---

/**
 * Convalida la valuta prima della coercizione.
 * NOTA: Questo schema è pensato per la validazione di un input *dopo* la formattazione.
 * Se lo usi in un form, Zod gestirà la conversione stringa -> numero.
 * @deprecated Preferire z.coerce.number() per la validazione standard.
 */
const currency = z
  .string()
  .refine(
    (value) => /^\d+(\.\d{2})?$/.test(formatNumberWithDecimal(Number(value))),
    "Il prezzo deve avere esattamente due cifre decimali"
  );

// --- SCHEMA PREZZO MODERNO E ROBUSTO (consigliato) ---
// Utilizza z.coerce.number() per convertire in modo sicuro la stringa da form in numero.
export const priceSchema = z.coerce
  .number()
  // Il prezzo deve essere maggiore di zero (validazione logica)
  .positive("Il prezzo deve essere maggiore di 0")
  // Validazione opzionale: controlla che ci siano al massimo due decimali
  .refine((val) => {
    // Converti in stringa e dividi per il punto decimale
    const parts = val.toString().split(".");
    if (parts.length === 1) return true; // Nessun decimale
    return parts[1].length <= 2; // Massimo due decimali
  }, "Il prezzo può avere al massimo due cifre decimali.");

// Schema per inserire prodotti
export const insertProductschema = z.object({
  name: z.string().min(3, "Il nome deve contenere almeno 3 caratteri!"), // Tradotto
  slug: z.string().min(3, "Lo slug deve contenere almeno 3 caratteri!"), // Tradotto
  category: z
    .string()
    .min(3, "La categoria deve contenere almeno 3 caratteri!"), // Tradotto
  brand: z.string().min(3, "La marca deve contenere almeno 3 caratteri!"), // Tradotto
  description: z
    .string()
    .min(3, "La descrizione deve contenere almeno 3 caratteri!"), // Tradotto
  // Rimosso { invalid_type_error: "..." } per risolvere l'errore TypeScript
  stock: z.coerce.number().int("Stock deve essere un numero intero valido"),
  images: z
    .array(z.string())
    .min(1, "Il prodotto deve avere almeno un'immagine"), // Tradotto
  isFeatured: z.boolean(),
  banner: z.string().nullable(),
  // Usa lo schema di prezzo più robusto
  price: priceSchema,
});

// Schema for signin User in
export const signInFormSchema = z.object({
  email: z.string().email("Indirizzo email non valido"),
  password: z.string().min(6, "La password deve avere almeno 6 caratteri "),
});

// Schema for Signing Up a  User
export const signUpFormSchema = z.object({
  name: z.string().min(3, "Il nome deve contenere almeno 3 caratteri"),
  email: z.string().email("Indirizzo email non valido"),
  password: z.string().min(6, "La password deve avere almeno 6 caratteri "),
  confirmpassword: z
    .string()
    .min(6, "Conferma la password deve avere almeno 6 caratteri "),
}). refine((data) => data.password ===  data.confirmpassword, {
    message: "Le passsword non corrispondono",
    path:["confirmPassword"]
})
