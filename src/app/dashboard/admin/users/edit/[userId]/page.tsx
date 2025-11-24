// C:\NEXT.js\prostore\src\app\admin\users\edit\[userId]\page.tsx (SERVER COMPONENT)

import { getUserById } from "@/lib/actions/user.actions";
import { updateUserSchema } from "@/lib/validators";
import UpdateUserForm from "./update-user-form"; // Importa il form client
import { z } from "zod";

// Tipizzazione del payload pulito (quello che il form si aspetta)
type UserformType = z.infer<typeof updateUserSchema>;

export default async function AdminEditUserPage({
  params,
}: {
  params: { userId: string };
}) {
  // 1. Recupero Dati Utente dal DB
  const resolvedParams = await Promise.resolve(params);
  const userId = resolvedParams.userId;

  if (!userId || userId === "undefined") {
    console.error("ID Utente non valido o mancante:", userId);

    return (
      <div className="text-center mt-10 text-red-600">
        Utente con ID {params.userId} non trovato.
      </div>
    );
  }
  // 1. Recupero Dati Utente dal DB (Ora la chiamata è sicura)
  const rawUser = await getUserById(userId); // Utilizziamo l'ID verificato
  // 🛑 CORREZIONE 2: Se rawUser è nullo, è un utente non trovato

  if (!rawUser) {
    return (
      <div className="text-center mt-10 text-red-600">
                Utente con ID {userId} non trovato.      {" "}
      </div>
    );
  }
  // 2. 🛡️ Preparazione e Sanificazione dei Dati (CRUCIALE per Zod e defaultValues)
  // Assicurati che ogni campo atteso da updateUserSchema (id, name, email, role, password) sia presente e tipizzato come stringa (se non nullo).

  const sanitizedUser = {
    id: rawUser.id,
    name: rawUser.name ?? "", // <-- DEVE essere "" se null
    email: rawUser.email ?? "", // <-- DEVE essere "" se null
    role: rawUser.role,
    password: "", // ⚠️ NON inviare l'hash della password al client!
  };

  // 3. Rendering del Client Component con i dati puliti
  return (
    <div className="p-4 md:p-8">
      <h1 className="text-2xl font-bold mb-6">
        Modifica Utente: {sanitizedUser.name}
      </h1>
      <UpdateUserForm user={sanitizedUser} />
    </div>
  );
}

// Nota: Assicurati che getUserById esista e che i campi che restituisce
// (es. rawUser.name) corrispondano ai nomi usati qui.
