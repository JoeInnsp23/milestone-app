'use client';

import { ClerkProvider } from '@clerk/nextjs';
import { dark } from '@clerk/themes';
import { useEffect, useState } from 'react';

export function ClerkProviderWrapper({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setMounted(true);
    const checkTheme = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };

    checkTheme();

    // Watch for theme changes
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  if (!mounted) {
    return (
      <ClerkProvider
        appearance={{
          cssLayerName: 'clerk'
        }}
      >
        {children}
      </ClerkProvider>
    );
  }

  return (
    <ClerkProvider
      appearance={{
        baseTheme: isDark ? dark : undefined,
        cssLayerName: 'clerk',
        variables: {
          colorPrimary: '#2563eb',
          colorBackground: isDark ? '#1a1a1a' : '#ffffff',
          colorInputBackground: isDark ? '#2a2a2a' : '#f9fafb',
          colorInputText: isDark ? '#e5e5e5' : '#1f2937',
        }
      }}
    >
      {children}
    </ClerkProvider>
  );
}