import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { BackendCartItem } from "@/types";

/**
 * Unisce le classi Tailwind in modo condizionale e gestisce i conflitti.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- FUNZIONI DI FORMATTAZIONE (Per Componenti Frontend) ---

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

  return CURRENCY_FORMATTER.format(numAmount);
}

/**
 * Formatta una data o una stringa data in un formato leggibile (es. 25/12/2024).
 * QUESTA ERA LA FUNZIONE MANCANTE CHE CAUSAVA L'ERRORE.
 * @param dateInput La data da formattare (Date object o stringa).
 */
export function formatOrderDate(dateInput: Date | string | null | undefined): string {
    if (!dateInput) {
        return "N/D";
    }

    let date: Date;
    if (typeof dateInput === 'string') {
        date = new Date(dateInput);
    } else {
        date = dateInput;
    }

    // Controlla se la data è valida
    if (isNaN(date.getTime())) {
        return "Data non valida";
    }

    // Formato Giorno/Mese/Anno
    return date.toLocaleDateString('it-IT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
}


/**
 * Assicura che un numero sia formattato come stringa a due decimali
 * (es: 199.9 -> "199.90"). Utile per interazioni API che richiedono stringhe con precisione fissa.
 */
export function formatNumberWithDecimal(value: number): string {
  return value.toFixed(2);
}


// --- FUNZIONI DI MANIPOLAZIONE DATI (Per Server Actions) ---


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
export function recalculateCartTotals(items: BackendCartItem[]): CalculatedTotals {
  // 1. Calcola il SOTTOTOTALE (itemsPrice)
  const itemsPrice = items.reduce((acc, item) => {
    const price = Number(item.price);

    const qty = Number(item.qty);

    return acc + price * qty;
  }, 0);

  // 2. Logica Tasse e Spedizione (Esempio)

  // Tasse. 22% sul sottotale (IVA Italiana)
  const TAX_RATE = 0.22;
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


/**
 * Utility per convertire oggetti Mongoose/MongoDB in semplici oggetti JavaScript.
 * Questo è necessario per passare gli oggetti serializzabili dal lato server (Mongoose)
 * al lato client (Next.js).
 * @param obj Qualsiasi oggetto o array da convertire.
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

// --- GESTIONE ERRORI ---

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function formatError(error: any): Promise<string> {
  if (error.name === "ZodError") {
    // Gestione Zod Error
    // Mappa l'array di 'issues' e ne estrai il 'message'.
    const fieldErrors = error.issues.map((issue: any) => issue.message);
    return fieldErrors.join(". ");
  } else if (
    error.name === "PrismaClientKnownRequestError" &&
    error.code === "P2002"
  ) {
    // Gestione errore di Prisma (Violazione Unique Constraint)
    const field = error.meta?.target ? error.meta.target[0] : "Field";
    return `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
  } else {
    // Gestione altri errori
    return typeof error.message === "string"
      ? error.message
      : JSON.stringify(error.message);
  }
}

/**
 * Formatta una stringa ID (es. ID di Prisma) per renderla leggibile (prime 4 cifre + ultima 4 cifre).
 */
export function formatId(id: string) {
    if (!id || id.length < 8) return id;
    return `${id.substring(0, 4)}...${id.substring(id.length - 4)}`;
}
