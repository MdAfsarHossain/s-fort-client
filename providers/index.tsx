"use client";

import type { ReactNode } from "react";
import { ThemeProvider } from "next-themes";
import { Provider } from "react-redux";

import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "@/components/ui/sonner";
import { store } from "@/redux/store";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <Provider store={store}>
        <AuthProvider>
          {children}
          <Toaster richColors position="top-center" visibleToasts={2} />
        </AuthProvider>
      </Provider>
    </ThemeProvider>
  );
}
