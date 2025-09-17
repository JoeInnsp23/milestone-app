import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Milestone P&L Dashboard",
  description: "Project Profit & Loss Dashboard for Construction & Professional Services",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased gradient-bg-light dark:gradient-bg-dark min-h-screen`}>
        {children}
      </body>
    </html>
  );
}
