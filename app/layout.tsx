import type { Metadata } from "next";
import { IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const ibmSans = IBM_Plex_Sans({
  variable: "--font-ibm-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const ibmMono = IBM_Plex_Mono({
  variable: "--font-ibm-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
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
  manifest: "/manifest.json",
  openGraph: {
    title: "HydroSmart — Living Intelligence for Plants",
    description: "Automated, closed-loop hydroponics powered by ESP32 and Firebase",
    type: "website",
    images: ["/logo.png"],
  },
};

export const viewport: import("next").Viewport = {
  themeColor: "#051311",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${ibmSans.variable} ${ibmMono.variable}`}>
        <AuthProvider>
          <BackgroundEffects />
          <StartupIntro />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
