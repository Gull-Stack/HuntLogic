"use client";

import { useEffect } from "react";
import { SessionProvider } from "next-auth/react";
import { registerServiceWorker } from "@/lib/register-sw";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    registerServiceWorker();
  }, []);

  return <SessionProvider>{children}</SessionProvider>;
}
