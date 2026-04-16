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

export const metadata: Metadata = {
  title: "HydroSmart — Intelligent Hydroponic Control System",
  description:
    "IoT-based closed-loop hydroponic control system. Real-time pH, TDS and temperature monitoring with autonomous nutrient dosing. SDG 2, 6, 12 aligned.",
  keywords: ["hydroponics", "IoT", "smart farming", "pH control", "ESP32", "automation"],
  authors: [{ name: "HydroSmart Team" }],
  openGraph: {
    title: "HydroSmart — Intelligent Hydroponic Control",
    description: "Automated, closed-loop hydroponics powered by ESP32 and Firebase",
    type: "website",
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
        <BackgroundEffects />
        {children}
      </body>
    </html>
  );
}
