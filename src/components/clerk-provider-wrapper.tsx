'use client';

import { ClerkProvider } from '@clerk/nextjs';
import { dark } from '@clerk/themes';
import { useEffect, useState } from 'react';

export function ClerkProviderWrapper({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Immediately check theme without waiting
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

  return (
    <ClerkProvider
      appearance={{
        baseTheme: isDark ? dark : undefined,
        cssLayerName: 'clerk',
        variables: {
          // Primary colors
          colorPrimary: isDark ? '#60a5fa' : '#2563eb',
          colorTextOnPrimaryBackground: '#ffffff',

          // Background colors
          colorBackground: isDark ? '#1a1a2e' : '#ffffff',
          colorInputBackground: isDark ? '#2c3e50' : '#f8f9fa',

          // Text colors
          colorText: isDark ? '#e8e8e8' : '#1f2937',
          colorInputText: isDark ? '#e8e8e8' : '#1f2937',
          colorTextSecondary: isDark ? '#cbd5e1' : '#4b5563',

          // Status colors
          colorSuccess: isDark ? '#34d399' : '#10b981',
          colorWarning: isDark ? '#fbbf24' : '#fb923c',
          colorDanger: isDark ? '#f87171' : '#ef4444',

          // Neutral colors for borders and shadows
          colorNeutral: isDark ? '#334155' : '#e5e7eb',
          colorShimmer: isDark ? '#475569' : '#f3f4f6',

          // Border and focus
          borderRadius: '0.5rem',

          // Font
          fontSize: '0.875rem',
          fontWeight: {
            normal: 400,
            medium: 500,
            semibold: 600,
            bold: 700
          },

          // OAuth/Social button fixes
          socialButtonsBlockButtonText: isDark ? '#ffffff' : '#1f2937',
          socialButtonsBlockButton: isDark ? '#374151' : '#f3f4f6',
          socialButtonsBlockButtonText__connectionName: isDark ? '#e5e7eb' : '#4b5563',
          colorButtonText: isDark ? '#ffffff' : '#1f2937'
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any,
        elements: {
          // UserButton dropdown menu items
          userButtonPopoverActionButton: {
            color: isDark ? '#e5e7eb' : '#1f2937',
            '&:hover': {
              color: isDark ? '#ffffff' : '#000000'
            }
          },
          // UserButton dropdown footer
          userButtonPopoverFooter: {
            color: isDark ? '#9ca3af' : '#6b7280'
          },
          // OAuth/Social button styling
          socialButtonsBlockButton: {
            color: isDark ? '#ffffff' : '#1f2937',
            backgroundColor: isDark ? '#374151' : '#f3f4f6',
            '&:hover': {
              backgroundColor: isDark ? '#4b5563' : '#e5e7eb'
            }
          },
          socialButtonsBlockButtonText: {
            color: isDark ? '#ffffff' : '#1f2937'
          }
        }
      }}
    >
      {children}
    </ClerkProvider>
  );
}