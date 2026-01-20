import type { Viewport } from 'next';
import { Inter } from "next/font/google";
import "./globals.css";
import { ReactNode } from 'react';

import { Amplify } from 'aws-amplify';
import outputs from '../../amplify_outputs.json';

import { AuthProvider } from '../contexts/AuthContext';
import { SettingsProvider } from "@/contexts/SettingsContext";
import { GameProvider } from '../contexts/GameContext';
import GoogleAnalytics from '@/components/analytics/GoogleAnalytics';

Amplify.configure(outputs);

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "JS GBC",
  description: "Javascript Gameboy Color",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    apple: "/gbc-homescreen-icon-192.jpeg"
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "JS GBC"
  },
  formatDetection: {
    telephone: false
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: [
    { media: "(max-width: 768px)", color: "#000000" },
    { media: "(min-width: 769px)", color: "#add8e6" }
  ]
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <SettingsProvider>
            <GameProvider>
              {children}
            </GameProvider>
          </SettingsProvider>
        </AuthProvider>
        <GoogleAnalytics />
      </body>
    </html>
  );
}