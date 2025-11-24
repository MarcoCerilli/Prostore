// File: lib/actions/user.actions.ts (CORRETTO e AGGIORNATO)

"use server";

import {
  signInFormSchema,
  signUpFormSchema,
  shippingAddressSchema,
  paymentMethodSchema,
} from "../validators";
import { signIn, signOut } from "@/auth";
import { hashSync, compare } from "bcrypt-ts-edge";
import prisma from "@/db/prisma";
import { formatError } from "../utils";
import { auth } from "@/auth";
import { success, z } from "zod";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { convertToPlainObject } from "../utils";
import { updateUserSchema } from "../validators"; 
import Stripe from 'stripe';


type UserBaseUpdatePayload = z.infer<typeof updateUserSchema>;

//definiamo la costante PAGE_SIZE
const PAGE_SIZE = 6;

// Assumiamo un tipo base per l'utente, basato sullo schema Prisma
type User = {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  createdAt: Date;
  updatedAt: Date;
};

// Definizione dei tipi locali (se non importati da "@/types")
type BackendCartItem = {
  productId: string;
  qty: number;
  price: number;
  name: string;
  slug: string;
  image: string;
};
type OrderStatus =
  | "PENDING_PAYMENT"
  | "PAID"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

// Tipi per la risposta delle Server Actions
type ActionResponse = {
  success: boolean;
  message: string;
};

// ----------------------------------------------------------------------
// --- DEFINIZIONE TIPI PER IL PROFILO (CORRETTO) ---
// ----------------------------------------------------------------------
// ----------------------------------------------------------------------
// 💡 FUNZIONE AGGIUNTA: Aggiornamento Dati Base Utente (Nome, Email, Ruolo, Password)
// ----------------------------------------------------------------------

/**
 * Aggiorna i dati base dell'utente (nome, email, ruolo, password).
 * Questo risolve il problema di tipizzazione nel form di amministrazione/profilo.
 */
export async function updateUserBaseData(
  payload: UserBaseUpdatePayload
): Promise<ActionResponse> {
  // Assicurati che 'hashSync' sia importato (è presente in cima al tuo file)

  // 1. Validazione Zod
  const validationResult = updateUserSchema.safeParse(payload);

  if (!validationResult.success) {
    const errorMsg = validationResult.error.issues
      .map((issue) => `${String(issue.path[0])}: ${issue.message}`)
      .join("; ");
    return { success: false, message: `Errore di validazione: ${errorMsg}` };
  }

  // Estraiamo i campi, separando id e password (che richiede hashing)
  const { id, password, ...dataToUpdate } = validationResult.data;

  // 2. Preparazione dei dati per il DB
  const updateData: Prisma.UserUpdateInput = {
    ...dataToUpdate,
    // Il campo email è nullo nel tuo tipo User, ma nel form Zod è stringa non nulla.
    // Assicuriamoci che i dati siano puliti
    email: dataToUpdate.email,
    name: dataToUpdate.name,
    role: dataToUpdate.role,
  };

  if (password && password.length >= 6) {
    // Solo se una nuova password è stata fornita e valida
    updateData.password = hashSync(password, 10);
  }

  try {
    // 3. Aggiornamento nel database
    const updatedUser = await prisma.user.update({
      where: { id: id },
      data: updateData,
      select: { id: true, name: true, email: true, role: true },
    });

    // 4. AGGIORNAMENTO DELLA SESSIONE NEXTAUTH (Cruciale se l'utente aggiorna se stesso)
    // Se si tratta di un'azione Admin che aggiorna un altro utente, questa parte può essere omessa
    // o condizionata per non aggiornare la sessione dell'Admin.
    /*  await signIn("credentials", {
            redirect: false,
            user: {
                id: updatedUser.id,
                name: updatedUser.name,
                email: updatedUser.email,
                role: updatedUser.role,
            },
            update: true,
        } as any);
 */
    // 5. Invalida la cache
    revalidatePath("/admin/users"); // Per aggiornare la tabella admin
    revalidatePath("/dashboard/profile"); // Per aggiornare il profilo

    return {
      success: true,
      message: "Dati utente aggiornati con successo!",
    };
  } catch (error) {
    console.error("Errore nell'aggiornamento dei dati utente base:", error);
    return {
      success: false,
      message: "Errore nel salvataggio dei dati utente. Riprova più tardi.",
    };
  }
}

