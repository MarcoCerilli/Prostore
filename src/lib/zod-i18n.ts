// src/lib/zod-i18n.ts

import { z } from "zod";

// Dichiariamo la funzione senza tipi per evitare l'errore,
// e poi la asseriamo come il tipo Zod atteso.
const italianErrorMap = (issue: any, ctx: any) => {
  let message: string;

  switch (issue.code) {
    // --- Errori di Tipo (Obbligatorietà e Conversione) ---
    case z.ZodIssueCode.invalid_type:
      if (issue.expected === "string" && issue.received === "undefined") {
        message = "Questo campo è obbligatorio.";
      } else if (issue.expected === "number") {
        message = "Deve essere un numero valido.";
      } else {
        message = `Tipo non valido: atteso ${issue.expected}.`;
      }
      break;

    // --- Errori di Lunghezza/Dimensione (es. .min()) ---
    case z.ZodIssueCode.too_small:
      message = `Deve contenere almeno ${issue.minimum} caratteri.`;
      break;

    // Includi altri casi necessari come invalid_string / invalid_format...
    // ...

    default:
      message = ctx.defaultError;
  }

  return { message };
};

// --- LA CORREZIONE CHIAVE ---
// Applichiamo la funzione asserendola come il tipo interno di Zod,
// usando il tipo interno che hai trovato: z.core.$ZodErrorMap<z.core.$ZodIssue>
z.setErrorMap(italianErrorMap as z.core.$ZodErrorMap<z.core.$ZodIssue>);

console.log("Zod locale impostato su Italiano (Forced Type).");
