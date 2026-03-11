import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Sora, Newsreader } from "next/font/google";
import "./globals.css";
import { PageTransition } from "./components/PageTransition";
import { AuthProvider } from "./context/AuthProvider";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
});

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  style: ['normal', 'italic'],
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
        className={`${jakarta.variable} ${sora.variable} ${newsreader.variable} antialiased`}
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
