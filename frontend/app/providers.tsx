"use client";

import { LanguageProvider } from "@/lib/i18n";
import { Toaster } from "react-hot-toast";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "#0c0c0e",
            color: "#fafafa",
            borderRadius: "12px",
            fontSize: "14px",
          },
        }}
      />
    </LanguageProvider>
  );
}
