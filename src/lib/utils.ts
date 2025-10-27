import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

//Convertiamo un oggetto prisma in un oggetto regolare JS

export function convertToPlainObject<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

//Se si chiama la funzione con un oggetto prodotto ,
//  TypeScript sa che anche il valore di ritorno è un tipo prodotto

//funzione per formattare il prezzo in modo corretto con il decimale e ritornerà una strina
export function formatNumberWithDecimal(num: number): string {
  const [int, decimal] = num.toString().split("."); // Usiamo il metodo split per dividere l'intero dal decimale
  return decimal ? "${int}.${decimal.padEnd(2,'0')}" : "${int}.00";
}
