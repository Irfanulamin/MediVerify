"use client";

import { LanguageProvider } from "@/lib/i18n";
import { Toaster } from "react-hot-toast";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      {children}
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: "var(--background)",
            color: "var(--foreground)",
            border: "1px solid var(--border)",
            borderLeft: "4px solid var(--info)",
            borderRadius: "var(--radius-card)",
            fontSize: "14px",
            padding: "12px 16px",
            boxShadow:
              "0 4px 24px rgba(12, 12, 14, 0.07), 0 1px 4px rgba(12, 12, 14, 0.04)",
          },
          success: {
            iconTheme: { primary: "var(--success)", secondary: "#ffffff" },
            style: { borderLeft: "4px solid var(--success)" },
          },
          error: {
            iconTheme: { primary: "var(--danger)", secondary: "#ffffff" },
            style: { borderLeft: "4px solid var(--danger)" },
          },
        }}
      />
    </LanguageProvider>
  );
}
