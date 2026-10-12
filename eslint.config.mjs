import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // "mount/dep өөрчлөгдөхөд fetch → setState" хэв маягийг React Compiler-ийн энэ дүрэм
      // алдаа гэж үздэг. Дата татах давхарга (SWR/React Query) руу шилжих хүртэл анхааруулга
      // хэвээр үлдээж, CI-г бусад бодит алдаанд (any, static-components г.м.) төвлөрүүлнэ.
      "react-hooks/set-state-in-effect": "warn",
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
