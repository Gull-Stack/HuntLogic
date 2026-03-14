"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { useRouter, usePathname } from "next/navigation";

interface OpsUser {
  opsUserId: string;
  email: string;
  displayName: string;
  role: "agent" | "supervisor" | "admin";
  assignedStates: string[];
}

interface OpsAuthContextType {
  opsUser: OpsUser | null;
  isLoading: boolean;
  logout: () => Promise<void>;
}

const OpsAuthContext = createContext<OpsAuthContextType>({
  opsUser: null,
  isLoading: true,
  logout: async () => {},
});

export function useOpsAuth() {
  return useContext(OpsAuthContext);
}

interface OpsAuthProviderProps {
  children: ReactNode;
}

export function OpsAuthProvider({ children }: OpsAuthProviderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [opsUser, setOpsUser] = useState<OpsUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/v1/ops/auth/me");
        if (!res.ok) {
          if (res.status === 401) {
            router.replace("/ops/login");
            return;
          }
          throw new Error(`Auth check failed: ${res.status}`);
        }
        const json = await res.json();
        setOpsUser(json.data?.user ?? json.user);
      } catch {
        router.replace("/ops/login");
      } finally {
        setIsLoading(false);
      }
    }

    // Don't check auth on the login page itself
    if (pathname === "/ops/login") {
      setIsLoading(false);
      return;
    }

    checkAuth();
  }, [router, pathname]);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/v1/ops/auth/logout", { method: "POST" });
    } catch {
      // Proceed to redirect even if logout call fails
    }
    setOpsUser(null);
    router.replace("/ops/login");
  }, [router]);

  return (
    <OpsAuthContext.Provider value={{ opsUser, isLoading, logout }}>
      {children}
    </OpsAuthContext.Provider>
  );
}
