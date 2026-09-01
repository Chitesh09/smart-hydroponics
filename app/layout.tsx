import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

import { BackgroundEffects } from '@/components/BackgroundEffects';
import { StartupIntro } from '@/components/StartupIntro';
import { AuthProvider } from '@/lib/auth/AuthContext';

export const metadata: Metadata = {
  metadataBase: new URL('https://hydrosmart.app'),
  title: "HydroSmart — Living Intelligence for Plants",
  description:
    "IoT-based closed-loop hydroponic control system. Real-time pH, TDS and temperature monitoring with autonomous nutrient dosing. SDG 2, 6, 12 aligned.",
  keywords: ["hydroponics", "IoT", "smart farming", "pH control", "ESP32", "automation", "plant vision"],
  authors: [{ name: "HydroSmart Team" }],
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/icon.png",
  },
  openGraph: {
    title: "HydroSmart — Living Intelligence for Plants",
    description: "Automated, closed-loop hydroponics powered by ESP32 and Firebase",
    type: "website",
    images: ["/logo.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <AuthProvider>
          <BackgroundEffects />
          <StartupIntro />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
