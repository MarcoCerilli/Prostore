import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
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
    if (typeof obj.toObject === 'function') {
        return JSON.parse(JSON.stringify(obj.toObject()));
    }
    
    // Se è un array di oggetti Mongoose, mappiamo e applichiamo la conversione.
    if (Array.isArray(obj)) {
        return obj.map(item => convertToPlainObject(item));
    }

    // Altrimenti, restituisce l'oggetto così com'è se è già un oggetto plain.
    return JSON.parse(JSON.stringify(obj));
};

// Se hai altre funzioni di utilità, assicurati che siano presenti qui sotto:
// export const yourOtherFunction = () => { /* ... */ };
