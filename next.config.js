/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Disattiva l'ottimizzazione Edge di Vercel: azzera il consumo dei limiti Image Optimization sul piano Hobby (1000/mese)
    // e serve le immagini direttamente evitando blocchi ed errori 402/429
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "**",
      },
    ],
  },
};

module.exports = nextConfig;
