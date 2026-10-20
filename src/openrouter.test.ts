import { describe, expect, it, vi } from 'vitest';
import { chat, listModels, OpenRouterError } from './openrouter';

const res = (status: number, body: unknown = {}) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

const call = (fetchImpl: () => Promise<Response>) =>
  chat({
    apiKey: 'k',
    model: 'm/x',
    messages: [{ role: 'user', content: 'hi' }],
    fetch: vi.fn(fetchImpl) as unknown as typeof fetch,
  });

describe('chat', () => {
  it('returns the message content and sends key and model', async () => {
    const f = vi.fn(async () => res(200, { choices: [{ message: { content: 'hello' } }] }));
    const out = await chat({ apiKey: 'sk-1', model: 'm/x', messages: [{ role: 'user', content: 'hi' }], fetch: f as unknown as typeof fetch });
    expect(out).toBe('hello');
    const [url, init] = f.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://openrouter.ai/api/v1/chat/completions');
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer sk-1');
    expect(JSON.parse(init.body as string).model).toBe('m/x');
  });

  it.each([
    [402, {}, 'credits'],
    [403, { error: { metadata: { limit_source: 'openrouter_key_limit' } } }, 'credits'],
    [401, {}, 'auth'],
    [429, {}, 'rate_limit'],
    [500, {}, 'other'],
  ])('maps HTTP %i to %s', async (status, body, kind) => {
    const err = await call(async () => res(status, body)).catch((e) => e);
    expect(err).toBeInstanceOf(OpenRouterError);
    expect(err.kind).toBe(kind);
  });

  it('gives each failure a distinct message', async () => {
    const msgs = await Promise.all(
      [402, 401, 429].map((s) => call(async () => res(s)).catch((e: OpenRouterError) => e.message)),
    );
    expect(new Set(msgs).size).toBe(3);
  });

  it('maps network failures and empty responses', async () => {
    const net = await call(async () => {
      throw new TypeError('x');
    }).catch((e) => e);
    expect(net.kind).toBe('network');
    const empty = await call(async () => res(200, { choices: [] })).catch((e) => e);
    expect(empty.kind).toBe('other');
  });
});

describe('listModels', () => {
  it('returns ids, and an empty list when the fetch fails', async () => {
    const ok = vi.fn(async () => res(200, { data: [{ id: 'a/b' }, { id: 'c/d' }] }));
    expect(await listModels(ok as unknown as typeof fetch)).toEqual(['a/b', 'c/d']);
    const bad = vi.fn(async () => {
      throw new Error('offline');
    });
    expect(await listModels(bad as unknown as typeof fetch)).toEqual([]);
    expect(await listModels((async () => res(500)) as unknown as typeof fetch)).toEqual([]);
  });
});
