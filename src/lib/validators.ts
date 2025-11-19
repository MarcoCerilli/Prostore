import { PAYMENT_METHODS } from "@/types";
import * as z from "zod";
import { updateUserProfile } from "./actions/user.actions";

// --- Schemi di Prezzo ---

// Utilizza z.coerce.number() per convertire in modo sicuro la stringa da form in numero.
export const priceSchema = z.coerce
  .number()
  .positive("Il prezzo deve essere maggiore di 0")
  .refine((val) => {
    const parts = val.toString().split(".");
    if (parts.length === 1) return true;
    return parts[1].length <= 2;
  }, "Il prezzo può avere al massimo due cifre decimali.");

// --- Funzione di Pre-Elaborazione per Zod ---

/**
 * Funzione di utilità per convertire null/undefined in stringa vuota.
 * Essenziale per la corretta validazione dei dati provenienti dal database
 * (che potrebbero essere null) prima della validazione Zod.
 */
const stringPreprocessor = (val: any) =>
  val === null || val === undefined ? "" : val;

// --- Schemi di Form (Login, Registrazione, Prodotto) ---

export const signInFormSchema = z.object({
  email: z.preprocess(
    stringPreprocessor,
    z.string().email("Indirizzo email non valido")
  ),
  password: z.preprocess(
    stringPreprocessor,
    z.string().min(6, "La password deve avere almeno 6 caratteri ")
  ),
});

export const signUpFormSchema = z
  .object({
    name: z.preprocess(
      stringPreprocessor,
      z.string().min(3, "Il nome deve contenere almeno 3 caratteri")
    ),
    email: z.preprocess(
      stringPreprocessor,
      z.string().email("Indirizzo email non valido")
    ),
    password: z.preprocess(
      stringPreprocessor,
      z.string().min(6, "La password deve avere almeno 6 caratteri ")
    ),
    confirmpassword: z // Nome del campo: 'confirmpassword'
      .string()
      .min(6, "Conferma la password deve avere almeno 6 caratteri "),
  })
  .refine((data) => data.password === data.confirmpassword, {
    message: "Le passsword non corrispondono",
    path: ["confirmpassword"],
  });

export const insertProductschema = z.object({
  name: z.string().min(3, "Il nome deve contenere almeno 3 caratteri!"),
  slug: z.string().min(3, "Lo slug deve contenere almeno 3 caratteri!"),
  category: z
    .string()
    .min(3, "La categoria deve contenere almeno 3 caratteri!"),
  brand: z.string().min(3, "La marca deve contenere almeno 3 caratteri!"),
  description: z
    .string()
    .min(3, "La descrizione deve contenere almeno 3 caratteri!"),
  stock: z.coerce.number().int("Stock deve essere un numero intero valido"),
  images: z
    .array(z.string())
    .min(1, "Il prodotto deve avere almeno un'immagine"),
  isFeatured: z.boolean(),
  banner: z
    .preprocess(
      (val) => (val === "" ? null : val), //Trasfoma la stringa vuota in null
      z.string().url("URL banner non valido").nullable()
    )
    .optional(),
  price: priceSchema,
});

//SCHEMA PER AGGIORNARE I PRODOTTI
export const updateProductSchema = insertProductschema.extend({
  id: z.string().min(1, "Id è richiesto"),
});

// --- Schemi di Checkout e Carrello ---

/**
 * Schema di validazione Zod per l'Indirizzo di Spedizione.
 */
export const shippingAddressSchema = z.object({
  firstName: z.preprocess(
    stringPreprocessor,
    z.string().min(1, { message: "Il nome è richiesto." })
  ),
  lastName: z.preprocess(
    stringPreprocessor,
    z.string().min(1, { message: "Il cognome è richiesto." })
  ),

  street: z.preprocess(
    stringPreprocessor,
    z.string().min(5, { message: "La via è richiesta." })
  ),
  houseNumber: z.preprocess(
    stringPreprocessor,
    z.string().min(1, { message: "Il numero civico è richiesto." })
  ),

  city: z.preprocess(
    stringPreprocessor,
    z.string().min(2, { message: "La città è richiesta." })
  ),
  postalCode: z.preprocess(
    stringPreprocessor,
    z.string().min(3, { message: "Il CAP è richiesto." })
  ),
  country: z.preprocess(
    stringPreprocessor,
    z.string().min(3, { message: "La nazione è richiesta." })
  ),
  notes: z.preprocess(stringPreprocessor, z.string()).nullable().optional(),

  latitude: z
    .preprocess(stringPreprocessor, z.string().min(1))
    .nullable()
    .optional(),

  longitude: z
    .preprocess(stringPreprocessor, z.string().min(1))
    .nullable()
    .optional(),
});

/**
 * Schema per il metodo di pagamento (usato nel PaymentFormPlaceholder e nell'azione)
 */
export const paymentMethodSchema = z.object({
  paymentMethod: z.enum(["Paypal", "Stripe", "Contrassegno"], {
    message: "Seleziona un metodo di pagamento.",
  }),
});