/**
 * Schema Zod esteso che include tutti i campi di spedizione PIÙ l'ID utente.
 * Questo schema è utilizzato per validare il payload dell'azione updateUserProfile.
 */
const userProfileUpdateSchema = shippingAddressSchema.extend({
  // L'ID utente DEVE essere incluso nel payload per l'azione server
  userId: z.string().min(1, "ID Utente necessario per l'aggiornamento"),
});

/**
 * Tipizzazione del payload che la funzione updateUserProfile si aspetta.
 */
type UserProfileUpdatePayload = z.infer<typeof userProfileUpdateSchema>;

// ----------------------------------------------------------------------
// --- FUNZIONI UTILITY (Check Reindirizzamento) ---
// ----------------------------------------------------------------------

// 💡 Funzione robusta per controllare l'errore di reindirizzamento
const isNextRedirectError = (error: any) => {
  return (
    error &&
    typeof error === "object" &&
    "digest" in error &&
    error.digest?.includes("NEXT_REDIRECT")
  );
};

// ----------------------------------------------------------------------
// --- FUNZIONI DI AUTENTICAZIONE E REGISTRAZIONE ---
// ----------------------------------------------------------------------

/**
 * Server Action per l'accesso utente con credenziali (Email/Password).
 */
export async function signInWithCredentials(
  prevState: unknown,
  formData: FormData
) {
  try {
    const { email, password } = signInFormSchema.parse({
      email: formData.get("email") as string,
      password: formData.get("password") as string,
    });

    const redirectTo = formData.get("callbackUrl") as string | null;

    await signIn("credentials", {
      email,
      password,
      redirectTo: redirectTo || "/",
    });

    return { success: true, message: "Loggato con successo" };
  } catch (error) {
    // ✅ CORREZIONE: Controllo sul digest
    if (isNextRedirectError(error)) {
      throw error;
    }

    if ((error as any).type === "CredentialsSignin") {
      return { success: false, message: "Password o Email non valida" };
    }

    return { success: false, message: "Errore sconosciuto durante l'accesso." };
  }
}

/**
 * Server Action per il logout utente.
 */
export async function signOutUser() {
  await signOut();
}

/**
 * Server Action per la registrazione di un nuovo utente.
 */
export async function signUpUser(prev: unknown, formData: FormData) {
  try {
    const validationResult = signUpFormSchema.safeParse({
      name: (formData.get("name") as string).trim(),
      email: (formData.get("email") as string).trim(),
      password: (formData.get("password") as string).trim(),
      confirmpassword: (formData.get("confirmpassword") as string).trim(),
    });

    if (!validationResult.success) {
      throw validationResult.error;
    }

    const rawUser = validationResult.data;

    if (rawUser.password !== rawUser.confirmpassword) {
      return { success: false, message: "Le password non corrispondono." };
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: rawUser.email },
    });
    if (existingUser) {
      return { success: false, message: "Questa email è già registrata." };
    }

    const plainPassword = rawUser.password;
    const hashedPassword = hashSync(rawUser.password, 10);

    await prisma.user.create({
      data: {
        name: rawUser.name,
        email: rawUser.email,
        password: hashedPassword, // Assegna il ruolo predefinito se necessario
      },
    });

    await signIn("credentials", {
      email: rawUser.email,
      password: plainPassword,
    });

    return { success: true, message: "Utente registrato con successo" };
  } catch (error) {
    // ✅ CORREZIONE: Controllo sul digest
    if (isNextRedirectError(error)) {
      throw error;
    }

    const detailedMessage = await formatError(error);
    return {
      success: false,
      message:
        detailedMessage ||
        "Errore sconosciuto durante la registrazione. Riprova.",
    };
  }
}

// ----------------------------------------------------------------------
// --- FUNZIONI UTENTE E CHECKOUT ---
// ----------------------------------------------------------------------

