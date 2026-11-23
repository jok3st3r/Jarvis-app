/* eslint-disable */
import { createElement as h } from 'react';

export const historyButton = h(
  'a',
  {
    href: '/history',
    style: {
      position: 'fixed',
      bottom: 16,
      right: 16,
      zIndex: 60,
      padding: '10px 16px',
      borderRadius: 999,
      background: 'var(--card)',
      color: 'var(--foreground)',
      fontFamily: 'var(--font-public-sans), sans-serif',
      fontSize: 14,
      fontWeight: 600,
      textDecoration: 'none',
      border: '1px solid var(--border)',
      boxShadow: '0 4px 16px rgba(60, 40, 20, 0.10)',
    },
  },
  'History'
);
