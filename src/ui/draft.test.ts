import { beforeEach, describe, expect, it } from 'vitest';
import type { Store } from '../storage';
import { button, jsonResponse, setup } from './testHelpers';

const ok = (content: string) => async () => jsonResponse(200, { choices: [{ message: { content } }] });

function ready(store: Store, opts: { key?: boolean; template?: string } = {}) {
  if (opts.key ?? true) store.setApiKey('sk-test');
  store.setTemplate(opts.template ?? '# Background\n# Actions');
  const c = store.createCase('Case A');
  return c;
}

const keyArea = (root: HTMLElement) => root.querySelector<HTMLTextAreaElement>('textarea[aria-label="Chinese key points"]')!;
const draftArea = (root: HTMLElement) => root.querySelector<HTMLTextAreaElement>('textarea[aria-label="Draft record"]');
const openCase = (root: HTMLElement) => button(root, 'Case A (0 records)').click();
const chatCalls = (fetchMock: ReturnType<typeof setup>['fetchMock']) =>
  fetchMock.mock.calls.filter(([url]) => String(url).endsWith('/chat/completions'));
const body = (call: unknown[]) => JSON.parse((call[1] as RequestInit).body as string);

async function draft(root: HTMLElement, keyPoints = '今天家訪') {
  keyArea(root).value = keyPoints;
  button(root, 'Draft record').click();
}

beforeEach(() => localStorage.clear());

describe('drafting', () => {
  it('drafts from key points using template, rules and the key', async () => {
    const { root, fetchMock } = setup({
      fetchImpl: ok('Draft in English'),
      preset: (s) => {
        ready(s);
        s.setRules('Neutral tone');
      },
    });
    openCase(root);
    await draft(root);
    await expect.poll(() => draftArea(root)?.value).toBe('Draft in English');

    const [call] = chatCalls(fetchMock);
    const sent = body(call);
    const user = sent.messages[1].content as string;
    expect(user).toContain('# Background\n# Actions');
    expect(user).toContain('Neutral tone');
    expect(user).toContain('今天家訪');
    expect(((call[1] as RequestInit).headers as Record<string, string>).Authorization).toBe('Bearer sk-test');
  });

  it('empty key points do not contact OpenRouter', async () => {
    const { root, fetchMock } = setup({ fetchImpl: ok('x'), preset: (s) => void ready(s) });
    openCase(root);
    await draft(root, '   ');
    expect(chatCalls(fetchMock)).toHaveLength(0);
    expect(root.querySelector('[role=status]')?.textContent).toMatch(/key points/i);
  });

  it('is blocked without a template and says why', async () => {
    const { root, fetchMock } = setup({ fetchImpl: ok('x'), preset: (s) => void ready(s, { template: '  ' }) });
    openCase(root);
    await draft(root);
    expect(chatCalls(fetchMock)).toHaveLength(0);
    expect(root.querySelector('[role=status]')?.textContent).toMatch(/template/i);
  });

  it('is unavailable when not connected', () => {
    const { root, fetchMock } = setup({ preset: (s) => void ready(s, { key: false }) });
    openCase(root);
    expect(button(root, 'Draft record').disabled).toBe(true);
    expect(root.textContent).toContain('Not connected to OpenRouter');
    expect(chatCalls(fetchMock)).toHaveLength(0);
  });

  it('sends only the selected case records as context', async () => {
    const { root, fetchMock } = setup({
      fetchImpl: ok('d'),
      preset: (s) => {
        const a = ready(s);
        const b = s.createCase('Case B');
        s.saveRecord(a.id, { text: 'ALPHA-RECORD', keyPoints: '' });
        s.saveRecord(b.id, { text: 'BETA-RECORD', keyPoints: '' });
      },
    });
    button(root, 'Case A (1 record)').click();
    await draft(root);
    await expect.poll(() => chatCalls(fetchMock).length).toBe(1);
    const user = body(chatCalls(fetchMock)[0]).messages[1].content as string;
    expect(user).toContain('ALPHA-RECORD');
    expect(user).not.toContain('BETA-RECORD');
  });

  it('first record in a case drafts from key points, template and rules alone', async () => {
    const { root, fetchMock } = setup({ fetchImpl: ok('d'), preset: (s) => void ready(s) });
    openCase(root);
    await draft(root);
    await expect.poll(() => draftArea(root)?.value).toBe('d');
    expect(body(chatCalls(fetchMock)[0]).messages[1].content).not.toContain('Past records');
    expect(root.textContent).toContain('Used 0 of 0 past records');
  });
});