/**
 * Recupera i dettagli di un utente, includendo l'indirizzo di spedizione.
 * 🚨 FUNZIONE PRECEDENTEMENTE OMESSA (getUserById)
 */
export async function getUserById(userId: string) {
  console.log("Tentativo di recuperare utente con ID:", userId);
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      address: true,
    },
  }); // Assicurati di convertire l'indirizzo JSON in un oggetto JavaScript utilizzabile
  // Se l'indirizzo non è nullo, esegui la conversione
  return user
    ? {
        ...user,
        address: user.address ? JSON.parse(JSON.stringify(user.address)) : null,
      }
    : null;
}

/**
 * Ottiene i dati del profilo utente per la Dashboard.
 * 🚨 FUNZIONE PRECEDENTEMENTE OMESSA (getUserProfileData)
 */
export async function getUserProfileData() {
  const session = await auth();
  if (!session?.user?.id) return null;

  return await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      address: true,
      paymentMethod: true,
    },
  });
}

/**
 * Salva l'indirizzo di spedizione nel campo 'address' del modello User.
 */
export async function saveShippingAddress(
  formData: z.infer<typeof shippingAddressSchema>
) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    throw new Error("Autenticazione richiesta per salvare l'indirizzo.");
  }

  const validation = shippingAddressSchema.safeParse(formData);

  if (!validation.success) {
    const errors = validation.error.issues
      .map(
        (issue: { path: any[]; message: any }) =>
          `${issue.path[0]}: ${issue.message}`
      )
      .join(", ");
    throw new Error(`Errore di validazione: ${errors}`);
  }

  const validatedData = validation.data;

  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        address: validatedData as Prisma.InputJsonValue,
      },
    }); // 4. REINDIRIZZAMENTO allo step successivo (Payment)

    redirect("/checkout?step=payment");
  } catch (error) {
    // ✅ CORREZIONE: Controllo sul digest
    if (isNextRedirectError(error)) {
      throw error;
    }
    console.error("Errore nel salvataggio dell'indirizzo:", error);
    throw new Error(
      "Si è verificato un errore durante il salvataggio dell'indirizzo."
    );
  }
}

// ----------------------------------------------------------------------
// 💡 FUNZIONE: AGGIORNAMENTO PROFILO (CORRETTA)
// ----------------------------------------------------------------------

/**
 * Aggiorna i dettagli di spedizione e profilo dell'utente autenticato, salvando il JSON 'address'.
 */
export async function updateUserProfile(
  payload: UserProfileUpdatePayload
): Promise<ActionResponse> {
  // 1. Validazione Zod: Validiamo L'INTERO PAYLOAD (incluso userId)
  const validationResult = userProfileUpdateSchema.safeParse(payload);

  if (!validationResult.success) {
    const errorMsg = validationResult.error.issues
      .map((issue) => `${String(issue.path[0])}: ${issue.message}`)
      .join("; ");
    return { success: false, message: `Errore di validazione: ${errorMsg}` };
  }

  const { userId, ...validatedAddressData } = validationResult.data;
  const validatedData = validatedAddressData;

  const newFullName = `${validatedData.firstName} ${validatedData.lastName}`;

  // 💡 Ottimizzazione: Estrazione esplicita dei dati per il campo JSON 'address'
  const { firstName, lastName, ...addressData } = validatedData;

  try {
    // 2. Aggiornamento nel database
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        // Aggiorniamo il nome combinato
        name: newFullName,
        // Aggiorniamo l'oggetto address JSON
        address: addressData as Prisma.InputJsonValue,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    // 3. AGGIORNAMENTO DELLA SESSIONE NEXTAUTH
    // Rigenera la sessione con i nuovi dati (essenziale per nome/ruolo)
    await signIn("credentials", {
      redirect: false,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
      },
      update: true,
    } as any); // Il cast 'as any' è spesso necessario qui

    // 4. Invalida la cache per la pagina del profilo
    revalidatePath("/dashboard/profile");

    return {
      success: true,
      message: "Profilo e dettagli di spedizione aggiornati con successo!",
    };
  } catch (error) {
    console.error("Errore nell'aggiornamento del profilo:", error);

    // Gestione di errori specifici di Prisma (es. violazione unique) qui se necessario

    return {
      success: false,
      message: "Errore nel salvataggio del profilo. Riprova più tardi.",
    };
  }
}

