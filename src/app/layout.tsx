import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProviderWrapper } from '@/components/clerk-provider-wrapper';
import { ThemeProvider } from '@/components/theme-provider';
import { cookies } from 'next/headers';
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Project Hub",
  description: "Project Profit & Loss Dashboard for Construction & Professional Services",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Read theme from cookie on server
  const cookieStore = await cookies();
  const theme = cookieStore.get('theme')?.value || 'dark';

  return (
    <ClerkProviderWrapper>
      <html lang="en" suppressHydrationWarning className={theme}>
        <body className={`${inter.className} antialiased min-h-screen`}>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </body>
      </html>
    </ClerkProviderWrapper>
  );
}
