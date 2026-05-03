// =============================================================================
// MaaSwara — Root Layout
// Sets up fonts (Fraunces, Inter, JetBrains Mono), metadata, and global styles.
// =============================================================================

import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-jetbrains-mono',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'MaaSwara — A mother\'s voice, in her own voice',
  description:
    'Voice-first antenatal danger-sign triage for pregnant women in low-literacy regions. Supports Hindi, Swahili, Yoruba, English, Bhojpuri, and Hausa.',
  keywords: [
    'maternal health',
    'antenatal care',
    'pregnancy triage',
    'WHO danger signs',
    'voice-first',
    'multilingual health',
    'SDG 3',
    'GNEC',
  ],
  openGraph: {
    title: 'MaaSwara — A mother\'s voice, in her own voice',
    description:
      'Voice-first antenatal danger-sign triage in regional dialects. Three channels, three AI models, one shared triage engine.',
    type: 'website',
    locale: 'en_US',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <head>
        {/* Fraunces from Google Fonts — loaded via link tag since next/font
            doesn't support all variable font axes Fraunces uses */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..900;1,9..144,300..900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className="min-h-full flex flex-col"
        style={{ fontFamily: 'var(--font-inter), Inter, system-ui, sans-serif' }}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
