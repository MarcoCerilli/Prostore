import { ShieldCheck } from "lucide-react";

// ==========================================
// 🌟 LOGHI VETTORIALI DEI CIRCUITI DI PAGAMENTO
// ==========================================

export const PayPalLogo = ({ className = "h-4 sm:h-5 w-auto" }: { className?: string }) => (
  <svg viewBox="0 0 74 20" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Double P monogram */}
    <path
      d="M5.5 1.5h4.6c2.4 0 4.1.5 5 1.7.7 1 .6 2.4-.2 3.8-.9 1.8-2.6 2.8-4.9 2.8H7.9L6.9 16.5H4.2L6.5 2.5H5.5z"
      fill="#003087"
    />
    <path
      d="M9.8 4.2h4.4c2.2 0 3.8.5 4.6 1.6.7 1 .6 2.3-.2 3.7-.9 1.8-2.5 2.8-4.7 2.8h-1.8l-1 5.4H8.8l1-6.8 1.1-6.7z"
      fill="#0079C1"
    />
    <path
      d="M8.5 7.5l-1 6.8H5l2.3-14h4.6c1.3 0 2.4.2 3.2.6-.7 2.3-2.4 7.6-7.6 7.6h1-1z"
      fill="#00457C"
    />
    <text
      x="22"
      y="15"
      fill="#003087"
      fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
      fontWeight="800"
      fontSize="14"
      letterSpacing="-0.3px"
    >
      Pay
    </text>
    <text
      x="47"
      y="15"
      fill="#0079C1"
      fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
      fontWeight="800"
      fontSize="14"
      letterSpacing="-0.3px"
    >
      Pal
    </text>
  </svg>
);

export const KlarnaLogo = ({ className = "h-4 sm:h-5 w-auto" }: { className?: string }) => (
  <svg viewBox="0 0 62 20" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="62" height="20" rx="4" fill="#FFB3C7" />
    <text
      x="6"
      y="14.5"
      fill="#0A0A0A"
      fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
      fontWeight="900"
      fontSize="13"
      letterSpacing="-0.4px"
    >
      Klarna.
    </text>
  </svg>
);

export const StripeLogo = ({ className = "h-4 sm:h-5 w-auto" }: { className?: string }) => (
  <svg viewBox="0 0 54 20" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <text
      x="2"
      y="15"
      fill="#635BFF"
      fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
      fontWeight="800"
      fontSize="15"
      letterSpacing="-0.5px"
    >
      stripe
    </text>
  </svg>
);

export const VisaLogo = ({ className = "h-3.5 sm:h-4 w-auto" }: { className?: string }) => (
  <svg viewBox="0 0 46 16" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <text
      x="1"
      y="13.5"
      fill="#1A1F71"
      fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
      fontWeight="900"
      fontStyle="italic"
      fontSize="15"
      letterSpacing="1px"
    >
      VISA
    </text>
  </svg>
);

export const MastercardLogo = ({ className = "h-4 sm:h-5 w-auto" }: { className?: string }) => (
  <svg viewBox="0 0 34 20" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="11.5" cy="10" r="7.5" fill="#EB001B" />
    <circle cx="22.5" cy="10" r="7.5" fill="#F79E1B" fillOpacity="0.95" />
    <path
      fill="#FF5F00"
      d="M17 4.8a7.48 7.48 0 00-2.8 5.2 7.48 7.48 0 002.8 5.2 7.48 7.48 0 002.8-5.2A7.48 7.48 0 0017 4.8z"
    />
  </svg>
);

export const ApplePayLogo = ({ className = "h-4 sm:h-5 w-auto" }: { className?: string }) => (
  <svg viewBox="0 0 48 20" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="48" height="20" rx="4" fill="#000000" />
    {/* Apple Logo */}
    <path
      fill="#FFFFFF"
      d="M15.4 9.2c-.1-1.1.5-2 1.2-2.5-.6-.9-1.6-1-1.9-1-.8-.1-1.7.5-2.1.5-.4 0-1.2-.5-1.9-.5-1 0-1.9.6-2.4 1.5-1.1 1.8-.3 4.4.7 5.9.5.7 1.1 1.3 1.8 1.3.7 0 1-.4 1.8-.4.8 0 1 .4 1.8.4.8 0 1.2-.6 1.7-1.4.6-.9.8-1.7.8-1.8-.1 0-1.4-.5-1.4-1.9zm-1.4-3.9c.4-.5.6-1.1.5-1.7-.6 0-1.4.4-1.7.8-.3.4-.6 1-.5 1.7.7.1 1.4-.3 1.7-.8z"
    />
    <text
      x="20.5"
      y="13.5"
      fill="#FFFFFF"
      fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
      fontWeight="600"
      fontSize="11"
    >
      Pay
    </text>
  </svg>
);

