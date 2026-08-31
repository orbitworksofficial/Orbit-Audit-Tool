import { CALENDLY_URL } from '@/lib/links';

/**
 * Books a strategy session.
 *
 * Every booking CTA on the site routes through this, so the URL is defined
 * once. Opens in a new tab: a visitor mid-report should not lose it to a
 * booking page.
 */
export default function BookCallButton({
  children = 'BOOK A FREE 30-MINUTE STRATEGY SESSION',
  variant = 'solid',
  className = '',
}: {
  children?: React.ReactNode;
  variant?: 'solid' | 'outline';
  className?: string;
}) {
  return (
    <a
      href={CALENDLY_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={`${variant === 'solid' ? 'ow-btn' : 'ow-btn-ghost'} ${className}`}
    >
      <span className="relative">{children}</span>
    </a>
  );
}