// Schema dell'Articolo del Carrello (per la sessione o prima di finalizzare)
export const cartItemSchema = z.object({
  productId: z.string().min(1, "L'ID del prodotto è obbligatorio."),
  name: z.string().min(1, "Il nome è obbligatorio."),
  slug: z.string().min(1, "Lo Slug è obbligatorio."),
  qty: z
    .number()
    .int()
    .nonnegative("La quantità deve essere un numero intero positivo."),
  image: z.string().min(1, "L'immagine è obbligatoria."),
  price: z.number().nonnegative("Il prezzo deve essere un numero positivo."),
});

// Schema per l'Inserimento/Aggiornamento del Carrello
export const insertCartSchema = z.object({
  items: z.array(cartItemSchema).min(1, "Il carrello non può essere vuoto."),

  itemsPrice: z
    .number()
    .nonnegative("Il prezzo degli articoli non può essere negativo."),
  totalPrice: z
    .number()
    .nonnegative("Il prezzo totale non può essere negativo."),
  taxPrice: z.number().nonnegative("L'IVA non può essere negativa."),

  sessionCartId: z
    .string()
    .min(1, "L'ID del carrello di sessione è obbligatorio."),

  userId: z.string().optional(),
});

// --- Schemi per la Creazione dell'Ordine (Punto 68/69) ---

/**
 * Schema per un singolo prodotto (OrderItem) all'interno dell'ordine,
 * riflette i dati che saranno salvati in DB.
 */
export const OrderItemSchema = z.object({
  productId: z.string(),
  name: z.string(),
  quantity: z.number().int().positive(),
  price: z.number().positive(),
  imageUrl: z.string().url().optional(),
});

/**
 * Schema Completo per la richiesta di Piazzamento Ordine (Place Order).
 */
export const OrderSchema = z.object({
  userId: z.string().min(1, { message: "ID utente richiesto." }),

  shippingAddress: shippingAddressSchema,

  paymentMethod: paymentMethodSchema,

  // Questi verranno calcolati o passati dal carrello
  subtotal: z.number().positive(),
  shippingCost: z.number().nonnegative(),
  tax: z.number().nonnegative(),
  totalAmount: z.number().positive(),

  // Prodotti ordinati
  items: z
    .array(OrderItemSchema)
    .min(1, { message: "L'ordine deve contenere almeno un articolo." }),
});

// Types helper
export type ShippingAddress = z.infer<typeof shippingAddressSchema>;
export type PaymentMethod = z.infer<typeof paymentMethodSchema>;
export type OrderItem = z.infer<typeof OrderItemSchema>;
export type OrderRequest = z.infer<typeof OrderSchema>;

/**
 * 1. Definizione dell'ENUM per gli Stati dell'Ordine (Riflette Prisma)
 */
export const OrderStatusSchema = z.enum([
  "PENDING_PAYMENT",
  "PAID",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
]);

/**
 * 2. Schema per un singolo prodotto (OrderItem) all'interno dell'ordine,
 * riflette i dati che saranno salvati in DB.
 */
export const insertOrderItemSchema = z.object({
  productId: z.string(),
  slug: z.string(),
  image: z.string(),
  name: z.string(),
  price: z.number().nonnegative(),
  qty: z.number().int().positive(),
});

/**
 * 3. Schema per l'inserimento dell'Ordine (insertOrderSchema)
 */
export const insertOrderSchema = z.object({
  userId: z.string().min(1, "Utente richiesto"),
  itemsPrice: z.number().nonnegative(),
  shippingPrice: z.number().nonnegative(),
  taxPrice: z.number().nonnegative(),
  totalPrice: z.number().nonnegative(),

  paymentMethod: z.string().refine((data) => PAYMENT_METHODS.includes(data), {
    message: "Metodo di pagamento non valido",
  }),

  status: OrderStatusSchema.default("PENDING_PAYMENT"),

  // Manteniamo le date per la cronologia (utili per l'admin)
  paidAt: z.date().nullable().optional(),
  deliveredAt: z.date().nullable().optional(),

  shippingAddress: shippingAddressSchema,
});

export const paymentResultSchema = z.object({
  id: z.string(),
  status: z.string(),
  email_address: z.string(),
  price_paid: z.string(),
});

// Nel tuo file validators.ts

export const updateUserProfileSchema = z.object({
  
 name: z.string()
    .min(3, "Il nome deve contenere almeno 3 caratteri")
    .trim()
    .optional() // L'input può essere undefined (da RHF o dal DB)
    .transform(e => e ?? ""), // Se undefined o null, diventa "" (garantendo il tipo string)
    
  // 2. CAMPO EMAIL
  email: z.string()
    .email("Indirizzo email non valido")
    .trim()
    .optional()
    .transform(e => e ?? ""),
    
  // 3. PASSWORD (la sua logica è già corretta e non va toccata)
  password: z.string()
    .min(6, "La password deve avere almeno 6 caratteri ")
    .optional()
    .or(z.literal("")),
});

// Schema per aggiornare utenti (QUESTO NON DEVE CAMBIARE)
export const updateUserSchema = updateUserProfileSchema.extend({
  id: z.string().min(1, "Id è richiesto"),
  role: z.string().min(1, "Il ruolo è richiesto"),
});