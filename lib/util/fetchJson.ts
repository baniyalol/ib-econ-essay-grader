/**
 * Fetch that tolerates non-JSON error responses.
 *
 * Why this exists: Vercel (and most edge gateways) return an HTML error page
 * when a serverless function times out or crashes before it can respond. Our
 * frontend used to `res.json()` that HTML and throw "Unexpected token 'A'"
 * (the HTML starts with "An error occurred…"). This helper gives a clean,
 * user-friendly error instead.
 */

export interface FetchJsonOk<T> {
  ok: true;
  data: T;
  status: number;
}

export interface FetchJsonErr {
  ok: false;
  error: string;
  status: number;
}

export type FetchJsonResult<T> = FetchJsonOk<T> | FetchJsonErr;

export async function fetchJson<T>(
  url: string,
  init: RequestInit,
): Promise<FetchJsonResult<T>> {
  let res: Response;
  try {
    res = await fetch(url, init);
  } catch (err) {
    return {
      ok: false,
      status: 0,
      error:
        err instanceof Error
          ? `Network error: ${err.message}`
          : "Network error.",
    };
  }

  const text = await res.text();
  let parsed: unknown = null;
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      // not JSON — likely a gateway error page
    }
  }

  if (!res.ok) {
    const err =
      (parsed as { error?: string })?.error ||
      gatewayHint(res.status) ||
      truncate(text) ||
      `Request failed with status ${res.status}.`;
    return { ok: false, status: res.status, error: err };
  }

  if (parsed == null) {
    return {
      ok: false,
      status: res.status,
      error:
        "Server returned an unexpected response. This usually means the request timed out at the edge — try again, or turn off Deep Analysis.",
    };
  }

  return { ok: true, status: res.status, data: parsed as T };
}

function gatewayHint(status: number): string | null {
  if (status === 504 || status === 408) {
    return "The grader timed out at the gateway. Try again, or turn off Deep Analysis (doubles the work) and retry.";
  }
  if (status === 502) {
    return "Bad gateway response. The model likely returned invalid output — try again; a shorter essay or a different provider usually helps.";
  }
  if (status === 503) {
    return "Server is temporarily unavailable. Try again in a moment.";
  }
  return null;
}

function truncate(s: string): string {
  if (!s) return "";
  const trimmed = s.trim();
  return trimmed.length > 200 ? `${trimmed.slice(0, 200)}…` : trimmed;
}
