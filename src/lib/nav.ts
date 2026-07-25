/**
 * Single source of truth for the site information architecture.
 *
 * `mainNav` is the 16-item primary navigation required by FR-WEB-1. Labels are
 * message keys under the `nav` namespace so Nav and Footer stay in sync and the
 * count stays auditable against the brief.
 */
export type NavLink = { href: string; key: string };
export type NavGroup = { key: string; items: NavLink[] };

export const mainNav: NavGroup[] = [
  {
    key: 'platform',
    items: [
      { href: '/how-it-works', key: 'howItWorks' },
      { href: '/verification', key: 'verification' },
      { href: '/custody', key: 'custody' },
      { href: '/proof-of-reserves', key: 'por' },
    ],
  },
  {
    key: 'assets',
    items: [
      { href: '/industrial-metal-assets', key: 'assets' },
      { href: '/copper-powder', key: 'copper' },
      { href: '/nickel-wire', key: 'nickel' },
      { href: '/registry', key: 'registry' },
      { href: '/passport/DAP-0001', key: 'passport' },
    ],
  },
  {
    key: 'token',
    items: [
      { href: '/tokenization', key: 'tokenization' },
      { href: '/redemption', key: 'redemption' },
      { href: '/legal-structure', key: 'legalStructure' },
    ],
  },
  {
    key: 'engage',
    items: [
      { href: '/enterprise', key: 'enterprise' },
      { href: '/documents', key: 'documents' },
      { href: '/contact', key: 'contact' },
    ],
  },
];

/** Home plus every grouped link — asserted against the brief's count of 16. */
export const mainNavCount = 1 + mainNav.reduce((n, g) => n + g.items.length, 0);

export const companyNav: NavLink[] = [
  { href: '/about', key: 'about' },
  { href: '/corporate-status', key: 'corporateStatus' },
  { href: '/roadmap', key: 'roadmap' },
  { href: '/governance', key: 'governance' },
  { href: '/faq', key: 'faq' },
];

export const engageNav: NavLink[] = [
  { href: '/waitlist', key: 'waitlist' },
  { href: '/enterprise', key: 'enterprise' },
  { href: '/asset-owner-enquiries', key: 'assetOwner' },
  { href: '/industrial-buyer-enquiries', key: 'industrialBuyer' },
];

export const legalNav: NavLink[] = [
  { href: '/privacy', key: 'privacy' },
  { href: '/cookie', key: 'cookie' },
  { href: '/terms', key: 'terms' },
  { href: '/risk-disclosure', key: 'risk' },
  { href: '/restricted-jurisdictions', key: 'restricted' },
  { href: '/anti-fraud', key: 'antiFraud' },
  { href: '/official-channels', key: 'officialChannels' },
];
