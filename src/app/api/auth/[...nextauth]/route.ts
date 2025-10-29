// Importa l'oggetto 'handlers' dal tuo file di configurazione principale (src/auth.ts).
import { handlers } from "@/auth";

// Espone i metodi GET e POST che sono contenuti nell'oggetto handlers.
// L'endpoint della sessione (session) utilizza il metodo GET.
export const { GET, POST } = handlers;
