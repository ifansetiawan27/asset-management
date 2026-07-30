import type { Metadata } from 'next';

import './globals.css';
import { AuthGate } from '@/components/auth-gate';

export const metadata: Metadata = {
  title: 'AMS — Asset Management System',
  description: 'Enterprise & SaaS Multi-Tenant Asset Management',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    /*
     * translate="no"  → mencegah Microsoft Translator / browser extension
     *                   menambahkan atribut msttexthash / data-msttranslated
     *                   ke DOM, yang menyebabkan React hydration mismatch.
     * suppressHydrationWarning → izinkan perbedaan kecil server↔client
     *   yang tidak mempengaruhi render (mis. ekstensi browser lain).
     */
    <html lang="id" translate="no">
      <body suppressHydrationWarning>
        <AuthGate>{children}</AuthGate>
      </body>
    </html>
  );
}
