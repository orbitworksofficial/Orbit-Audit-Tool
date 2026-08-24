/**
 * Mirrors the Python orchestrator's return shape exactly.
 * Source of truth: orchestrator.py -> run_audit_orchestrator()
 *                  ai_analysis.py  -> generate_ai_analysis()
 * Do not add fields here that Python does not actually emit.
 */

export interface Module1AeoGeo {
  schema_score: number;
  aeo_score: number;
  geo_score: number;
  combined_score: number;
  schema_signals: Record<string, unknown>;
  perplexity_appearances: number;
  google_ai_overview_appearances: number;
  competitor_names_appearing_instead: string[];
  queries_tested: string[];
}

export interface Module2WebsiteHealth {
  website_score: number;
  performance: number;
  accessibility: number;
  best_practices: number;
  seo: number;
  lcp: number;
  fid: number;
  cls: number;
  mobile_score: number;
  desktop_score: number;
  top_3_issues: string[];
}

export interface Module3Seo {
  seo_score: number;
  domain_authority: number;
  organic_traffic_estimate: number;
  backlink_count: number;
  top_keywords: unknown[];
  top_3_seo_gaps: string[];
}

export interface Module4Reputation {
  reputation_score: number;
  star_rating: number;
  review_count: number;
  profile_completeness: number;
  sentiment_summary: string;
  top_2_gaps: string[];
}

export interface CompetitorMetric {
  domain_authority: number;
  traffic: number;
  backlinks: number;
}

export interface Module5Competitors {
  competitor_score: number;
  competitor_names: string[];
  competitor_metrics: Record<string, CompetitorMetric>;
  metrics_comparison: {
    average_domain_authority: number;
    business_domain_authority: number;
    average_traffic: number;
    business_traffic: number;
    average_backlinks: number;
    business_backlinks: number;
  };
  where_ahead: string[];
  where_behind: string[];
  data_source: string;
}

export interface Module6Social {
  social_score: number;
  platforms_found: string[];
  platforms_missing: string[];
  activity_level: string;
}

export interface AuditResult {
  business_name: string;
  website_url: string;
  location: string;
  overall_score: number;
  module1_aeo_geo: Module1AeoGeo;
  module2_website_health: Module2WebsiteHealth;
  module3_seo: Module3Seo;
  module4_reputation: Module4Reputation;
  module5_competitors: Module5Competitors;
  module6_social: Module6Social;
}

export interface DeepAnalysis {
  section_insights: Record<string, string>;
  critical_gaps: string[];
  overall_summary: string;
}

export interface AiAnalysis {
  deep_analysis: DeepAnalysis;
}

/** Response envelope from POST /api/audit on the Python service. */
export interface AuditResponse {
  status: string;
  result: AuditResult;
  ai_analysis: AiAnalysis;
}

export interface AuditRequestPayload {
  url: string;
  full_name: string;
  business_name: string;
  city?: string;
  country?: string;
  category?: string;
  email?: string;
  whatsapp?: string;
}
