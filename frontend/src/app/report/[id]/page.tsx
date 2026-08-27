import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import ReportDocument from '@/components/report/ReportDocument';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import type { AuditResult, AiAnalysis } from '@/types/audit';

export const metadata = { title: 'Your audit report — OrbitScanner' };

/**
 * Renders a stored report. The full audit payload lives in audit_reports.raw_data,
 * written by the Python service, so we read rather than recompute.
 */
export default async function ReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // RLS restricts this to rows owned by the signed-in user.
  const { data, error } = await supabase
    .from('audit_reports')
    .select('id, raw_data, ai_insights')
    .eq('id', id)
    .single();

  if (error || !data?.raw_data) {
    notFound();
  }

  const result = data.raw_data as AuditResult;
  const ai: AiAnalysis | undefined = data.ai_insights
    ? { deep_analysis: data.ai_insights }
    : undefined;

  return (
    <>
      <SiteHeader signedIn />
      <main className="relative min-h-screen px-5 pb-20 pt-32 sm:px-6">
        <div
          className="pointer-events-none absolute left-1/2 top-0 h-[520px] w-[900px] max-w-[95vw] -translate-x-1/2 blur-3xl"
          style={{
            background:
              'radial-gradient(ellipse at 45% 25%, rgba(243,18,78,.10), transparent 62%), radial-gradient(ellipse at 60% 50%, rgba(243,18,78,.10), transparent 64%)',
          }}
        />
        <div className="relative z-10">
          <ReportDocument result={result} ai={ai} />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
