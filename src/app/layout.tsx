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
    icon: "/js-gbc.ico",
    apple: "/gbc-homescreen-icon-192.jpeg"
  }
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