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
import { z } from "zod";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";

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

// --- DEFINIZIONE TIPI PER IL PROFILO ---
interface UserProfileUpdatePayload
  extends z.infer<typeof shippingAddressSchema> {}

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
        password: hashedPassword,
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
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
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
// 💡 FUNZIONE: AGGIORNAMENTO PROFILO
// ----------------------------------------------------------------------

/**
 * Aggiorna i dettagli di spedizione e profilo dell'utente autenticato, salvando il JSON 'address'.
 */
export async function updateUserProfile(
  data: UserProfileUpdatePayload
): Promise<ActionResponse> {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return { success: false, message: "Non autorizzato. Utente non loggato." };
  }

  const validationResult = shippingAddressSchema.safeParse(data);

  if (!validationResult.success) {
    const errorMsg = validationResult.error.issues
      .map((issue) => `${String(issue.path[0])}: ${issue.message}`)
      .join("; ");
    return { success: false, message: `Errore di validazione: ${errorMsg}` };
  }
  const validatedData = validationResult.data;
  const newFullName = `${validatedData.firstName} ${validatedData.lastName}`;

  try {
    // 1. Aggiornamento nel database
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name: newFullName, // Aggiorniamo il nome
        address: validatedData as Prisma.InputJsonValue, // Aggiorniamo l'indirizzo
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true, // Assumendo che role sia nel modello
      },
    });

    // ⭐ 2. AGGIORNAMENTO DELLA SESSIONE DI NEXTAUTH
    // Questo forza il frontend a rigenerare la sessione con i nuovi dati (es. il nuovo nome).
    await signIn("credentials", {
      redirect: false,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role, // Passa i campi necessari per l'ExtendedUser
      },
      update: true, // Indica a NextAuth di aggiornare la sessione corrente
    } as any);

    // 3. Invalida la cache
    revalidatePath("/dashboard/profile");

    return {
      success: true,
      message: "Profilo e dettagli di spedizione aggiornati con successo!",
    };
  } catch (error) {
    console.error("Errore nell'aggiornamento del profilo:", error);
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
      OrderItem: order.OrderItem.map((item) => ({
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

// ----------------------------------------------------------------------
// 💡 FUNZIONE CORRETTA: Creazione dell'Ordine Finale (Place Order)
// ----------------------------------------------------------------------

export async function createOrderAction() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    throw new Error("Autenticazione richiesta per completare l'ordine.");
  }

  try {
    // 1 & 2. Recupero dati Utente e Carrello
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, address: true, paymentMethod: true },
    });
    if (!user) throw new Error("Utente non trovato.");

    const cart = await prisma.cart.findFirst({
      where: { userId: userId },
      select: {
        id: true,
        items: true,
        itemsPrice: true,
        shippingPrice: true,
        taxPrice: true,
        totalPrice: true,
      },
    });
    if (!cart || (cart.items as BackendCartItem[]).length === 0)
      throw new Error("Carrello vuoto.");

    const { address, paymentMethod } = user;

    const currentCartItems = cart.items as BackendCartItem[];

    // Subito dopo la riga
    // const currentCartItems = cart.items as BackendCartItem[];
    console.log(
      "DEBUG: Struttura Reale Primo Articolo:",
      JSON.stringify(currentCartItems[0], null, 2)
    );

    if (!address) redirect("/checkout?step=shipping");
    if (!paymentMethod) redirect("/checkout?step=payment");

    const isCOD = paymentMethod === "Contrassegno";
    const initialStatus: OrderStatus = isCOD ? "PENDING_PAYMENT" : "PAID";
    const paidAtDate = isCOD ? null : new Date(); // 3. Esegui la Transazione

    const createdOrder = await prisma.$transaction(async (tx) => {
      // 3.1. Crea il record dell'Ordine principale
      const tempOrder = await tx.order.create({
        data: {
          userId: userId,
          shippingAddress: address as Prisma.InputJsonValue,
          paymentmethod: paymentMethod,
          itemsPrice: cart.itemsPrice,
          shippingPrice: cart.shippingPrice,
          taxPrice: cart.taxPrice,
          totalPrice: cart.totalPrice,
          status: initialStatus,
          paidAt: paidAtDate,
          orderNumber: "TEMP",
        },
      }); // 3.1.5. Aggiorna orderNumber

      const finalOrderNumber = `ORD-${tempOrder.id.substring(0, 8).toUpperCase()}`;
      const updatedOrder = await tx.order.update({
        where: { id: tempOrder.id },
        data: { orderNumber: finalOrderNumber },
      }); // 3.2. Crea gli OrderItems
      const orderItemsData = currentCartItems
        .filter((item) => {
          const productIdentifier = item.productId || (item as any).id;
          return productIdentifier && item.qty > 0;
        })
        .map((item) => ({
          orderId: updatedOrder.id,
          productId: item.productId || (item as any).id,
          name: item.name,
          qty: item.qty,
          image: item.image,
          price: item.price,
          slug: item.slug,
        }));

      console.log("[DEBUG ITEMS] Dati OrderItem da inviare:", orderItemsData);

      if (orderItemsData.length > 0) {
        await tx.orderItem.createMany({
          data: orderItemsData,
        });
      } else {
        throw new Error(
          "Impossibile creare articoli ordine, dati mancanti o non validi."
        );
      } // 3.3. Aggiornamento Stock
      const validItemsToUpdate = currentCartItems.filter(
        (item) => item.productId && item.qty > 0
      );
      for (const item of validItemsToUpdate) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.qty } },
        });
      } // 3.4. Cancella il Carrello
      await tx.cart.delete({
        where: { id: cart.id },
      });

      return updatedOrder;
    }); // 4. Reindirizzamento

    const redirectUrl = `/dashboard/orders/${createdOrder.orderNumber}`;
    redirect(redirectUrl);
  } catch (error) {
    // ✅ CORREZIONE: Controllo sul digest
    if (isNextRedirectError(error)) {
      throw error;
    }
    console.error("Errore irreversibile nella creazione dell'ordine:", error);
    throw new Error("Impossibile completare l'ordine. Riprova più tardi.");
  }
}

