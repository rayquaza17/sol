import type { Metadata } from "next";
import { Inter, Outfit, Playfair_Display } from "next/font/google";
import "./globals.css";
import { PageTransition } from "./components/PageTransition";
import { AuthProvider } from "./context/AuthProvider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Solitude | A Gentle Sanctuary for Your Mind",
  description: "Breathe. Talk. Heal. Solitude is your private space to reflect, restore, and rediscover yourself through nature-inspired support.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={`${inter.variable} ${outfit.variable} ${playfair.variable} antialiased`}
      >
        <AuthProvider>
          <PageTransition>
            {children}
          </PageTransition>
        </AuthProvider>
      </body>
    </html>
  );
}
