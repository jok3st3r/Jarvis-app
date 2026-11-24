/* eslint-disable */
import { createElement as h } from 'react';
import { Fraunces, Public_Sans } from 'next/font/google';
import localFont from 'next/font/local';
import { ThemeProvider } from '@/components/app/theme-provider';
import { ThemeToggle } from '@/components/app/theme-toggle';
import { historyButton } from '@/components/history-button';
import { cn } from '@/lib/shadcn/utils';
import '@/styles/globals.css';

const publicSans = Public_Sans({
  variable: '--font-public-sans',
  subsets: ['latin'],
});

const fraunces = Fraunces({
  variable: '--font-fraunces',
  subsets: ['latin'],
});

const commitMono = localFont({
  display: 'swap',
  variable: '--font-commit-mono',
  src: [
    { path: '../fonts/CommitMono-400-Regular.otf', weight: '400', style: 'normal' },
    { path: '../fonts/CommitMono-700-Regular.otf', weight: '700', style: 'normal' },
    { path: '../fonts/CommitMono-400-Italic.otf', weight: '400', style: 'italic' },
    { path: '../fonts/CommitMono-700-Italic.otf', weight: '700', style: 'italic' },
  ],
});

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return h(
    'html',
    {
      lang: 'en',
      suppressHydrationWarning: true,
      className: cn(
        publicSans.variable,
        fraunces.variable,
        commitMono.variable,
        'scroll-smooth font-sans antialiased'
      ),
    },
    h(
      'head',
      null,
      h('title', null, 'Jarvis'),
      h('meta', { name: 'description', content: 'Jarvis voice assistant' }),
      h('meta', { name: 'theme-color', content: '#f4eee5' }),
      h('link', { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' }),
      h('link', { rel: 'icon', type: 'image/png', sizes: '192x192', href: '/icon-192.png' }),
      h('link', { rel: 'manifest', href: '/manifest.webmanifest' }),
      h('meta', { name: 'apple-mobile-web-app-title', content: 'Jarvis' }),
      h('meta', { name: 'apple-mobile-web-app-capable', content: 'yes' })
    ),
    h(
      'body',
      { className: 'overflow-x-hidden' },
      h(
        ThemeProvider as any,
        {
          attribute: 'class',
          defaultTheme: 'system',
          enableSystem: true,
          disableTransitionOnChange: true,
        },
        children,
        historyButton,
        h(
          'div',
          { className: 'group fixed bottom-0 left-1/2 z-50 mb-2 -translate-x-1/2' },
          h(ThemeToggle as any, {
            className:
              'translate-y-20 transition-transform delay-150 duration-300 group-hover:translate-y-0',
          })
        )
      )
    )
  );
}
