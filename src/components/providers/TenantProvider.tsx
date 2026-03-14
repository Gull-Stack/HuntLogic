"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";

interface TenantConfig {
  id: string;
  brandName: string;
  logoUrl: string;
  primaryColor: string;
  ctaGradient: string;
  supportEmail: string;
  featuresEnabled: string[];
}

const DEFAULT_CONFIG: TenantConfig = {
  id: "huntlogic",
  brandName: process.env.NEXT_PUBLIC_BRAND_NAME || "HuntLogic",
  logoUrl: "/logo.svg",
  primaryColor: "#1A3C2A",
  ctaGradient: "linear-gradient(135deg, #C4651A, #D4A03C)",
  supportEmail: "support@huntlogic.com",
  featuresEnabled: ["all"],
};

interface TenantContextType {
  tenantConfig: TenantConfig;
  loading: boolean;
}

const TenantContext = createContext<TenantContextType>({
  tenantConfig: DEFAULT_CONFIG,
  loading: true,
});

export function useTenant() {
  return useContext(TenantContext);
}

interface TenantProviderProps {
  children: ReactNode;
}

export function TenantProvider({ children }: TenantProviderProps) {
  const [tenantConfig, setTenantConfig] =
    useState<TenantConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadConfig() {
      try {
        const res = await fetch("/api/v1/tenant");
        if (res.ok) {
          const data = await res.json();
          if (data.config) {
            setTenantConfig(data.config);
            // Inject CSS custom properties
            const root = document.documentElement;
            root.style.setProperty(
              "--brand-primary",
              data.config.primaryColor
            );
            root.style.setProperty(
              "--brand-cta-gradient",
              data.config.ctaGradient
            );
          }
        }
      } catch {
        // Use defaults silently
      } finally {
        setLoading(false);
      }
    }

    loadConfig();
  }, []);

  return (
    <TenantContext.Provider value={{ tenantConfig, loading }}>
      {children}
    </TenantContext.Provider>
  );
}
