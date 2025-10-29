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