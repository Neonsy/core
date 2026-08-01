import type { Metadata } from 'next';
import { Figtree, JetBrains_Mono, Source_Sans_3 } from 'next/font/google';
import { AppShell } from '@/components/AppShell';
import { Providers } from '@/components/Providers';
import { loadVersions } from '@/lib/api-docs';
import { buildSearchIndex } from '@/lib/search-index';
import { SITE_URL } from '@/lib/site';
import './globals.css';

const display = Figtree({ subsets: ['latin'], variable: '--font-display' });
const sans = Source_Sans_3({ subsets: ['latin'], variable: '--font-sans' });
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Fluxer.js — Discord-like bot library for Fluxer',
    template: '%s · Fluxer.js',
  },
  description:
    'Modern TypeScript SDK for building Fluxer bots. Guides, SDK reference, and REST docs for 2.0.',
  icons: { icon: '/favicon.svg' },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  const searchItems = buildSearchIndex();
  const { latest, versions } = loadVersions();
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${display.variable} ${sans.variable} ${mono.variable}`}>
      <body className="min-h-screen font-sans antialiased">
        <Providers>
          <AppShell searchItems={searchItems} latest={latest} versions={versions}>
            {children}
          </AppShell>
        </Providers>
      </body>
    </html>
  );
}
