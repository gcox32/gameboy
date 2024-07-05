import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from '../contexts/AuthContext';
import { Amplify } from 'aws-amplify';
import awsconfig from '../aws-exports';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';

import '../styles/styles.css';
import '../styles/modal.css';

Amplify.configure(awsconfig);

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
          <Nav />
          {children}
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}