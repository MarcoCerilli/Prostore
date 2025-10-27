import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';
import sampleData from './sample-data.ts'; 

// 💡 CORREZIONE: Ottiene la directory del file corrente
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 💡 NUOVA CONFIGURAZIONE DOTENV: Carica il .env due livelli sopra (nella root)
// Visto che seed.ts è in src/db/, risaliamo due volte per trovare la root.
const envPath = path.join(__dirname, '..', '..', '.env.local'); 
dotenv.config({ path: envPath }); 
console.log('--- DEBUG INFO ---'); // 👈 NUOVO
console.log('Percorso .env risolto:', envPath); // 👈 NUOVO
console.log('DATABASE_URL trovata:', process.env.DATABASE_URL ? 'SÌ' : 'NO'); // 👈 NUOVO
console.log('------------------'); // 👈 NUOVO

const prisma = new PrismaClient();



async function main() {
  console.log('Inizio seeding...');

  // 1. ELIMINA i dati vecchi (opzionale ma consigliato per i seed)
  await prisma.product.deleteMany();
  console.log('Prodotti esistenti eliminati.');

  // 2. CREA i nuovi prodotti
  for (const product of sampleData.products) {
    // Inserisce i dati nel database
    await prisma.product.create({
      data: {
        name: product.name,
        slug: product.slug,
        category: product.category,
        description: product.description,
        // Prisma supporta direttamente i tipi Array<string>
        images: product.images, 
        price: product.price,
        brand: product.brand,
        rating: product.rating,
        numReviews: product.numReviews,
        stock: product.stock,
        isFeatured: product.isFeatured,
        banner: product.banner || null, // Aggiunto fallback per i campi null
      },
    });
  }

  console.log(`Seeding completato. Inseriti ${sampleData.products.length} prodotti.`);
}

main()
  .catch(e => {
    console.error('Errore durante il seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
