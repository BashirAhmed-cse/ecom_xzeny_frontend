import type { Metadata } from "next";
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import { ThemeProvider } from "@/lib/ThemeProvider";
import { ClerkProvider } from '@clerk/nextjs';
import UserSync from '@/components/UserSync';
import TopBanner from "@/components/TopBanner";
import { CartProvider } from "@/lib/CartContext"; // 🛒 Add this import
import CartDrawer from "@/components/CartDrawer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const playfairDisplay = Playfair_Display({
  variable: "--font-playfair-display",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "StyleCommerce - Wear your Style with Comfort",
  description: "Premium fashion and accessories",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${playfairDisplay.variable} antialiased font-sans`}
      >
        <ClerkProvider
          appearance={{
            variables: {
              colorPrimary: '#f59e0b', // amber-500
              colorText: '#ffffff',
            },
            elements: {
              rootBox: "mx-auto",
              card: "bg-gray-900 border border-gray-700 rounded-2xl",
              headerTitle: "text-white text-2xl font-bold",
              headerSubtitle: "text-gray-400",
              socialButtonsBlockButton: "bg-gray-800 border-gray-700 text-white hover:bg-gray-700",
              formButtonPrimary: "bg-amber-500 hover:bg-amber-600 text-white font-semibold",
              formFieldInput: "bg-gray-700 border-gray-600 text-white focus:border-amber-500",
              formFieldLabel: "text-white",
              footerActionLink: "text-amber-400 hover:text-amber-300",
            },
          }}
        >
          <ThemeProvider>
            <CartProvider> {/* 🛍️ Global Cart Context */}
              <UserSync />
              {/* <TopBanner /> */}
              <Header />
              <CartDrawer />
              <main className="min-h-screen my-1">
                {children}
              </main>
            </CartProvider>
          </ThemeProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
