// src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'BREA 88 Realty OPC',
  description: 'BREA 88 Realty Property Management System',
  icons: {
    icon: '/img/browse_logo.png',
    shortcut: '/img/browse_logo.png',
    apple: '/img/browse_logo.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}