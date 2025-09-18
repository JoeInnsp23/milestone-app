import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProviderWrapper } from '@/components/clerk-provider-wrapper';
import { ThemeProvider } from '@/components/theme-provider';
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
    <ClerkProviderWrapper>
      <html lang="en" suppressHydrationWarning>
        <body className={`${inter.className} antialiased min-h-screen`}>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </body>
      </html>
    </ClerkProviderWrapper>
  );
}
