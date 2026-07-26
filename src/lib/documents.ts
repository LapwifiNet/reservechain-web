/**
 * Document centre index (FR-DOC).
 *
 * `href` is set only where a published document actually exists on the site.
 * Everything else renders as a status row with no download control, because the
 * brief forbids inactive or fake download buttons that imply a document is
 * available when it is not.
 */
export type DocState = 'published' | 'preparation' | 'pending';

export type DocEntry = { key: string; state: DocState; href?: string };

export const documentIndex: { group: string; items: DocEntry[] }[] = [
  {
    group: 'corporate',
    items: [
      { key: 'overview', state: 'preparation' },
      { key: 'corporateStatus', state: 'published', href: '/corporate-status' },
      { key: 'governance', state: 'published', href: '/governance' },
      { key: 'roadmap', state: 'published', href: '/roadmap' },
    ],
  },
  {
    group: 'token',
    items: [
      { key: 'whitepaper', state: 'preparation' },
      { key: 'tokenTerms', state: 'preparation' },
      { key: 'smartContract', state: 'preparation' },
      { key: 'audit', state: 'pending' },
    ],
  },
  {
    group: 'asset',
    items: [
      { key: 'copperReport', state: 'pending' },
      { key: 'nickelReport', state: 'pending' },
      { key: 'coa', state: 'pending' },
      { key: 'ownership', state: 'pending' },
      { key: 'valuation', state: 'pending' },
      { key: 'custody', state: 'pending' },
      { key: 'insurance', state: 'pending' },
      { key: 'por', state: 'pending' },
      { key: 'redemption', state: 'pending' },
    ],
  },
  {
    group: 'legal',
    items: [
      { key: 'risk', state: 'published', href: '/risk-disclosure' },
      { key: 'jurisdiction', state: 'published', href: '/restricted-jurisdictions' },
      { key: 'privacy', state: 'published', href: '/privacy' },
      { key: 'cookie', state: 'published', href: '/cookie' },
      { key: 'terms', state: 'published', href: '/terms' },
      { key: 'antiFraud', state: 'published', href: '/anti-fraud' },
      { key: 'materialEvents', state: 'preparation' },
    ],
  },
];
