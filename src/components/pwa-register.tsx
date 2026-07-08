"use client";

import { useEffect } from "react";

/** Service worker бүртгэнэ — апп суулгах боломж + оффлайн fallback идэвхжүүлнэ */
export function PwaRegister() {
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      process.env.NODE_ENV === "production"
    ) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Бүртгэл амжилтгүй болвол апп хэвийн ажиллана
      });
    }
  }, []);

  return null;
}
