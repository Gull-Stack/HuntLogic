import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "HuntLogic Concierge",
    template: "%s | HuntLogic",
  },
  description:
    "Your AI-powered hunting intelligence platform. Get personalized recommendations, draw odds analysis, season forecasts, and strategic playbooks for western big game hunting.",
  keywords: [
    "hunting",
    "draw odds",
    "big game",
    "hunting intelligence",
    "hunt planning",
    "elk hunting",
    "deer hunting",
    "western hunting",
  ],
  authors: [{ name: "HuntLogic" }],
  creator: "HuntLogic",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  ),
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "HuntLogic Concierge",
    title: "HuntLogic Concierge — AI-Powered Hunting Intelligence",
    description:
      "Personalized hunt planning, draw odds analysis, and strategic recommendations powered by AI.",
  },
  twitter: {
    card: "summary_large_image",
    title: "HuntLogic Concierge",
    description:
      "AI-powered hunting intelligence for western big game hunters.",
  },
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F4F1DE" },
    { media: "(prefers-color-scheme: dark)", color: "#1B4332" },
  ],
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-brand-cream font-sans text-brand-bark antialiased dark:bg-brand-forest dark:text-brand-cream">
        {children}
      </body>
    </html>
  );
}
