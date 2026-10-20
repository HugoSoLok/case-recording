import { beforeEach, describe, expect, it } from 'vitest';
import { createStore } from './storage';
import { buildExport, hasData, importData } from './transfer';

beforeEach(() => localStorage.clear());

function seed() {
  const s = createStore(localStorage);
  const c = s.createCase('A');
  s.saveRecord(c.id, { text: 'one', keyPoints: '一' });
  s.setTemplate('# T');
  s.setRules('R');
  s.setApiKey('sk-secret');
  s.setModel('m/x');
  return { s, c };
}

describe('export', () => {
  it('contains cases, records, template and rules but never the key or model', () => {
    const { s } = seed();
    const file = buildExport(s);
    const json = JSON.stringify(file);
    expect(file.cases).toHaveLength(1);
    expect(file.cases[0].records).toHaveLength(1);
    expect(file.template).toBe('# T');
    expect(file.rules).toBe('R');
    expect(json).not.toContain('sk-secret');
    expect(json).not.toContain('m/x');
  });

  it('round trip restores identical data', () => {
    const { s } = seed();
    const before = s.getData();
    const json = JSON.stringify(buildExport(s));

    localStorage.clear();
    const fresh = createStore(localStorage);
    expect(hasData(fresh)).toBe(false);
    expect(importData(fresh, json, 'replace')).toEqual({ ok: true });
    const after = fresh.getData();
    expect(after.cases).toEqual(before.cases);
    expect(after.template).toBe(before.template);
    expect(after.rules).toBe(before.rules);
  });
});

describe('import', () => {
  it('invalid files leave existing data unchanged', () => {
    const { s } = seed();
    const before = JSON.stringify(s.getData());
    for (const bad of ['not json', '{}', '{"app":"case-recording","version":99}', '{"app":"other"}']) {
      const r = importData(s, bad, 'replace');
      expect(r.ok).toBe(false);
    }
    expect(JSON.stringify(s.getData())).toBe(before);
  });

  it('replace discards current cases', () => {
    const { s } = seed();
    const other = createStore(localStorage);
    const exported = JSON.stringify({
      ...buildExport(other),
      cases: [{ id: 'z', name: 'Z', records: [] }],
      template: 'new',
      rules: '',
    });
    expect(importData(s, exported, 'replace')).toEqual({ ok: true });
    expect(s.getData().cases.map((c) => c.name)).toEqual(['Z']);
    expect(s.getData().template).toBe('new');
  });

  it('merge keeps current cases, adds new ones and new records', () => {
    const { s, c } = seed();
    const incoming = JSON.stringify({
      ...buildExport(s),
      cases: [
        {
          id: c.id,
          name: 'A',
          records: [
            { id: 'r-new', text: 'two', keyPoints: '', createdAt: '2030-01-01T00:00:00.000Z', updatedAt: '2030-01-01T00:00:00.000Z' },
          ],
        },
        { id: 'z', name: 'Z', records: [] },
      ],
      template: 'incoming template',
      rules: 'incoming rules',
    });
    expect(importData(s, incoming, 'merge')).toEqual({ ok: true });
    const d = s.getData();
    expect(d.cases.map((x) => x.name)).toEqual(['A', 'Z']);
    expect(d.cases[0].records.map((r) => r.text)).toEqual(['one', 'two']);
    expect(d.template).toBe('# T');
    expect(d.rules).toBe('R');
  });

  it('keeps the API key and model on import', () => {
    const { s } = seed();
    importData(s, JSON.stringify(buildExport(s)), 'replace');
    expect(s.getApiKey()).toBe('sk-secret');
    expect(s.getModel()).toBe('m/x');
  });
});
