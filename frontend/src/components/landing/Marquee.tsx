const PLATFORMS = [
  'CHATGPT',
  'PERPLEXITY',
  'GOOGLE AI OVERVIEWS',
  'GEMINI',
  'COPILOT',
  'CLAUDE',
];

export default function Marquee() {
  const row = (
    <div className="flex shrink-0 items-center gap-11 pr-11">
      {PLATFORMS.map((p, i) => (
        <span key={p} className="flex items-center gap-11">
          <span className="whitespace-nowrap font-display text-[13px] font-semibold tracking-[0.06em] text-white/40">
            {p}
          </span>
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ background: i % 2 === 0 ? '#F3124E' : '#00D4FF' }}
          />
        </span>
      ))}
    </div>
  );

  return (
    <div
      className="relative z-[5] overflow-hidden border-y border-white/[0.06] bg-[rgba(12,18,34,.55)] py-4"
      style={{
        maskImage:
          'linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent)',
        WebkitMaskImage:
          'linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent)',
      }}
    >
      <div className="flex w-max animate-[owMarquee_30s_linear_infinite]">
        {row}
        <div aria-hidden="true" className="flex">
          {row}
        </div>
      </div>
    </div>
  );
}
