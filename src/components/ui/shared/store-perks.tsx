import { Truck, RotateCcw, CreditCard, ShieldCheck, Headphones } from "lucide-react";

export const perks = [
  {
    icon: Truck,
    title: "Spedizione Rapida",
    description: "Gratuita per ordini oltre i 49€. Consegna in 24/48h.",
    color: "text-indigo-600 dark:text-indigo-400",
    bg: "bg-indigo-50 dark:bg-indigo-950/40",
  },
  {
    icon: RotateCcw,
    title: "Reso Facile 30 Giorni",
    description: "Hai 30 giorni per cambiare idea senza stress.",
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
  },
  {
    icon: CreditCard,
    title: "Paga in 3 Rate",
    description: "Con Klarna & PayPal a tasso zero, senza interessi.",
    color: "text-pink-600 dark:text-pink-400",
    bg: "bg-pink-50 dark:bg-pink-950/40",
  },
  {
    icon: ShieldCheck,
    title: "Pagamenti 100% Sicuri",
    description: "Transazioni protette con crittografia SSL 256-bit.",
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/40",
  },
  {
    icon: Headphones,
    title: "Assistenza 7 Giorni su 7",
    description: "Supporto clienti via chat ed email sempre al tuo fianco.",
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/40",
  },
];

const StorePerks = ({ className = "" }: { className?: string }) => {
  return (
    <section className={`py-6 my-8 ${className}`}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {perks.map((perk, idx) => {
          const Icon = perk.icon;
          return (
            <div
              key={idx}
              className="flex items-start gap-3.5 p-4 rounded-2xl border border-border/60 bg-card/60 hover:bg-card hover:border-indigo-200 dark:hover:border-indigo-800/60 shadow-xs hover:shadow-md transition-all duration-300 group"
            >
              <div
                className={`p-2.5 rounded-xl ${perk.bg} ${perk.color} flex-shrink-0 group-hover:scale-110 transition-transform duration-300 shadow-xs`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h4 className="font-semibold text-sm text-foreground tracking-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {perk.title}
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  {perk.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default StorePerks;