describe('draft review', () => {
  it('discarding adds no record; saving adds one with text and key points', async () => {
    const { root, store } = setup({ fetchImpl: ok('Draft one'), preset: (s) => void ready(s) });
    openCase(root);
    await draft(root);
    await expect.poll(() => draftArea(root)?.value).toBe('Draft one');
    button(root, 'Discard').click();
    expect(draftArea(root)).toBeNull();
    expect(store.getData().cases[0].records).toHaveLength(0);

    await draft(root);
    await expect.poll(() => draftArea(root)?.value).toBe('Draft one');
    draftArea(root)!.value = 'Edited draft';
    button(root, 'Save as record').click();
    const [rec] = store.getData().cases[0].records;
    expect(rec.text).toBe('Edited draft');
    expect(rec.keyPoints).toBe('今天家訪');
    expect(root.querySelector('.record .text')?.textContent).toBe('Edited draft');
  });

  it('regenerate replaces the shown draft without touching saved records', async () => {
    let n = 0;
    const { root, store } = setup({
      fetchImpl: async () => jsonResponse(200, { choices: [{ message: { content: `Draft ${++n}` } }] }),
      preset: (s) => {
        const c = ready(s);
        s.saveRecord(c.id, { text: 'kept', keyPoints: '' });
      },
    });
    button(root, 'Case A (1 record)').click();
    await draft(root);
    await expect.poll(() => draftArea(root)?.value).toBe('Draft 1');
    button(root, 'Regenerate').click();
    await expect.poll(() => draftArea(root)?.value).toBe('Draft 2');
    expect(store.getData().cases[0].records.map((r) => r.text)).toEqual(['kept']);
  });

  it('renders the draft as text, not HTML', async () => {
    const { root } = setup({ fetchImpl: ok('<img src=x onerror=alert(1)>'), preset: (s) => void ready(s) });
    openCase(root);
    await draft(root);
    await expect.poll(() => draftArea(root)?.value).toBe('<img src=x onerror=alert(1)>');
    expect(root.querySelector('img')).toBeNull();
  });
});

describe('personal data warning', () => {
  it('warns first, sends nothing until confirmed', async () => {
    const { root, fetchMock } = setup({ fetchImpl: ok('d'), preset: (s) => void ready(s) });
    openCase(root);
    await draft(root, '聯絡 someone@example.com');
    expect(root.textContent).toContain('email address');
    expect(chatCalls(fetchMock)).toHaveLength(0);

    button(root, 'Send anyway').click();
    await expect.poll(() => chatCalls(fetchMock).length).toBe(1);
  });

  it('cancel sends nothing', async () => {
    const { root, fetchMock } = setup({ fetchImpl: ok('d'), preset: (s) => void ready(s) });
    openCase(root);
    await draft(root, '電話 13812345678');
    expect(root.textContent).toContain('phone number');
    button(root, 'Cancel').click();
    expect(chatCalls(fetchMock)).toHaveLength(0);
    expect(root.textContent).not.toContain('Send anyway');
  });

  it('plain text is sent without a warning', async () => {
    const { root, fetchMock } = setup({ fetchImpl: ok('d'), preset: (s) => void ready(s) });
    openCase(root);
    await draft(root, '案主情緒穩定');
    await expect.poll(() => chatCalls(fetchMock).length).toBe(1);
    expect(root.textContent).not.toContain('Send anyway');
  });
});

describe('failures', () => {
  it('insufficient credits: message shown, key points kept, still connected', async () => {
    const { root, store } = setup({ fetchImpl: async () => jsonResponse(402), preset: (s) => void ready(s) });
    openCase(root);
    await draft(root, '重點內容');
    await expect.poll(() => root.querySelector('[role=status]')?.textContent).toMatch(/credits/i);
    expect(keyArea(root).value).toBe('重點內容');
    expect(store.getApiKey()).toBe('sk-test');
  });

  it('revoked key: marks disconnected, asks to connect again, keeps key points', async () => {
    const { root, store } = setup({ fetchImpl: async () => jsonResponse(401), preset: (s) => void ready(s) });
    openCase(root);
    await draft(root, '重點內容');
    await expect.poll(() => store.getApiKey()).toBeNull();
    expect(root.querySelector('[role=status]')?.textContent).toMatch(/connect/i);
    expect(root.textContent).toContain('Not connected to OpenRouter');
    expect(button(root, 'Draft record').disabled).toBe(true);
    expect(keyArea(root).value).toBe('重點內容');
  });

  it('rate limited: tells the user to retry and keeps key points', async () => {
    const { root } = setup({ fetchImpl: async () => jsonResponse(429), preset: (s) => void ready(s) });
    openCase(root);
    await draft(root, '重點內容');
    await expect.poll(() => root.querySelector('[role=status]')?.textContent).toMatch(/rate limit/i);
    expect(keyArea(root).value).toBe('重點內容');
    expect(button(root, 'Draft record').disabled).toBe(false);
  });
});
