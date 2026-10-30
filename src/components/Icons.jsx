import React from 'react';

const paths = {
  home: <><path d="m3 10 9-7 9 7" /><path d="M5 9v11h14V9M9 20v-6h6v6" /></>,
  work: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M8 5V3h8v2M3 10h18M10 10v2h4v-2" /></>,
  stack: <><path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="m3 12 9 5 9-5M3 16l9 5 9-5" /></>,
  experience: <><circle cx="12" cy="8" r="3" /><path d="M5 20a7 7 0 0 1 14 0" /></>,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m4 7 8 6 8-6" /></>,
  arrowUp: <><path d="M7 17 17 7M7 7h10v10" /></>,
  arrowRight: <><path d="M4 12h16M14 6l6 6-6 6" /></>,
  arrowDown: <><path d="M12 4v15M6 13l6 6 6-6" /></>,
  github: <><path d="M9 19c-4.5 1.4-4.5-2.5-6-3m12 6v-3.9a3.4 3.4 0 0 0-.9-2.6c3-.3 6.1-1.4 6.1-6.6A5.2 5.2 0 0 0 18.8 5a4.8 4.8 0 0 0-.1-3.6S17.6 1 15 2.8a13 13 0 0 0-6 0C6.4 1 5.3 1.4 5.3 1.4A4.8 4.8 0 0 0 5.2 5a5.2 5.2 0 0 0-1.4 3.9c0 5.2 3.1 6.3 6.1 6.6a3.4 3.4 0 0 0-.9 2.6V22" /></>,
  book: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v17H6.5A2.5 2.5 0 0 1 4 17.5v-12ZM4 17.5A2.5 2.5 0 0 1 6.5 15H20M8 7h8" /></>,
  terminal: <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="m7 9 3 3-3 3M12 15h5" /></>,
  video: <><rect x="3" y="5" width="13" height="14" rx="2" /><path d="m16 10 5-3v10l-5-3" /></>,
  diagram: <><rect x="3" y="3" width="6" height="6" rx="1" /><rect x="15" y="15" width="6" height="6" rx="1" /><rect x="3" y="15" width="6" height="6" rx="1" /><path d="M6 9v6M9 18h6M9 6h9v9" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>,
  moon: <path d="M20.8 13.3A8.5 8.5 0 0 1 10.7 3.2 8.5 8.5 0 1 0 20.8 13.3Z" />,
  menu: <><path d="M4 7h16M4 12h16M4 17h16" /></>
};

export function Icon({ name, className = '', size = 18 }) {
  return <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">{paths[name]}</svg>;
}
