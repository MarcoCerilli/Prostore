import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
// ✅ Importa la configurazione di Prettier (deve essere importata qui)
import prettier from "eslint-config-prettier"; 

const eslintConfig = defineConfig([
  // Regole Next.js (base)
  ...nextVitals,
  // Regole Next.js (TypeScript)
  ...nextTs,
  // ✅ Regole di Prettier: DEVE ESSERE L'ULTIMA VOCE per disattivare i conflitti di formattazione
  prettier, 
  
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
