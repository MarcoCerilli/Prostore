// src/lib/zod-i18n.ts

import { z } from "zod";

// Mappa personalizzata degli errori in italiano per Zod v4
const italianErrorMap: z.core.$ZodErrorMap = (issue) => {
  let message: string | undefined;

  switch (issue.code) {
    // --- Errori di Tipo (Obbligatorietà e Conversione) ---
    case z.ZodIssueCode.invalid_type:
      if (issue.expected === "string" && issue.input === undefined) {
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

    default:
      break;
  }

  return message ? { message } : undefined;
};

z.setErrorMap(italianErrorMap);

console.log("Zod locale impostato su Italiano.");
