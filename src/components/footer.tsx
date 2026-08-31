"use client";

import { APP_NAME, APP_DESCRIPTION } from "@/lib/constants";
import Link from "next/link";
import Image from "next/image";
import { PaymentBadgesList } from "@/components/ui/shared/payment-badges";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, ShieldCheck, Sparkles, ArrowRight } from "lucide-react";
import { SiInstagram, SiFacebook, SiX, SiYoutube, SiTiktok } from "react-icons/si";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    collezioni: [
      { name: "Nuovi Arrivi", href: "/search?sort=newest" },
      { name: "Camicie", href: "/search?category=camicie" },
      { name: "Felpe & Maglie", href: "/search?category=felpe" },
      { name: "Jeans & Denim", href: "/search?category=jeans" },
      { name: "Capispalla & Giacche", href: "/search?category=capispalla" },
      { name: "Abbigliamento Sportivo", href: "/search?category=abbigliamento-sportivo" },
      { name: "Tutte le Collezioni", href: "/search" },
    ],
    supporto: [
      { name: "I Miei Ordini", href: "/dashboard/orders" },
      { name: "Spedizioni e Consegna", href: "/#shipping" },
      { name: "Politica di Reso (30gg)", href: "/#returns" },
      { name: "Guida alle Taglie", href: "/#size-guide" },
      { name: "Domande Frequenti (FAQ)", href: "/#faq" },
      { name: "Assistenza Clienti", href: "/#support" },
    ],
    azienda: [
      { name: "Chi Siamo", href: "/#about" },
      { name: "Sostenibilità & Materiali", href: "/#sustainability" },
      { name: "Lavora con Noi", href: "/#careers" },
      { name: "Punti Vendita", href: "/#stores" },
      { name: "Programma Fedeltà", href: "/#rewards" },
    ],
    legale: [
      { name: "Termini e Condizioni", href: "/#terms" },
      { name: "Informativa sulla Privacy", href: "/#privacy" },
      { name: "Cookie Policy", href: "/#cookies" },
      { name: "Garanzia Legale", href: "/#warranty" },
    ],
  };

  return (
    <footer className="border-t bg-zinc-50/80 dark:bg-zinc-950/80 text-foreground transition-colors">
      {/* 🌟 Newsletter Section */}
      <div className="border-b bg-gradient-to-r from-indigo-600/10 via-purple-600/10 to-pink-600/10 dark:from-indigo-950/40 dark:via-purple-950/30 dark:to-pink-950/40 py-10 sm:py-14">
        <div className="wrapper">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="max-w-xl space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Offerta di Benvenuto</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                Iscriviti alla Newsletter e ricevi il 10% di sconto
              </h3>
              <p className="text-sm text-muted-foreground">
                Rimani aggiornato su nuovi arrivi, promozioni esclusive e tendenze moda.
              </p>
            </div>

            <form
              onSubmit={(e) => e.preventDefault()}
              className="flex flex-col sm:flex-row gap-2.5 w-full lg:max-w-md"
            >
              <div className="relative flex-1">
                <Mail className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                <Input
                  type="email"
                  placeholder="Inserisci la tua email..."
                  className="pl-10 h-11 bg-background border-border/80 rounded-xl shadow-xs"
                />
              </div>
              <Button
                type="submit"
                className="h-11 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 group"
              >
                <span>Iscriviti</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* 🌟 Main Footer Links */}
      <div className="wrapper py-12 sm:py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand Column */}
          <div className="col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-3 group">
              <Image
                src="/images/logo.svg"
                alt={`${APP_NAME} logo`}
                height={38}
                width={38}
                className="transition-transform group-hover:scale-105"
              />
              <span className="font-bold text-2xl tracking-tight bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400 bg-clip-text text-transparent">
                {APP_NAME}
              </span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
              {APP_DESCRIPTION || "ModernStore è la tua destinazione online per la moda contemporanea, capi di tendenza e shopping di qualità garantita."}
            </p>

            <div className="pt-2 flex items-center gap-2.5 text-muted-foreground">
              <Link
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                className="p-2.5 rounded-xl bg-background border border-border/60 hover:text-pink-600 hover:border-pink-300 dark:hover:border-pink-800 transition-all hover:scale-105"
                aria-label="Instagram"
              >
                <SiInstagram className="w-4 h-4" />
              </Link>
              <Link
                href="https://tiktok.com"
                target="_blank"
                rel="noreferrer"
                className="p-2.5 rounded-xl bg-background border border-border/60 hover:text-black dark:hover:text-white hover:border-zinc-400 transition-all hover:scale-105"
                aria-label="TikTok"
              >
                <SiTiktok className="w-4 h-4" />
              </Link>
              <Link
                href="https://facebook.com"
                target="_blank"
                rel="noreferrer"
                className="p-2.5 rounded-xl bg-background border border-border/60 hover:text-blue-600 hover:border-blue-300 dark:hover:border-blue-800 transition-all hover:scale-105"
                aria-label="Facebook"
              >
                <SiFacebook className="w-4 h-4" />
              </Link>
              <Link
                href="https://x.com"
                target="_blank"
                rel="noreferrer"
                className="p-2.5 rounded-xl bg-background border border-border/60 hover:text-zinc-900 dark:hover:text-zinc-100 hover:border-zinc-400 transition-all hover:scale-105"
                aria-label="X (Twitter)"
              >
                <SiX className="w-4 h-4" />
              </Link>
              <Link
                href="https://youtube.com"
                target="_blank"
                rel="noreferrer"
                className="p-2.5 rounded-xl bg-background border border-border/60 hover:text-red-600 hover:border-red-300 dark:hover:border-red-800 transition-all hover:scale-105"
                aria-label="YouTube"
              >
                <SiYoutube className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Collezioni */}
          <div className="space-y-3">
            <h4 className="font-bold text-sm tracking-wide uppercase text-foreground">
              Collezioni
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {footerLinks.collezioni.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Supporto Clienti */}
          <div className="space-y-3">
            <h4 className="font-bold text-sm tracking-wide uppercase text-foreground">
              Servizio Clienti
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {footerLinks.supporto.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Azienda & Legale */}
          <div className="space-y-3">
            <h4 className="font-bold text-sm tracking-wide uppercase text-foreground">
              Azienda & Legale
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {footerLinks.azienda.concat(footerLinks.legale.slice(0, 2)).map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* 🌟 Payments and Security Bar */}
        <div className="mt-12 pt-8 border-t flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Transazioni Protette SSL 256-bit</span>
            </div>
            <span className="hidden sm:inline text-muted-foreground/40">•</span>
            <div className="text-xs text-muted-foreground">
              Accettiamo i principali metodi di pagamento
            </div>
          </div>

          {/* Payment Badges Grid */}
          <PaymentBadgesList />
        </div>

        {/* 🌟 Copyright Sub-footer */}
        <div className="mt-8 pt-6 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground text-center sm:text-left">
          <div>
            © {currentYear} {APP_NAME}. Tutti i diritti sono riservati. P.IVA e dati societari registrati.
          </div>
          <div className="flex items-center gap-4">
            <Link href="/#privacy" className="hover:underline">
              Privacy Policy
            </Link>
            <Link href="/#terms" className="hover:underline">
              Termini di Servizio
            </Link>
            <Link href="/#cookies" className="hover:underline">
              Preferenze Cookie
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;