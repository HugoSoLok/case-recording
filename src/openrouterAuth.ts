import { challengeS256, randomToken } from './pkce';
import type { Store } from './storage';

const AUTH_URL = 'https://openrouter.ai/auth';
const EXCHANGE_URL = 'https://openrouter.ai/api/v1/auth/keys';
const PENDING_KEY = 'cr.oauth';
const KEY_LABEL = 'Case Recording';

export interface AuthEnv {
  store: Store;
  /** sessionStorage: holds the PKCE verifier only for the redirect round trip. */
  session: Storage;
  fetch: typeof fetch;
  /** Current page URL, including any query string. */
  href: string;
  navigate: (url: string) => void;
  replaceUrl: (url: string) => void;
}

export type CallbackResult =
  | { status: 'none' }
  | { status: 'connected' }
  | { status: 'denied' }
  | { status: 'error'; message: string };

function appUrl(href: string): string {
  const u = new URL(href);
  return u.origin + u.pathname;
}

export async function startConnect(env: AuthEnv): Promise<void> {
  const verifier = randomToken();
  const state = randomToken(16);
  env.session.setItem(PENDING_KEY, JSON.stringify({ verifier, state }));
  const params = new URLSearchParams({
    callback_url: appUrl(env.href),
    code_challenge: await challengeS256(verifier),
    code_challenge_method: 'S256',
    key_label: KEY_LABEL,
    state,
  });
  env.navigate(`${AUTH_URL}?${params}`);
}

/** Completes the OAuth round trip if the current URL is a return from OpenRouter. */
export async function handleCallback(env: AuthEnv): Promise<CallbackResult> {
  const raw = env.session.getItem(PENDING_KEY);
  const url = new URL(env.href);
  const code = url.searchParams.get('code');
  if (raw === null) return { status: 'none' };

  env.session.removeItem(PENDING_KEY);
  env.replaceUrl(appUrl(env.href));

  // Back at the app without a code means the user did not finish authorizing.
  if (!code) return { status: 'denied' };

  let pending: { verifier: string; state: string };
  try {
    pending = JSON.parse(raw);
  } catch {
    return { status: 'error', message: 'Connection state was lost. Please try again.' };
  }
  if (url.searchParams.get('state') !== pending.state) {
    return { status: 'error', message: 'Connection response did not match the request. Please try again.' };
  }

  try {
    const res = await env.fetch(EXCHANGE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        code_verifier: pending.verifier,
        code_challenge_method: 'S256',
      }),
    });
    if (!res.ok) {
      return { status: 'error', message: `OpenRouter did not issue a key (HTTP ${res.status}). Please try again.` };
    }
    const body = (await res.json()) as { key?: unknown };
    if (typeof body.key !== 'string' || !body.key) {
      return { status: 'error', message: 'OpenRouter returned no key. Please try again.' };
    }
    env.store.setApiKey(body.key);
    return { status: 'connected' };
  } catch {
    return { status: 'error', message: 'Could not reach OpenRouter. Check your connection and try again.' };
  }
}