/**
 * Aggiornamento del metodo di pagamento dell' Utente.
 */
export async function updateUserpaymentmethod(
  data: z.infer<typeof paymentMethodSchema>
) {
  try {
    const session = await auth();
    const currentUser = await prisma.user.findFirst({
      where: { id: session?.user?.id },
    });
    if (!currentUser) throw new Error("Utente non trovato");

    const validation = paymentMethodSchema.parse(data); // Aggiorniamo il database

    await prisma.user.update({
      where: { id: currentUser.id },
      data: { paymentMethod: validation.paymentMethod },
    }); // Reindirizzamento per passare allo step 'place-order'

    redirect("/checkout?step=place-order");
  } catch (error) {
    if (isNextRedirectError(error)) {
      throw error;
    }
    console.error("Errore nell'aggiornamento del metodo di pagamento:", error);
    throw new Error(
      "Si è verificato un errore durante l'aggiornamento del metodo di pagamento."
    );
  }
}

// ----------------------------------------------------------------------
// 💡 FUNZIONE: Recupero Dettagli Ordine (Corretto)
// ----------------------------------------------------------------------

/**
 * Recupera i dettagli di un ordine specifico per l'utente loggato.
 * @param orderId L'ID interno dell'Ordine (colonna 'id' UUID)
 */
export async function getOrderDetailsAction(orderId: string) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return null;
  }
  try {
    const order = await prisma.order.findFirst({
      where: {
        orderNumber: orderId,
        userId: userId, // CRUCIALE: Filtra per l'utente corrente
      },
      include: {
        OrderItem: {
          // Includi tutti gli articoli relativi a questo ordine
          select: {
            name: true,
            price: true,
            qty: true,
            slug: true,
            image: true,
            productId: true,
          },
        },
      },
    });
    if (!order) {
      return null;
    } // --- SANIFICAZIONE ITEMS PRICE ---

    const sanitizedOrder = {
      ...order,
      totalPrice: Number(order.totalPrice),
      shippingPrice: Number(order.shippingPrice),
      taxPrice: Number(order.taxPrice),
      itemsPrice: Number(order.itemsPrice),
      OrderItem: order.OrderItem.map((item: { price: any; }) => ({
        ...item,
        price: Number(item.price),
      })),
    };
    return sanitizedOrder;
  } catch (error) {
    console.error("Errore nel recupero dei dettagli ordine:", error);
    return null;
  }
}


/**
 * Aggiorna la password dell'utente dopo aver verificato quella corrente.
 * @param formData FormData contenente currentPassword, newPassword, confirmPassword.
 */
export async function updatePasswordAction(
  prevState: unknown,
  formData: FormData
) {
  const session = await auth();
  const userId = session?.user.id;

  if (!userId) {
    return { success: false, message: "Autenticazione richiesta." };
  }

  const currentPassword = formData.get("currentPassword") as string;
  const newPassword = formData.get("newPassword") as string;
  const confirmPassword = formData.get("confirmPassword") as string; // 1. Validazione di base (Dovresti usare Zod qui!)

  if (
    !currentPassword ||
    !newPassword ||
    newPassword !== confirmPassword ||
    newPassword.length < 8
  ) {
    return {
      success: false,
      message: "Errore di validazione. Controlla tutti i campi.",
    };
  }

  try {
    // 2. Recupera l'utente dal DB per ottenere l'hash della password corrente
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { password: true },
    }); // 3. Verifica la password corrente

    if (!user?.password) {
      // Questo caso non dovrebbe accadere se l'utente è loggato con credentials
      // Ma è cruciale se l'utente ha loggato con Google e non ha una password.
      return {
        success: false,
        message:
          "Non è possibile cambiare la password per gli account di terze parti.",
      };
    }

    const isCurrentPasswordValid = await compare(
      currentPassword,
      user.password
    );

    if (!isCurrentPasswordValid) {
      return {
        success: false,
        message: "La password corrente non è corretta.",
      };
    } // 4. Hash e Aggiornamento della nuova password

    const hashedPassword = hashSync(newPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    }); // 5. Successo
    // NOTA: Non serve aggiornare la sessione (signIn update) qui,
    // perché la sessione non tiene traccia dell'hash della password.

    return {
      success: true,
      message: "La password è stata aggiornata con successo!",
    };
  } catch (error) {
    console.error("Errore durante il cambio password:", error);
    return {
      success: false,
      message: "Si è verificato un errore sconosciuto. Riprova.",
    };
  }
}
/**
 * Recupera un riepilogo di tutti gli ordini per l'utente autenticato.
 */