export const GooglePayLogo = ({ className = "h-4 sm:h-5 w-auto" }: { className?: string }) => (
  <svg viewBox="0 0 50 20" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="50" height="20" rx="4" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1" />
    {/* Google multi-colored G */}
    <g transform="translate(6, 4)">
      <path
        d="M6 5v2.3h3.3C9 8.6 7.7 9.5 6 9.5c-2 0-3.6-1.6-3.6-3.6S4 2.3 6 2.3c1 0 1.9.4 2.5 1l1.7-1.7C9.2.6 7.7 0 6 0 2.7 0 0 2.7 0 6s2.7 6 6 6c3.4 0 5.8-2.4 5.8-5.9 0-.4 0-.8-.1-1.1H6z"
        fill="#4285F4"
      />
    </g>
    <text
      x="20"
      y="14"
      fill="#5F6368"
      fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
      fontWeight="bold"
      fontSize="11"
      letterSpacing="-0.2px"
    >
      Pay
    </text>
  </svg>
);

export const PostePayLogo = ({ className = "h-4 sm:h-5 w-auto" }: { className?: string }) => (
  <svg viewBox="0 0 56 20" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="56" height="20" rx="4" fill="#FFE500" />
    <text
      x="4"
      y="14"
      fill="#003399"
      fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
      fontWeight="900"
      fontSize="11"
      letterSpacing="-0.3px"
    >
      poste
    </text>
    <text
      x="31"
      y="14"
      fill="#003399"
      fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
      fontWeight="600"
      fontSize="11"
      letterSpacing="-0.3px"
    >
      pay
    </text>
  </svg>
);

export const AmexLogo = ({ className = "h-4 sm:h-5 w-auto" }: { className?: string }) => (
  <svg viewBox="0 0 42 20" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="42" height="20" rx="4" fill="#006FCF" />
    <text
      x="4"
      y="13.5"
      fill="#FFFFFF"
      fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
      fontWeight="900"
      fontSize="9.5"
      letterSpacing="0.8px"
    >
      AMEX
    </text>
  </svg>
);

// ==========================================
// 🌟 COMPONENTE LISTA BADGE DI PAGAMENTO
// ==========================================

export const PaymentBadgesList = ({
  className = "",
  badgeClassName = "h-8 sm:h-9 px-2.5 sm:px-3 bg-white dark:bg-zinc-900 border border-border/80 dark:border-zinc-800 rounded-xl shadow-xs flex items-center justify-center transition-all duration-200 hover:shadow-sm hover:scale-105 hover:border-indigo-300 dark:hover:border-indigo-700/60",
}: {
  className?: string;
  badgeClassName?: string;
}) => {
  return (
    <div className={`flex flex-wrap items-center gap-2 sm:gap-2.5 ${className}`}>
      <div className={badgeClassName} title="PayPal">
        <PayPalLogo />
      </div>
      <div className={badgeClassName} title="Klarna (3 rate a tasso zero)">
        <KlarnaLogo />
      </div>
      <div className={badgeClassName} title="Stripe Secure Payments">
        <StripeLogo />
      </div>
      <div className={badgeClassName} title="Visa">
        <VisaLogo />
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
      <div className={badgeClassName} title="PostePay">
        <PostePayLogo />
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
            <KlarnaLogo className="h-4 w-auto" />
          </div>
          <span className="text-muted-foreground text-xs font-medium">oppure</span>
          <div className="px-1.5 py-0.5 rounded-md bg-white dark:bg-zinc-900 border border-border/60 shadow-2xs">
            <PayPalLogo className="h-4 w-auto" />
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
        <span>Nessuna spesa di gestione né costi aggiuntivi. Seleziona Klarna o PayPal al checkout.</span>
      </div>
    </div>
  );
};
