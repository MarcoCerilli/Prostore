# ModernStore 🛍️

**ModernStore** è una piattaforma di e-commerce moderna, completa e performante dedicata all'abbigliamento e alla moda contemporanea, costruita con lo stack tecnologico più avanzato del panorama JavaScript e React.

---

## 🚀 Caratteristiche Principali

### 👗 Catalogo & Ricerca Prodotti
- **Vetrina Prodotti & Ultime Novità**: Sezioni dinamiche per prodotti in evidenza e nuove collezioni.
- **Ricerca & Filtri Avanzati**: Ricerca full-text e filtri per categorie, prezzi, recensioni e ordinamento personalizzato con paginazione ottimizzata.
- **Dettaglio Prodotto**: Galleria immagini interattiva, selezione taglie/varianti, disponibilità magazzino in tempo reale e recensioni verificate.

### 🛒 Carrello & Checkout
- **Carrello Persistente**: Gestione carrello sia per utenti anonimi (session-based) che autenticati (DB PostgreSQL).
- **Flusso Checkout Guidato**: Selezione indirizzo di spedizione, metodo di pagamento e riepilogo ordini trasparente con calcolo automatico di IVA e spedizione.
- **Gateway di Pagamento Integrati**:
  - **Stripe**: Integrazione sicura per carte di credito con webhook asincrono per l'aggiornamento istantaneo dello stato dell'ordine e decremento dello stock.
  - **PayPal**: Checkout con PayPal SDK (creazione ordine e cattura automatica del pagamento).
  - **Contrassegno**: Pagamento alla consegna.

### 👤 Area Utente (Dashboard Cliente)
- **Gestione Profilo**: Modifica dati anagrafici e cambio password per credenziali locali.
- **Storico Ordini**: Visualizzazione dettagliata degli acquisti, fatturazione, stato del pagamento e tracciamento spedizione.

### 🛡️ Pannello Amministrazione (`/dashboard/admin`)
- **Panoramica & Analytics**: Metriche di vendita globali, fatturato totale, ordini in attesa e grafici dell'andamento vendite giornaliere.
- **Gestione Prodotti**: Creazione (CRUD), modifica dettagli/prezzi/stock, caricamento immagini (UploadThing) e gestione vetrina.
- **Gestione Ordini**: Monitoraggio avanzato, aggiornamento rapido dello stato (In elaborazione, Spedito, Consegnato, Annullato) ed eliminazione ordini.
- **Gestione Utenti**: Controllo utenti registrati, assegnazione ruoli (`admin` / `user`) e gestione accessi.
- **Allerte Scorte**: Notifiche automatiche per prodotti in esaurimento (stock limitato o esaurito).

---

## 🛠️ Stack Tecnologico

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router & React Server Actions)
- **Libreria UI**: [React 19](https://react.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) & [Shadcn UI](https://ui.shadcn.com/) (Lucide Icons, Radix Primitives)
- **Database & ORM**: PostgreSQL su [Neon Database](https://neon.tech/) con [Prisma ORM](https://www.prisma.io/)
- **Autenticazione**: [NextAuth v5 (Auth.js)](https://authjs.dev/) con credenziali e sessioni JWT/Database
- **Upload File**: [UploadThing](https://uploadthing.com/) per caricamento rapido di immagini su cloud
- **Email Transazionali**: [Resend](https://resend.com/) & [React Email](https://react.email/) per conferme d'ordine e ricevute d'acquisto
- **Testing**: [Jest](https://jestjs.io/) & Babel per unit testing

---

## 📦 Prerequisiti & Avvio Rapido

### 1. Clonare la repository e installare le dipendenze
```bash
git clone git@github.com:MarcoCerilli/Prostore.git
cd Prostore
npm install
```

### 2. Configurare le variabili d'ambiente
Crea un file `.env.local` nella root del progetto con le seguenti configurazioni:
```env
# Database
DATABASE_URL="postgresql://user:password@host/neondb?sslmode=require"

# NextAuth
AUTH_SECRET="la-tua-chiave-segreta-auth"
NEXT_AUTH_URL="http://localhost:3000"

# App Branding
NEXT_PUBLIC_APP_NAME="ModernStore"
NEXT_PUBLIC_APP_DESCRIPTION="ModernStore - Abbigliamento e Moda Contemporanea"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Gateway Pagamenti
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

NEXT_PUBLIC_PAYPAL_CLIENT_ID="AVV..."
PAYPAL_APP_SECRET="..."
PAYPAL_API_URL="https://api-m.sandbox.paypal.com"

# UploadThing
UPLOADTHING_APPID="..."
UPLOADTHING_SECRET="..."
UPLOADTHING_TOKEN="..."

# Resend
RESEND_API_KEY="re_..."
SENDER_EMAIL="onboarding@resend.dev"
```

### 3. Sincronizzare il Database Prisma
```bash
npx prisma db push
# Per popolare con dati di esempio:
npm run seed
```

### 4. Eseguire i Test
```bash
npm test
```

### 5. Avviare il Server di Sviluppo
```bash
npm run dev
```
Visita [http://localhost:3000](http://localhost:3000) nel tuo browser.

---

## 🔒 Sicurezza & Best Practice
- Protezione rotte amministrative a livello di **Middleware** e **Server Actions** (`role.toLowerCase() === 'admin'`).
- Validazione degli input tramite schemi rigorosi **Zod**.
- Sanitizzazione dei payload di sessione per evitare l'esposizione di informazioni sensibili ai componenti client.
- Gestione webhook Stripe protetta con firma crittografica (`stripe-signature`).

---

## 📄 Licenza
Progetto sviluppato e manutenuto da **Marco Cerilli**. Tutti i diritti riservati.
