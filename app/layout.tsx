import type { Metadata } from "next";
import Script from "next/script";
import { Cormorant_Garamond, Manrope, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/components/providers/app-providers";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space-grotesk" });
const cormorant = Cormorant_Garamond({ subsets: ["latin"], variable: "--font-cormorant", weight: ["400", "500", "600", "700"] });

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: {
    default: "FriendlyDrop - Custom Photo Prints & Personalized Gifts",
    template: "%s | FriendlyDrop",
  },
  description:
    "Shop premium custom photo prints, stickers, and personalized gifts with secure payments and fast delivery.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
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
          <Navbar />
          {children}
          <Footer />
          <MobileBottomNav />
        </AppProviders>
      </body>
    </html>
  );
}
