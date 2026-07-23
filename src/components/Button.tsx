import { ReactNode } from 'react';
import { Link } from '@/i18n/routing';

type Variant = 'primary' | 'ghost' | 'outline';
const styles: Record<Variant, string> = {
  primary: 'bg-copper text-white hover:brightness-110 border border-copper',
  ghost: 'bg-surface text-text border border-border hover:border-copper',
  outline: 'bg-transparent text-copper border border-copper hover:bg-copper/10',
};

export function Button({ href, children, variant = 'primary' }: { href: string; children: ReactNode; variant?: Variant }) {
  return (
    <Link href={href} className={`inline-flex items-center justify-center rounded-lg px-5 py-2.5 text-sm font-medium transition ${styles[variant]}`}>
      {children}
    </Link>
  );
}
