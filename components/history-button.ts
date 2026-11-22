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
      background: '#222',
      color: '#fff',
      fontFamily: 'sans-serif',
      fontSize: 14,
      textDecoration: 'none',
      border: '1px solid #555',
    },
  },
  'History'
);