export async function getMyOrdersSummaryAction() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    // Non lanciamo un errore ma restituiamo un array vuoto
    return [];
  }

  try {
    const orders = await prisma.order.findMany({
      where: { userId: userId },
      orderBy: { createdAt: "desc" }, // Ordina dal più recente
      select: {
        orderNumber: true,
        createdAt: true,
        totalPrice: true,
        status: true, // Includiamo solo l'ID del primo articolo per mostrare l'immagine in anteprima
        OrderItem: {
          take: 1,
          select: { image: true },
        },
      },
    }); // 1. Conversione in array JavaScript per l'uso lato client.
    // 2. Assicuriamo che totalPrice sia un numero (se Prisma lo restituisce come Decimal).

    const sanitizedOrders = orders.map((order: { orderNumber: any; createdAt: any; totalPrice: any; status: any; OrderItem: { image: any; }[]; }) => ({
      orderNumber: order.orderNumber,
      createdAt: order.createdAt,
      totalPrice: Number(order.totalPrice), // ⭐ Conversione in Number
      status: order.status, // Recupera l'immagine del primo prodotto per l'anteprima
      mainImage: order.OrderItem[0]?.image || "/placeholder.jpg",
    }));

    return sanitizedOrders;
  } catch (error) {
    console.error("Errore nel recupero del riepilogo ordini:", error);
    return [];
  }
}

// Questo tipo assicura che 'address' sia presente.
export type FullUserProfile = Prisma.UserGetPayload<{}> & {
  // Rendiamo 'address' obbligatorio per la tipizzazione, anche se il valore può essere un oggetto vuoto
  address: Prisma.JsonValue; // Aggiungi qui anche gli altri campi richiesti dal tuo form se mancano (es. 'role')
  role: string | null;
  password: string | null;
};
/**
 * Recupera i dettagli completi dell'utente loggato dal DB, incluso l'indirizzo.
 * Questa funzione è usata dal Server Component ProfilePage.
 */
export async function getFullUser(): Promise<FullUserProfile | null> {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return null;
  }

  try {
    // Recupera tutti i campi utente
    const user = await prisma.user.findUnique({
      where: { id: userId }, // Non serve 'include' se 'address' è un campo JSON su User
    });

    if (user) {
      // ⭐ TRASFORMAZIONE E ASSERZIONE DEL TIPO:
      // Assicuriamo che l'oggetto 'address' esista. Se il valore del DB è null, usiamo un oggetto vuoto.
      const userWithAddress = {
        ...user, // Il cast a {} (oggetto vuoto) è cruciale se 'address' nel DB è null.
        address: user.address || {},
      } as FullUserProfile;

      return userWithAddress;
    }

    return null; // Utente non trovato nel DB
  } catch (error) {
    console.error("Errore nel recupero dell'utente completo:", error);
    return null;
  }
}

// Otteniamo tutti gli utenti

/**
 * Recupera tutti gli utenti con paginazione.
 * ✅ RISOLVE L'ERRORE: Restituisce dataCount e serializza i dati.
 */
