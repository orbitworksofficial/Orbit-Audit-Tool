const PLATFORMS = [
  'CHATGPT',
  'PERPLEXITY',
  'GOOGLE AI OVERVIEWS',
  'GEMINI',
  'COPILOT',
  'CLAUDE',
];

/**
 * Full-bleed accent bar, white mono text, scrolling with diamond separators.
 * The track is duplicated so the -50% translate loops seamlessly.
 */
export default function Ticker() {
  const row = (
    <div className="flex shrink-0 items-center">
      {PLATFORMS.map((p) => (
        <span key={p} className="ow-ticker-item">
          {p}
          <span className="pl-10 opacity-60">&#10022;</span>
        </span>
      ))}
    </div>
  );

  return (
    <div className="ow-ticker relative z-[5]">
      <div className="ow-ticker-track">
        {row}
        <div aria-hidden="true" className="flex shrink-0 items-center">
          {PLATFORMS.map((p) => (
            <span key={p} className="ow-ticker-item">
              {p}
              <span className="pl-10 opacity-60">&#10022;</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
