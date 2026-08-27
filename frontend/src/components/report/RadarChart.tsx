/**
 * Pentagon radar showing the AEO/GEO score.
 *
 * Inline SVG rather than a chart library: it is one static shape, and SVG
 * prints cleanly at any size, which a canvas-based chart does not.
 */
export default function RadarChart({
  score,
  size = 190,
}: {
  score: number;
  size?: number;
}) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.38;

  // Five points, starting at the top and going clockwise.
  const points = Array.from({ length: 5 }, (_, i) => {
    const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
    return { x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r };
  });

  const ring = (scale: number) =>
    points
      .map((p) => `${cx + (p.x - cx) * scale},${cy + (p.y - cy) * scale}`)
      .join(' ');

  const filled = Math.max(0.06, Math.min(1, score / 100));

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-label={`AEO and GEO score ${score} out of 100`}
    >
      {/* Grid rings */}
      {[1, 0.75, 0.5, 0.25].map((s) => (
        <polygon
          key={s}
          points={ring(s)}
          fill="none"
          stroke="rgba(243,18,78,0.16)"
          strokeWidth="1"
        />
      ))}

      {/* Spokes */}
      {points.map((p, i) => (
        <line
          key={i}
          x1={cx}
          y1={cy}
          x2={p.x}
          y2={p.y}
          stroke="rgba(243,18,78,0.16)"
          strokeWidth="1"
        />
      ))}

      {/* The score itself */}
      <polygon
        points={ring(filled)}
        fill="rgba(243,18,78,0.22)"
        stroke="#f3124e"
        strokeWidth="1.5"
      />

      <text
        x={cx}
        y={cy - 2}
        textAnchor="middle"
        fill="#fff"
        fontSize={size * 0.19}
        fontWeight="800"
        letterSpacing="-2"
      >
        {Math.round(score)}
      </text>
      <text
        x={cx}
        y={cy + size * 0.11}
        textAnchor="middle"
        fill="#9aa8bf"
        fontSize={size * 0.065}
      >
        /100
      </text>
    </svg>
  );
}
