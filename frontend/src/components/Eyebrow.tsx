/**
 * Section eyebrow: mono, 10px, wide tracking, accent, numbered sequentially.
 * Every section opens with one.
 */
export default function Eyebrow({
  index,
  children,
}: {
  /** Sequential section number, e.g. 2 renders as "02 /". */
  index?: number;
  children: React.ReactNode;
}) {
  return (
    <span className="ow-eyebrow">
      {index !== undefined && (
        <span className="text-white/40">
          {String(index).padStart(2, '0')} /
        </span>
      )}
      {children}
    </span>
  );
}
