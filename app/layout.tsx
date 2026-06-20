import type { Metadata } from "next";
import Script from "next/script";
import { Cormorant_Garamond, Manrope, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/components/providers/app-providers";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { getCachedStoreSettings } from "@/lib/cache";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space-grotesk" });
const cormorant = Cormorant_Garamond({ subsets: ["latin"], variable: "--font-cormorant", weight: ["400", "500", "600", "700"] });

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getCachedStoreSettings();
  const storeName = settings.storeName || "FriendlyDrop";
  const titlePrefix = settings.brandPrefix?.trim() ? `${settings.brandPrefix.trim()} ${storeName}` : storeName;

  return {
    title: {
      default: `${titlePrefix} - Luxury Fashion Commerce`,
      template: `%s | ${titlePrefix}`,
    },
    description:
      settings.brandTagline ?? "Premium fashion, secure payments, and fast delivery.",
    metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await getCachedStoreSettings();

  return (
    <html lang="en" className={`light ${manrope.variable} ${spaceGrotesk.variable} ${cormorant.variable}`} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://sdk.cashfree.com" />
        <link rel="preconnect" href="https://api.cashfree.com" />
        <link rel="preconnect" href="https://sandbox.cashfree.com" />
        <link rel="preconnect" href="https://images.unsplash.com" />
        <link rel="preconnect" href="https://firebasestorage.googleapis.com" />
      </head>
      <body className="min-h-screen font-sans">
        <AppProviders>
          <Script id="force-light-mode" strategy="beforeInteractive">
            {`
              (() => {
                try {
                  document.documentElement.classList.remove("dark");
                  document.documentElement.classList.add("light");
                  document.documentElement.setAttribute("data-theme", "light");
                } catch (error) {}
              })();
            `}
          </Script>
          <Script src="https://sdk.cashfree.com/js/v3/cashfree.js" strategy="lazyOnload" />
          <Navbar
            storeName={settings.storeName}
            brandPrefix={settings.brandPrefix}
            logoUrl={settings.logoUrl}
            menuEditor={settings.menuEditor}
          />
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
