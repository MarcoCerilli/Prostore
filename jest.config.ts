import type { Config } from "jest";

const config: Config = {
  //indica l ambiente di test (necessario per i test unitari standard)

  testEnvironment: "node",

  //*****************************
  // ESEGUIAMO IL FILE DI SETUP
  //*****************************

  setupFiles: ["<rootDir>/jest.setup.ts"],
  // Nota: se fosse codice che interagisce con il DOM di React (es. testing-library), useremmo 'setupFilesAfterEnv'

  //1. ROOTS: directory in cui Jest cercherà i file di Test
  // Stabiliamo che Jest lavori all'interno della cartella 'src'
  roots: ["<rootDir>/src"],

  // 2. TEST MATCH: Modelli di file che Jest deve eseguire (quelli che finiscono con .test.ts)
  testMatch: ["<rootDir>/src/**/*.test.ts", "<rootDir>/src/**/*.test.tsx"],

  //3. TRANSFORM: Configura ts-jestper procesare i file TypeScript (TS) e TypeScript React(TSX)

  transform: {
    "^.+\\.(ts|tsx)$": "ts-jest",
  },

  //4. MODULE NAME MAPPER:
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },

  // Ignora le directory comuni di compilazione  e moduli
  modulePathIgnorePatterns: ["<rootDir>/.next", "<rootDir>/node_modules"],

  //Estensioni dei file che Jest deve cercare
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
};

export default config;
