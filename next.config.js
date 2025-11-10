// Contenuto CORRETTO in next.config.js (JS)
/** @type {import('next').NextConfig} */ // JSDoc per i tipi
const nextConfig = {
  images: {
    // Usa remotePatterns per configurare i domini esterni permessi
    remotePatterns: [
      {
        protocol: "https",
        // Sostituisci 'logolook.net' con il tuo dominio se usi un'altra fonte
        hostname: "logolook.net",
        // Se necessario, puoi aggiungere pathname, e port
      },
    ],
  },
};
module.exports = nextConfig; // O export default nextConfig; in base al tipo di modulo
