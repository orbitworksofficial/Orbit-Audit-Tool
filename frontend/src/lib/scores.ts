/**
 * Score presentation helpers. Colour thresholds come from the production brief
 * (frontend spec): green above 70, amber 40-70, red below 40.
 */

export type ScoreBand = 'strong' | 'moderate' | 'weak';

export function scoreBand(score: number): ScoreBand {
  if (score > 70) return 'strong';
  if (score >= 40) return 'moderate';
  return 'weak';
}

export function scoreColor(score: number): string {
  const band = scoreBand(score);
  if (band === 'strong') return '#10B981';
  if (band === 'moderate') return '#F5A524';
  return '#F3124E';
}

export function scoreLabel(score: number): string {
  const band = scoreBand(score);
  if (band === 'strong') return 'Strong';
  if (band === 'moderate') return 'Needs work';
  return 'Critical';
}

/**
 * Section weights from the brief: AEO/GEO carries 50%, the other five split
 * the remaining 50% evenly. Python already applies this when computing
 * overall_score; we duplicate it only for display of per-section weight.
 */
export const SECTION_WEIGHTS = {
  aeo_geo: 0.5,
  website_health: 0.1,
  seo: 0.1,
  reputation: 0.1,
  competitors: 0.1,
  social: 0.1,
} as const;
