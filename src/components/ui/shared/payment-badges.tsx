import React from "react";
import {
  SiPaypal,
  SiKlarna,
  SiStripe,
  SiVisa,
  SiMastercard,
  SiApplepay,
  SiGooglepay,
  SiAmericanexpress,
} from "react-icons/si";
import { ShieldCheck } from "lucide-react";

// ==========================================
// 🌟 LOGHI UFFICIALI REACT-ICONS (Simple Icons)
// ==========================================

export const PayPalLogo = ({ className = "h-5 w-auto text-[#003087] dark:text-[#0079C1]" }: { className?: string }) => (
  <div className="flex items-center gap-1">
    <SiPaypal className={className} />
    <span className="font-extrabold text-sm tracking-tight text-[#003087] dark:text-[#0079C1]">PayPal</span>
  </div>
);

export const KlarnaLogo = ({ className = "h-4 w-auto" }: { className?: string }) => (
  <div className="flex items-center px-2 py-0.5 rounded bg-[#FFB3C7] text-black">
    <SiKlarna className={className} />
    <span className="font-black text-xs ml-1 tracking-tight">Klarna.</span>
  </div>
);

export const StripeLogo = ({ className = "h-5 w-auto text-[#635BFF]" }: { className?: string }) => (
  <div className="flex items-center gap-1">
    <SiStripe className={className} />
    <span className="font-bold text-sm tracking-tight text-[#635BFF]">stripe</span>
  </div>
);

export const VisaLogo = ({ className = "h-4 w-auto text-[#1A1F71] dark:text-blue-400" }: { className?: string }) => (
  <div className="flex items-center">
    <SiVisa className={className} />
  </div>
);

export const MastercardLogo = ({ className = "h-5 w-auto text-[#EB001B]" }: { className?: string }) => (
  <div className="flex items-center">
    <SiMastercard className={className} />
  </div>
);

export const ApplePayLogo = ({ className = "h-5 w-auto text-black dark:text-white" }: { className?: string }) => (
  <div className="flex items-center">
    <SiApplepay className={className} />
  </div>
);

export const GooglePayLogo = ({ className = "h-5 w-auto text-zinc-700 dark:text-zinc-200" }: { className?: string }) => (
  <div className="flex items-center">
    <SiGooglepay className={className} />
  </div>
);

export const AmexLogo = ({ className = "h-5 w-auto text-[#006FCF]" }: { className?: string }) => (
  <div className="flex items-center">
    <SiAmericanexpress className={className} />
  </div>
);

// ==========================================
// 🌟 COMPONENTE LISTA BADGE DI PAGAMENTO
// ==========================================

export const PaymentBadgesList = ({
  className = "",
  badgeClassName = "h-9 px-3 bg-white dark:bg-zinc-900 border border-border/80 dark:border-zinc-800 rounded-xl shadow-xs flex items-center justify-center transition-all duration-200 hover:shadow-sm hover:scale-105 hover:border-indigo-300 dark:hover:border-indigo-700/60",
}: {
  className?: string;
  badgeClassName?: string;
}) => {
  return (
    <div className={`flex flex-wrap items-center gap-2 sm:gap-2.5 ${className}`}>
      <div className={badgeClassName} title="PayPal">
        <PayPalLogo />
      </div>
      <div className={badgeClassName} title="Klarna (3 rate senza interessi)">
        <KlarnaLogo />
      </div>
      <div className={badgeClassName} title="Stripe Secure Payments">
        <StripeLogo />
      </div>
      <div className={badgeClassName} title="Visa">
        <VisaLogo className="h-4 w-auto" />
      </div>
      <div className={badgeClassName} title="Mastercard">
        <MastercardLogo />
      </div>
      <div className={badgeClassName} title="Apple Pay">
        <ApplePayLogo />
      </div>
      <div className={badgeClassName} title="Google Pay">
        <GooglePayLogo />
      </div>
      <div className={badgeClassName} title="American Express">
        <AmexLogo />
      </div>
    </div>
  );
};

// ==========================================
// 🌟 BANNER RATEIZZAZIONE KLARNA / PAYPAL
// ==========================================

export const InstallmentBanner = ({ price }: { price: number }) => {
  const installment = (price / 3).toFixed(2);

  return (
    <div className="p-4 rounded-2xl bg-gradient-to-r from-pink-500/10 via-purple-500/5 to-indigo-500/10 border border-pink-200/80 dark:border-pink-900/40 text-xs sm:text-sm space-y-2.5 shadow-xs transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-pink-500"></span>
          </span>
          <span className="font-semibold text-foreground text-sm">
            Paga in 3 rate da{" "}
            <span className="text-pink-600 dark:text-pink-400 font-extrabold text-base">
              €{installment}
            </span>{" "}
            senza interessi
          </span>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="px-1.5 py-0.5 rounded-md bg-white dark:bg-zinc-900 border border-border/60 shadow-2xs">
            <KlarnaLogo className="h-3.5 w-auto" />
          </div>
          <span className="text-muted-foreground text-xs font-medium">o</span>
          <div className="px-1.5 py-0.5 rounded-md bg-white dark:bg-zinc-900 border border-border/60 shadow-2xs">
            <PayPalLogo className="h-3.5 w-auto" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 pt-1 border-t border-pink-200/40 dark:border-pink-900/30 text-[11px] text-muted-foreground">
        <div className="flex flex-col">
          <span className="font-semibold text-foreground">1ª rata oggi</span>
          <span>€{installment}</span>
        </div>
        <div className="flex flex-col border-l border-border/40 pl-2">
          <span className="font-semibold text-foreground">2ª rata (30gg)</span>
          <span>€{installment}</span>
        </div>
        <div className="flex flex-col border-l border-border/40 pl-2">
          <span className="font-semibold text-foreground">3ª rata (60gg)</span>
          <span>€{installment}</span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/90 pt-0.5">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
        <span>Nessun costo aggiuntivo. Seleziona Klarna o PayPal al checkout.</span>
      </div>
    </div>
  );
};
