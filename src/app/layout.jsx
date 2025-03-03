import { Inter } from "next/font/google";
import "./globals.css";
import GoogleAnalytics from '@/components/analytics/GoogleAnalytics';
import { AuthProvider } from '../contexts/AuthContext';
import { Amplify } from 'aws-amplify';
import outputs from '../../amplify_outputs.json';
import Nav from '@/components/layout/Nav';

import '../styles/styles.css';
import '../styles/modal.css';
import { SettingsProvider } from "@/contexts/SettingsContext";
import { GameProvider } from '../contexts/GameContext';

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

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <SettingsProvider>
            <GameProvider>
              <Nav />
              {children}
            </GameProvider>
          </SettingsProvider>
        </AuthProvider>
        <GoogleAnalytics />
      </body>
    </html>
  );
}