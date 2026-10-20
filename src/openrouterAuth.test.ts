import { beforeEach, describe, expect, it, vi } from 'vitest';
import { handleCallback, startConnect, type AuthEnv } from './openrouterAuth';
import { createStore } from './storage';

const APP = 'https://me.github.io/case-recording/';

function makeEnv(href: string, fetchImpl?: typeof fetch) {
  const store = createStore(localStorage);
  const navigated: string[] = [];
  const replaced: string[] = [];
  const env: AuthEnv = {
    store,
    session: sessionStorage,
    fetch: fetchImpl ?? (vi.fn() as unknown as typeof fetch),
    href,
    navigate: (u) => navigated.push(u),
    replaceUrl: (u) => replaced.push(u),
  };
  return { env, store, navigated, replaced };
}

const jsonResponse = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

describe('startConnect', () => {
  it('redirects to OpenRouter with an S256 challenge, state and the app URL', async () => {
    const { env, navigated } = makeEnv(APP + '?x=1#h');
    await startConnect(env);
    const u = new URL(navigated[0]);
    expect(u.origin + u.pathname).toBe('https://openrouter.ai/auth');
    expect(u.searchParams.get('callback_url')).toBe(APP);
    expect(u.searchParams.get('code_challenge_method')).toBe('S256');
    expect(u.searchParams.get('code_challenge')).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(u.searchParams.get('state')).toBeTruthy();
    const pending = JSON.parse(sessionStorage.getItem('cr.oauth')!);
    expect(pending.state).toBe(u.searchParams.get('state'));
  });
});

describe('handleCallback', () => {
  async function begin() {
    const first = makeEnv(APP);
    await startConnect(first.env);
    return JSON.parse(sessionStorage.getItem('cr.oauth')!) as { verifier: string; state: string };
  }

  it('does nothing on a normal page load', async () => {
    const { env } = makeEnv(APP);
    expect(await handleCallback(env)).toEqual({ status: 'none' });
  });

  it('exchanges the code, stores the key and cleans the URL', async () => {
    const pending = await begin();
    const fetchMock = vi.fn(async () => jsonResponse(200, { key: 'sk-or-new' }));
    const { env, store, replaced } = makeEnv(`${APP}?code=abc&state=${pending.state}`, fetchMock as unknown as typeof fetch);

    expect(await handleCallback(env)).toEqual({ status: 'connected' });
    expect(store.getApiKey()).toBe('sk-or-new');
    expect(replaced).toEqual([APP]);
    expect(sessionStorage.getItem('cr.oauth')).toBeNull();

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://openrouter.ai/api/v1/auth/keys');
    expect(JSON.parse(init.body as string)).toEqual({
      code: 'abc',
      code_verifier: pending.verifier,
      code_challenge_method: 'S256',
    });
  });

  it('stays disconnected when the user returns without authorizing', async () => {
    await begin();
    const fetchMock = vi.fn();
    const { env, store } = makeEnv(APP, fetchMock as unknown as typeof fetch);
    expect(await handleCallback(env)).toEqual({ status: 'denied' });
    expect(store.getApiKey()).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects a state mismatch without calling OpenRouter', async () => {
    await begin();
    const fetchMock = vi.fn();
    const { env, store } = makeEnv(`${APP}?code=abc&state=wrong`, fetchMock as unknown as typeof fetch);
    const r = await handleCallback(env);
    expect(r.status).toBe('error');
    expect(store.getApiKey()).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('reports a failed exchange and stores nothing', async () => {
    const pending = await begin();
    const fetchMock = vi.fn(async () => jsonResponse(403, { error: 'bad' }));
    const { env, store } = makeEnv(`${APP}?code=abc&state=${pending.state}`, fetchMock as unknown as typeof fetch);
    const r = await handleCallback(env);
    expect(r).toMatchObject({ status: 'error' });
    expect(store.getApiKey()).toBeNull();
  });

  it('reports a network failure', async () => {
    const pending = await begin();
    const fetchMock = vi.fn(async () => {
      throw new TypeError('network');
    });
    const { env } = makeEnv(`${APP}?code=abc&state=${pending.state}`, fetchMock as unknown as typeof fetch);
    expect(await handleCallback(env)).toMatchObject({ status: 'error' });
  });

  it('ignores a stray code when no connection was started', async () => {
    const fetchMock = vi.fn();
    const { env } = makeEnv(`${APP}?code=abc&state=x`, fetchMock as unknown as typeof fetch);
    expect(await handleCallback(env)).toEqual({ status: 'none' });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
