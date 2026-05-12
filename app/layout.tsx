import type { Metadata } from "next";
import Script from "next/script";
import { Cormorant_Garamond, Manrope, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/components/providers/app-providers";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { getStoreSettings } from "@/lib/firebase/firestore";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space-grotesk" });
const cormorant = Cormorant_Garamond({ subsets: ["latin"], variable: "--font-cormorant", weight: ["400", "500", "600", "700"] });

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getStoreSettings();
  const storeName = settings.storeName || "FriendlyDrop";
  const titlePrefix = settings.brandPrefix?.trim() ? `${settings.brandPrefix.trim()} ${storeName}` : storeName;

  return {
    title: {
      default: `${titlePrefix} - Luxury Fashion Commerce`,
      template: `%s | ${titlePrefix}`,
    },
    description:
      settings.brandTagline ?? "Premium fashion marketplace with AI recommendations, secure payments, and fast delivery.",
    metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await getStoreSettings();

  return (
    <html lang="en" className={`${manrope.variable} ${spaceGrotesk.variable} ${cormorant.variable}`} suppressHydrationWarning>
      <body className="min-h-screen font-sans">
        <AppProviders>
          <Script id="theme-init" strategy="beforeInteractive">
            {`
              (() => {
                try {
                  const saved = localStorage.getItem("friendlydrop-theme");
                  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
                  const resolved = saved === "dark" || saved === "light" ? saved : (prefersDark ? "dark" : "light");
                  if (resolved === "dark") document.documentElement.classList.add("dark");
                  else document.documentElement.classList.remove("dark");
                } catch (error) {}
              })();
            `}
          </Script>
          <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />
          <Navbar storeName={settings.storeName} brandPrefix={settings.brandPrefix} logoUrl={settings.logoUrl} />
          {children}
          <Footer
            storeName={settings.storeName}
            brandPrefix={settings.brandPrefix}
            brandTagline={settings.brandTagline}
            supportEmail={settings.supportEmail}
            supportPhone={settings.supportPhone}
          />
          <MobileBottomNav />
        </AppProviders>
      </body>
    </html>
  );
}
