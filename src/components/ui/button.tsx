import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils"; // Assicurati che 'cn' sia la tua utility per Tailwind

const buttonVariants = cva(
  // ⚙️ CLASSI BASE: Stile moderno, arrotondamento e focus
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ring-offset-background",
  {
    variants: {
      variant: {
        // 🥇 DEFAULT: Indigo (Colore Primario per Azioni Principali)
        default:
          "bg-indigo-600 text-white shadow-lg rounded-lg hover:bg-indigo-700 focus-visible:ring-indigo-500",

        // ✅ SUCCESS: Verde (Conferma, Aggiungi al Carrello)
        success:
          "bg-green-600 text-white shadow-lg rounded-lg hover:bg-green-700 focus-visible:ring-green-500",

        // ❌ DESTRUCTIVE: Rosso (Elimina, Rimuovi)
        destructive:
          "bg-red-600 text-white shadow-lg rounded-lg hover:bg-red-700 focus-visible:ring-red-500",

        // 📄 OUTLINE: Secondario (Torna Indietro, Modifica)
        outline:
          "border border-gray-300 bg-white text-gray-700 shadow-sm rounded-lg hover:bg-gray-100 focus-visible:ring-gray-400",

        // 👻 GHOST: Terziario, senza sfondo (Menu, Dettagli)
        ghost:
          "hover:bg-gray-100 text-gray-700 rounded-lg focus-visible:ring-gray-400",

        // 🔗 LINK: Link stilizzato
        link: "text-indigo-600 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-5 py-2", // Standard
        sm: "h-8 px-3 text-xs", // Piccolo
        lg: "h-12 px-8 text-base", // Grande (CTA)
        icon: "h-10 w-10", // Icona (Quadrato)
      },
      // Arrotondamento aggiuntivo (opzionale)
      rounded: {
        none: "rounded-none",
        md: "rounded-md",
        lg: "rounded-lg",
        full: "rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      rounded: "lg", // Imposta l'arrotondamento grande come predefinito per tutto
    },
    compoundVariants: [
      // Forza l'arrotondamento completo per i bottoni icona, a meno che non sia specificato diversamente
      {
        size: "icon",
        rounded: "lg", // Impedisce che l'icona erediti "lg"
        className: "rounded-full",
      },
      {
        size: "icon",
        rounded: undefined, // Se rounded non è specificato e size è icona
        className: "rounded-full",
      },
    ],
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, rounded, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, rounded, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