export async function getAllUsers({
    limit = PAGE_SIZE,
    page,
    query,
}: {
    limit?: number;
    page: number;
    query?: string;
}) {
    try {
        // 1. Definisci le Condizioni di Filtro (WHERE Clause)
        const searchCondition = query ? {
            // Utilizziamo l'operatore OR per cercare il testo in più campi
            OR: [
                {
                    name: {
                        contains: query,
                        mode: 'insensitive' as const, // Permette la ricerca case-insensitive (richiede PostgreSQL o MySQL)
                    },
                },
                {
                    email: {
                        contains: query,
                        mode: 'insensitive' as const,
                    },
                },
                // Puoi aggiungere altri campi qui, come 'id' se pertinente
            ],
        } : {};

        // 2. Query per il Conteggio Totale (con il filtro)
        const dataCount = await prisma.user.count({
            where: searchCondition, // Applica la condizione di ricerca
        });

        // 3. Query per i Dati della Pagina Corrente (con il filtro e la paginazione)
        const rawUsers = await prisma.user.findMany({
            where: searchCondition, // Applica la condizione di ricerca
            orderBy: { createdAt: "desc" },
            skip: (page - 1) * limit,
            take: limit,
        });

        // 4. Conversione e Restituzione
        const users = rawUsers.map((user: any) => convertToPlainObject(user));

        return {
            data: users as User[],
            dataCount: dataCount,
            totalPages: Math.ceil(dataCount / limit),
        };
    } catch (error) {
        console.error("Errore in getAllUsers:", error);
        return {
            data: [] as User[],
            dataCount: 0,
            totalPages: 0,
        };
    }
}

// Placeholder per un'azione di eliminazione, utile per la tua tabella
export async function deleteUser(id: string) {
  try {
    await prisma.user.delete({ where: { id } });
    revalidatePath("/admin/users");
    return { success: true, message: "Utente eliminato con successo." };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}




// Inizializza Stripe SDK. Assumiamo che la chiave segreta sia in una variabile d'ambiente.
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
    apiVersion: '2025-11-17.clover', 
});

// * DEFINIZIONE DEI TIPI DI RISPOSTA
type PaymentStatusResponse = {
    status: 'SUCCESS' | 'FAILURE' | 'PENDING';
    message: string;
    orderNumber: string;
    paymentIntentId: string;
};



/**
 * Verifica lo stato del Payment Intent di Stripe e aggiorna il database.
 * * Utilizza lo schema Prisma fornito dall'utente.
 * @param orderNumber Il numero dell'ordine (@unique) da aggiornare.
 * @param clientSecret Il client secret passato da Stripe per recuperare l'Intent.
 * @param redirectStatus Lo stato di reindirizzamento fornito da Stripe.
 * @returns {Promise<PaymentStatusResponse>} L'oggetto contenente lo stato finale e il messaggio.
 */
