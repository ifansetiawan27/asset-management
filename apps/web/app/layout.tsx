import type { Metadata } from 'next';

import './globals.css';
import { AuthGate } from '@/components/auth-gate';

export const metadata: Metadata = {
  title: 'AMS — Asset Management System',
  description: 'Enterprise & SaaS Multi-Tenant Asset Management',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>
        <AuthGate>{children}</AuthGate>
      </body>
    </html>
  );
}
