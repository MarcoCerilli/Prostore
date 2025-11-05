"use client";

import { cn } from "@/lib/utils";
import { LogIn, MapPin, CreditCard, CheckSquare } from "lucide-react";

// Definizione dei passi del checkout
const steps = [
  {
    id: 1,
    name: "Login Utente",
    href: "/login",
    icon: LogIn,
    paths: ["/login", "/signin", "/signup"],
  },
  {
    id: 2,
    name: "Indirizzo Spedizione",
    href: "/checkout?step=shipping",
    icon: MapPin,
    paths: ["/checkout"],
  },
  {
    id: 3,
    name: "Metodo di Pagamento",
    href: "/checkout?step=payment",
    icon: CreditCard,
    paths: ["/checkout"],
  },
  {
    id: 4,
    name: "Conferma Ordine",
    href: "/checkout?step=review",
    icon: CheckSquare,
    paths: ["/confirmation"],
  },
];

interface CheckoutStepperProps {
  /** Il passo attuale del checkout (1, 2, 3, 4) */
  currentStep: number;
}

/**
 * Indicatore visivo dei passi (Stepper) per il processo di checkout.
 * Logica aggiornata per garantire l'allineamento perfetto di pallini e linee.
 */
export function CheckoutStepper({ currentStep }: CheckoutStepperProps) {
  return (
    <nav aria-label="Passi di Checkout" className="mb-8 pt-4">
      {/* Lista dei passi: contenitore flex per distribuire equamente lo spazio */}
      <ol role="list" className="flex justify-between items-start">
        {steps.map((step, index) => {
          const isCompleted = step.id < currentStep;
          const isActive = step.id === currentStep;
          // const isFuture = step.id > currentStep;

          return (
            <li
              key={step.name}
              className={cn("flex-1", {
                // L'ultimo elemento non ha bisogno di extra spaziatura a destra
                "min-w-0": index === steps.length - 1,
              })}
            >
              <div className="flex flex-col items-center relative">
                {/* 1. Linea di Connessione (Visibile solo se non è l'ultimo passo) */}
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      "absolute h-0.5 transition-colors duration-300 top-4 z-0",
                      "w-[calc(100%-8px)]", // Larghezza che copre quasi tutto lo spazio (meno 8px di padding per i lati)
                      "left-[calc(50%+16px)]", // Inizia al centro del pallino (50%) + metà della larghezza del pallino (16px)
                      {
                        "bg-indigo-600": isCompleted, // Linea blu solo se il passo *precedente* è completato
                        "bg-gray-300": !isCompleted,
                      }
                    )}
                    // Regolazione fine (se necessario, ma le classi dovrebbero bastare)
                    // style={{ width: 'calc(100% - 32px)', transform: 'translateX(16px)' }}
                  />
                )}

                {/* 2. Cerchio del Passo (Sempre al centro del contenitore flex) */}
                <div
                  className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors duration-300 z-10",
                    {
                      "border-indigo-600 bg-indigo-600 text-white": isCompleted, // Completato
                      "border-indigo-600 bg-white": isActive, // Attivo
                      "border-gray-300 bg-white": !isCompleted && !isActive, // Futuro
                    }
                  )}
                >
                  {/* Icona (se completato) o Numero (se attivo/futuro) */}
                  {isCompleted ? (
                    <CheckSquare className="w-4 h-4" />
                  ) : (
                    <span
                      className={cn("text-sm font-bold", {
                        "text-indigo-600": isActive,
                        "text-gray-500": !isCompleted && !isActive,
                      })}
                    >
                      {step.id}
                    </span>
                  )}
                </div>

                {/* 3. Etichetta del Passo */}
                <p
                  className={cn(
                    "mt-2 text-xs md:text-sm text-center transition-colors duration-300 w-full whitespace-nowrap",
                    {
                      "text-indigo-600 font-semibold": isActive,
                      "text-gray-900": isCompleted,
                      "text-gray-500": !isCompleted && !isActive,
                    }
                  )}
                >
                  {step.name}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