export async function getPaymentIntentStatusAction(
    orderNumber: string,
    clientSecret: string,
    redirectStatus: string
): Promise<any> { // Usando 'any' temporaneamente se il type PaymentStatusResponse non è fornito
    
    // Controlli preliminari
    if (!clientSecret || !orderNumber) {
        return {
            status: 'FAILURE',
            message: 'Dati di pagamento insufficienti per la verifica.',
            orderNumber: orderNumber,
            paymentIntentId: 'N/A'
        };
    }
    
    try {
        // 1. Estrai l'ID del Payment Intent dal client secret
        const paymentIntentId = clientSecret.split('_secret_')[0];

        if (!paymentIntentId) {
            return {
                status: 'FAILURE',
                message: 'Formato del client secret non valido.',
                orderNumber: orderNumber,
                paymentIntentId: 'N/A'
            };
        }

        // 2. Recupera il Payment Intent da Stripe (Server-side)
        // Usiamo 'as any' per ignorare temporaneamente l'errore di tipizzazione sull'interfaccia Response<PaymentIntent>
        // Questo è il modo più rapido per risolvere il problema 'charges'
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId, {
            expand: ['charges'] 
        }) as any; // <-- CASTING QUI PER RISOLVERE IL PROBLEMA DELLE PROPRIETÀ

        if (!paymentIntent) {
            return {
                status: 'FAILURE',
                message: 'Payment Intent non trovato su Stripe.',
                orderNumber: orderNumber,
                paymentIntentId: paymentIntentId
            };
        }

        // 3. Verifica lo stato del pagamento e aggiorna Prisma
        switch (paymentIntent.status) {
            case 'succeeded':
                // Pagamento avvenuto con successo
                
                // --- LOGICA AGGIUNTA PER DETERMINARE IL METODO DI PAGAMENTO ---
                // Verifica di sicurezza prima di accedere ai charges
                if (!paymentIntent.charges || paymentIntent.charges.data.length === 0) {
                     return {
                        status: 'FAILURE',
                        message: 'Pagamento riuscito ma impossibile recuperare i dettagli del Charge (Dati Charge mancanti).',
                        orderNumber: orderNumber,
                        paymentIntentId: paymentIntent.id
                    };
                }
                
                const charge = paymentIntent.charges.data[0];
                const paymentType = charge?.payment_method_details?.type;
                
                // Mappa il tipo di pagamento Stripe (es. 'paypal') al tuo Enum Prisma (es. 'PAYPAL')
                // Assumi che l'Enum nel tuo schema Order sia 'PAYPAL' e 'STRIPE_CARD'
                const paymentMethod = 
                    paymentType === 'paypal' ? 'PAYPAL' : 'STRIPE_CARD'; 
                
                console.log(`✅ PI Succeeded. Metodo di pagamento rilevato: ${paymentMethod}`);

                // *** LOGICA DI AGGIORNAMENTO AGGIUSTATA PER IL TUO SCHEMA ***
                const updatedOrder = await prisma.order.update({
                    where: { orderNumber: orderNumber }, // Usa il campo unico orderNumber
                    data: { 
                        status: 'PAID', // Imposta lo stato Enum 'PAID'
                        stripePaymentIntentId: paymentIntent.id, // Salva l'ID di Stripe
                        paidAt: new Date(), // Imposta la data/ora di pagamento
                        paymentmethod: paymentMethod, // <--- AGGIORNAMENTO FONDAMENTALE PER PAYPAL
                    },
                });
                // *** FINE LOGICA DI AGGIORNAMENTO AGGIUSTATA ***

                // Se l'aggiornamento riesce:
                return {
                    status: 'SUCCESS',
                    message: `Il pagamento è stato completato con successo tramite ${paymentMethod}. L'ordine #${updatedOrder.orderNumber} è confermato!`,
                    orderNumber: updatedOrder.orderNumber,
                    paymentIntentId: paymentIntent.id
                };

            case 'processing':
                // Pagamento in corso (es. bonifico SEPA)
                // Aggiorna solo l'ID dell'intent senza marcare come PAID
                await prisma.order.update({
                    where: { orderNumber: orderNumber }, 
                    data: { 
                        stripePaymentIntentId: paymentIntent.id,
                        status: 'PENDING_PAYMENT', // Mantiene lo stato iniziale in attesa di notifica webhook
                    },
                });

                return {
                    status: 'PENDING',
                    message: "Il tuo pagamento è in fase di elaborazione. Riceverai una conferma via email a breve.",
                    orderNumber: orderNumber,
                    paymentIntentId: paymentIntent.id
                };

            case 'requires_payment_method':
            case 'requires_confirmation':
            case 'requires_action':
            case 'canceled':
                // Pagamento fallito o necessita di azione
                return {
                    status: 'FAILURE',
                    message: "Il pagamento non è riuscito o è stato annullato. Riprova dalla pagina dell'ordine.",
                    orderNumber: orderNumber,
                    paymentIntentId: paymentIntent.id
                };
            
            default:
                 return {
                    status: 'FAILURE',
                    message: `Stato di pagamento inatteso: ${paymentIntent.status}. Contatta il supporto.`,
                    orderNumber: orderNumber,
                    paymentIntentId: paymentIntent.id
                };
        }
    } catch (error) {
        // Gestione degli errori di rete o dell'API Stripe/Prisma
        console.error("ERRORE nella verifica del Payment Intent:", error);
        
        return {
            status: 'FAILURE',
            message: 'Errore di sistema nella verifica del pagamento. Controlla il log del server.',
            orderNumber: orderNumber,
            paymentIntentId: 'N/A'
        };
    }
}