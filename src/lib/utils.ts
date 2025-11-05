import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { CartItem } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
// Assicurati che la funzione sia esportata correttamente:
export function formatNumberWithDecimal(value: number): string {
  // ... logica della funzione
  return value.toFixed(2);
}
/**
 * Utility per convertire oggetti Mongoose/MongoDB in semplici oggetti JavaScript.
 * Questo è necessario per passare gli oggetti serializzabili dal lato server (Mongoose)
 * al lato client (Next.js), poiché gli oggetti Mongoose contengono metodi e proprietà
 * non serializzabili.
 * * @param obj Qualsiasi oggetto o array da convertire.
 * @returns Un oggetto JavaScript semplice e serializzabile.
 */
export const convertToPlainObject = (obj: any): any => {
  if (!obj) {
    return obj;
  }

  // Se l'oggetto ha un metodo toObject (tipico di Mongoose/MongoDB)
  // lo usiamo e poi lo convertiamo in JSON per rimuovere tutte le proprietà non necessarie.
  if (typeof obj.toObject === "function") {
    return JSON.parse(JSON.stringify(obj.toObject()));
  }

  // Se è un array di oggetti Mongoose, mappiamo e applichiamo la conversione.
  if (Array.isArray(obj)) {
    return obj.map((item) => convertToPlainObject(item));
  }

  // Altrimenti, restituisce l'oggetto così com'è se è già un oggetto plain.
  return JSON.parse(JSON.stringify(obj));
};

// Se hai altre funzioni di utilità, assicurati che siano presenti qui sotto:
// export const yourOtherFunction = () => { /* ... */ };

//format errors
// eslint-disable-next-line typescript-eslint/noexplicit-any
export async function formatError(error: any) {
  if (error.name === "ZodError") {
    // Handle Zod  Error
    // 💥 CORREZIONE CHIAVE: Zod usa la proprietà 'issues', non 'errors'
    // Mappa l'array di 'issues' e ne estrai il 'message'.
    const fieldErrors = error.issues.map((issue: any) => issue.message);

    return fieldErrors.join(". ");
  } else if (
    error.name === "PrismaClientKnownRequestError" &&
    error.code === "P2002"
  ) {
    //Handle Prisma error
    const field = error.meta?.target ? error.meta.target[0] : "Field";

    return `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
  } else {
    // Handle other errors

    return typeof error.message === "string"
      ? error.message
      : JSON.stringify(error.message);
  }
}

// Interfaccia per i totali che la funzione restituirà
interface CalculatedTotals {
  itemsPrice: number;
  taxPrice: number;
  shippingPrice: number;
  totalPrice: number;
}
/**
 * Ricalcola i prezzi totali (sottototale, tasse, spedizione, totale finale)
 * di un array di articoli del carrello.
 * * @param items Array di CartItem attuali.
 * @returns I totali calcolati in formato number (arrotondati a 2 decimali).
 */
export function recalculateCartTotals(items: CartItem[]): CalculatedTotals {
  // 1. Calcola il SOTTOTOTALE (itemsPrice)
  const itemsPrice = items.reduce((acc, item) => {
    // Calcolo: Prezzo Unitario * Quantità
    return acc + item.price * item.qty;
  }, 0);

  // 2. Logica Tasse e Spedizione (Esempio)

  // Tasse. 10% sul sottotale
  const TAX_RATE = 0.1;
  const taxPrice = itemsPrice * TAX_RATE;

  // Spedizione: Gratuita sopra i 100€, altrimenti 5€

  const SHIPPING_THRESHOLD = 100;
  const SHIPPING_FEE = 5;
  const shippingPrice = itemsPrice >= SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;

  // 3. Calcola il TOTALE FINALE
  const totalPrice = itemsPrice + taxPrice + shippingPrice;

  // 4. Arrotonda e Restituisci
  // È FONDAMENTALE arrotondare a 2 decimali prima di salvare in un campo Decimal di DB

  return {
    itemsPrice: parseFloat(itemsPrice.toFixed(2)),
    taxPrice: parseFloat(taxPrice.toFixed(2)),
    shippingPrice: parseFloat(shippingPrice.toFixed(2)),
    totalPrice: parseFloat(totalPrice.toFixed(2)),
  };
}

const CURRENCY_FORMATTER = new Intl.NumberFormat("it-IT", {
  currency: "EUR",
  style: "currency",
  minimumFractionDigits: 2,
});
/**
 * Formatta un valore numerico o stringa in formato valuta Euro (€1.234,56).
 * @param amount L'importo da formattare.
 * @returns La stringa formattata o "€0.00" in caso di input non valido.
 */
export function formatCurrency(
  amount: number | string | null | undefined
): string {
  // Assicurati che l'input sia un numero valido
  const numAmount = typeof amount === "string" ? Number(amount) : amount;

  if (typeof numAmount !== "number" || isNaN(numAmount)) {
    return "€0.00"; // Gestione di null/undefined/stringhe non numeriche
  }

  // Usiamo format() per restituire direttamente la stringa formattata
  return CURRENCY_FORMATTER.format(numAmount);
}
