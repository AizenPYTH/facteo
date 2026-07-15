import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "expo-constants",
              message: "Le projet website (Next.js) ne doit pas importer de packages Expo.",
            },
            {
              name: "react-native",
              message: "Le projet website (Next.js) ne doit pas importer react-native.",
            },
            {
              name: "@react-native-async-storage/async-storage",
              message: "Utiliser localStorage via createSupabaseAuthStorage (web).",
            },
          ],
          patterns: [
            {
              group: ["expo", "expo-*", "@expo/*"],
              message: "Le projet website (Next.js) ne doit pas importer de packages Expo.",
            },
          ],
        },
      ],
    },
  },
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
