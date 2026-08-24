import type { AuditRequestPayload, AuditResponse } from '@/types/audit';

/**
 * Thin client for the Python FastAPI audit service.
 *
 * All heavy lifting — the six analysis modules, orchestration, Claude/Groq
 * analysis and PDF rendering — stays in Python. Next.js only forwards
 * requests and handles auth/quota around them.
 */

const BASE = process.env.PYTHON_API_URL ?? 'http://localhost:8000';

/** A full audit takes 30-60s of live API calls, so the timeout is generous. */
const AUDIT_TIMEOUT_MS = 180_000;

export class PythonApiError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
    this.name = 'PythonApiError';
  }
}

export async function runAudit(
  payload: AuditRequestPayload
): Promise<AuditResponse> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), AUDIT_TIMEOUT_MS);

  try {
    const res = await fetch(`${BASE}/api/audit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
      cache: 'no-store',
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      throw new PythonApiError(
        detail || `Audit service returned ${res.status}`,
        res.status
      );
    }

    return (await res.json()) as AuditResponse;
  } catch (err) {
    if (err instanceof PythonApiError) throw err;
    if (err instanceof Error && err.name === 'AbortError') {
      throw new PythonApiError('The audit timed out. Please try again.', 504);
    }
    throw new PythonApiError(
      'Could not reach the audit service. Is the Python API running?',
      503
    );
  } finally {
    clearTimeout(timer);
  }
}

/** URL for the Python-rendered PDF of a stored report. */
export function pdfDownloadUrl(rowId: string): string {
  return `${BASE}/api/download-pdf/${rowId}`;
}