const passwordUpdateSchema = z
  .object({
    currentPassword: z.string().min(8, "La password corrente è richiesta."),
    newPassword: z
      .string()
      .min(8, "La nuova password deve essere lunga almeno 8 caratteri."),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Le nuove password non corrispondono.",
    path: ["confirmPassword"],
  });

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
  const confirmPassword = formData.get("confirmPassword") as string;

  // 1. Validazione di base (Dovresti usare Zod qui!)
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
    });

    // 3. Verifica la password corrente
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
    }

    // 4. Hash e Aggiornamento della nuova password
    const hashedPassword = hashSync(newPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    // 5. Successo
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
            orderBy: { createdAt: 'desc' }, // Ordina dal più recente
            select: {
                orderNumber: true,
                createdAt: true,
                totalPrice: true,
                status: true,
                // Includiamo solo l'ID del primo articolo per mostrare l'immagine in anteprima
                OrderItem: {
                    take: 1, 
                    select: { image: true }
                }
            },
        });

        // 1. Conversione in array JavaScript per l'uso lato client.
        // 2. Assicuriamo che totalPrice sia un numero (se Prisma lo restituisce come Decimal).
        const sanitizedOrders = orders.map(order => ({
            orderNumber: order.orderNumber,
            createdAt: order.createdAt,
            totalPrice: Number(order.totalPrice), // ⭐ Conversione in Number
            status: order.status,
            // Recupera l'immagine del primo prodotto per l'anteprima
            mainImage: order.OrderItem[0]?.image || '/placeholder.jpg' 
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
    address: Prisma.JsonValue; 
    // Aggiungi qui anche gli altri campi richiesti dal tuo form se mancano (es. 'role')
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
            where: { id: userId },
            // Non serve 'include' se 'address' è un campo JSON su User
        });
        
        if (user) {
            // ⭐ TRASFORMAZIONE E ASSERZIONE DEL TIPO:
            // Assicuriamo che l'oggetto 'address' esista. Se il valore del DB è null, usiamo un oggetto vuoto.
            const userWithAddress = {
                ...user,
                // Il cast a {} (oggetto vuoto) è cruciale se 'address' nel DB è null.
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