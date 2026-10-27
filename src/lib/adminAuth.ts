/**
 * adminAuth.ts — Client-side admin authentication helpers
 *
 * Token storage strategy:
 *   - Stored in localStorage (survives page refresh, back-nav, and tab close/reopen).
 *   - Sent as "Authorization: Bearer <token>" on every mutating request so that
 *     it works through the Next.js→Express rewrite proxy (httpOnly cookies from
 *     the upstream Express server are not reliably forwarded by the proxy in dev).
 *   - The httpOnly cookie is still set by the Express backend on login, which
 *     serves as a second layer for production (Vercel→Render, same-site is "none").
 *
 * Draft persistence strategy:
 *   - Before redirecting to /admin/login on 401, the caller saves its unsaved
 *     form state to sessionStorage under "insertix_admin_draft".
 *   - After login, /admin/login reads the returnTab param from the URL and the
 *     admin page restores the draft automatically.
 */

const TOKEN_KEY = "insertix_admin_token";
const DRAFT_KEY = "insertix_admin_draft";
const RETURN_TAB_KEY = "insertix_admin_return_tab";

// ─── Token helpers ────────────────────────────────────────────────────────────

export function storeAdminToken(token: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
}

export function getAdminToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function clearAdminToken() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
}

export function getAuthHeader(): Record<string, string> {
  const token = getAdminToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ─── Draft (unsaved form data) helpers ───────────────────────────────────────

export function saveDraft(tab: string, data: unknown) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ tab, data, savedAt: Date.now() }));
  sessionStorage.setItem(RETURN_TAB_KEY, tab);
}

export function loadDraft(): { tab: string; data: unknown; savedAt: number } | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(DRAFT_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    // Drafts older than 30 minutes are discarded
    if (Date.now() - parsed.savedAt > 30 * 60 * 1000) {
      clearDraft();
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearDraft() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(DRAFT_KEY);
  sessionStorage.removeItem(RETURN_TAB_KEY);
}

export function getReturnTab(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(RETURN_TAB_KEY);
}

// ─── authFetch — drop-in fetch wrapper with auth + 401 handling ───────────────

type AuthFetchOptions = RequestInit & {
  /** Called with draft data just before redirecting on 401 so caller can save form state */
  onSessionExpired?: () => void;
};

/**
 * Wraps fetch() with:
 *  1. Automatic "Authorization: Bearer <token>" header injection
 *  2. On 401 → shows a non-blocking toast, calls onSessionExpired() for draft
 *     saving, clears the token, and redirects to /admin/login
 *  3. Merges Content-Type only if not already set (FormData must NOT set it)
 */
export async function authFetch(
  url: string,
  options: AuthFetchOptions = {}
): Promise<Response> {
  const { onSessionExpired, headers: extraHeaders, ...rest } = options;

  // Merge auth header — don't clobber existing headers
  const headers: Record<string, string> = {
    ...(extraHeaders as Record<string, string>),
    ...getAuthHeader(),
  };

  const res = await fetch(url, { ...rest, headers });

  if (res.status === 401) {
    // Save draft if caller provided a hook
    if (typeof onSessionExpired === "function") {
      onSessionExpired();
    }

    clearAdminToken();

    // Show non-blocking toast then redirect
    showSessionExpiredToast();
    setTimeout(() => {
      window.location.href = "/admin/login";
    }, 2000);

    // Return the response so callers can still inspect it if needed
    return res;
  }

  return res;
}

// ─── Session-expired toast (no React dependency) ──────────────────────────────

let toastEl: HTMLElement | null = null;

function showSessionExpiredToast() {
  if (typeof document === "undefined") return;
  if (toastEl) return; // already showing

  toastEl = document.createElement("div");
  toastEl.style.cssText = [
    "position:fixed",
    "bottom:24px",
    "left:50%",
    "transform:translateX(-50%)",
    "z-index:9999",
    "background:#D40000",
    "color:#fff",
    "font-family:system-ui,sans-serif",
    "font-size:13px",
    "font-weight:600",
    "padding:12px 24px",
    "border-radius:999px",
    "box-shadow:0 4px 20px rgba(0,0,0,0.3)",
    "white-space:nowrap",
    "pointer-events:none",
  ].join(";");
  toastEl.textContent = "Session expired — redirecting to login…";
  document.body.appendChild(toastEl);

  setTimeout(() => {
    toastEl?.remove();
    toastEl = null;
  }, 3000);
}
