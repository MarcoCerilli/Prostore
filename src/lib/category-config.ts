import React from "react";
import { TbJacket } from "react-icons/tb";
import {
  PiHoodieBold,
  PiTShirtBold,
  PiPantsBold,
  PiSneakerBold,
  PiShirtFoldedBold,
  PiWatchBold,
  PiSunglassesBold,
  PiFlameBold,
  PiSparkleBold,
} from "react-icons/pi";

export interface CategoryMeta {
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgLight: string;
  bgDark: string;
  gradient: string;
  description: string;
}

const CATEGORY_MAP: Record<string, CategoryMeta> = {
  felpe: {
    icon: PiHoodieBold,
    color: "text-violet-600 dark:text-violet-400",
    bgLight: "bg-violet-50 hover:bg-violet-100",
    bgDark: "dark:bg-violet-950/40 dark:hover:bg-violet-900/40",
    gradient: "from-violet-500/20 to-purple-500/20",
    description: "Comfort, stile e calore per ogni occasione",
  },
  capispalla: {
    icon: TbJacket,
    color: "text-amber-600 dark:text-amber-400",
    bgLight: "bg-amber-50 hover:bg-amber-100",
    bgDark: "dark:bg-amber-950/40 dark:hover:bg-amber-900/40",
    gradient: "from-amber-500/20 to-orange-500/20",
    description: "Giacche e cappotti di alta qualità",
  },
  "abbigliamento-sportivo": {
    icon: PiFlameBold,
    color: "text-emerald-600 dark:text-emerald-400",
    bgLight: "bg-emerald-50 hover:bg-emerald-100",
    bgDark: "dark:bg-emerald-950/40 dark:hover:bg-emerald-900/40",
    gradient: "from-emerald-500/20 to-teal-500/20",
    description: "Performance e libertà di movimento",
  },
  "t-shirt": {
    icon: PiTShirtBold,
    color: "text-blue-600 dark:text-blue-400",
    bgLight: "bg-blue-50 hover:bg-blue-100",
    bgDark: "dark:bg-blue-950/40 dark:hover:bg-blue-900/40",
    gradient: "from-blue-500/20 to-cyan-500/20",
    description: "I capi essenziali per il tuo guardaroba",
  },
  jeans: {
    icon: PiPantsBold,
    color: "text-indigo-600 dark:text-indigo-400",
    bgLight: "bg-indigo-50 hover:bg-indigo-100",
    bgDark: "dark:bg-indigo-950/40 dark:hover:bg-indigo-900/40",
    gradient: "from-indigo-500/20 to-blue-500/20",
    description: "Denim resistente, vestibilità moderna",
  },
  camicie: {
    icon: PiShirtFoldedBold,
    color: "text-rose-600 dark:text-rose-400",
    bgLight: "bg-rose-50 hover:bg-rose-100",
    bgDark: "dark:bg-rose-950/40 dark:hover:bg-rose-900/40",
    gradient: "from-rose-500/20 to-pink-500/20",
    description: "Eleganza formale e casual raffinato",
  },
  scarpe: {
    icon: PiSneakerBold,
    color: "text-cyan-600 dark:text-cyan-400",
    bgLight: "bg-cyan-50 hover:bg-cyan-100",
    bgDark: "dark:bg-cyan-950/40 dark:hover:bg-cyan-900/40",
    gradient: "from-cyan-500/20 to-sky-500/20",
    description: "Sneakers e calzature per ogni passo",
  },
  accessori: {
    icon: PiWatchBold,
    color: "text-teal-600 dark:text-teal-400",
    bgLight: "bg-teal-50 hover:bg-teal-100",
    bgDark: "dark:bg-teal-950/40 dark:hover:bg-teal-900/40",
    gradient: "from-teal-500/20 to-emerald-500/20",
    description: "I dettagli che completano il tuo stile",
  },
  occhiali: {
    icon: PiSunglassesBold,
    color: "text-fuchsia-600 dark:text-fuchsia-400",
    bgLight: "bg-fuchsia-50 hover:bg-fuchsia-100",
    bgDark: "dark:bg-fuchsia-950/40 dark:hover:bg-fuchsia-900/40",
    gradient: "from-fuchsia-500/20 to-pink-500/20",
    description: "Design iconico e protezione quotidiana",
  },
};

const DEFAULT_META: CategoryMeta = {
  icon: PiSparkleBold,
  color: "text-indigo-600 dark:text-indigo-400",
  bgLight: "bg-indigo-50 hover:bg-indigo-100",
  bgDark: "dark:bg-indigo-950/40 dark:hover:bg-indigo-900/40",
  gradient: "from-indigo-500/20 to-violet-500/20",
  description: "Scopri tutti i prodotti della selezione",
};

/**
 * Ottiene i metadati visivi (icona, colori, descrizione) per una determinata categoria
 */
export function getCategoryMeta(slugOrName: string): CategoryMeta {
  const normalized = (slugOrName || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const found = CATEGORY_MAP[normalized];
  if (found) {
    return found;
  }

  // Fallback con corrispondenze parziali
  for (const [key, value] of Object.entries(CATEGORY_MAP)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return value;
    }
  }

  return DEFAULT_META;
}
