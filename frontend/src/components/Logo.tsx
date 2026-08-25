import Image from 'next/image';
import Link from 'next/link';

/**
 * Orbit Works logo.
 *
 * The light variants are the ones with light-coloured artwork, so they are
 * what belongs on this dark canvas — the "-dark" files are for light
 * backgrounds.
 *
 * Source assets are 1259x238 (wordmark) and 540x540 (mark).
 */
export default function Logo({
  variant = 'wordmark',
  height = 26,
  href = '/',
  className = '',
}: {
  variant?: 'wordmark' | 'mark';
  height?: number;
  /** Pass null to render without a link (e.g. inside another anchor). */
  href?: string | null;
  className?: string;
}) {
  const isMark = variant === 'mark';
  const src = isMark ? '/orbitworks-mark.png' : '/orbitworks-light.png';
  const ratio = isMark ? 1 : 1259 / 238;
  const width = Math.round(height * ratio);

  const img = (
    <Image
      src={src}
      alt="Orbit Works"
      width={width}
      height={height}
      priority
      className={className}
      style={{ height, width: 'auto' }}
    />
  );

  if (!href) return img;

  return (
    <Link href={href} className="inline-flex shrink-0 items-center">
      {img}
    </Link>
  );
}
