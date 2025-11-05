import * as React from "react"

import { cn } from "@/lib/utils"

// Definisci le props qui in modo che React le riconosca correttamente
const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, value, ...props }, ref) => { // <-- DESTRUTTURIAMO 'value'

const finalValue = (value !== undefined &&(value === null || value === "")) ? "" : value ;

    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        ref={ref}
        value={finalValue} // 1. Correzione: garantisce valore non nullo/undef
        {...props}       // 2. Correzione: Applica tutte le altre props (incluso onChange)
      />
    )
  }
)
Input.displayName = "Input"

export { Input }