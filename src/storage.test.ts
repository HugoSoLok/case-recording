import { beforeEach, describe, expect, it } from 'vitest';
import { createStore } from './storage';

let tick = 0;
const now = () => new Date(Date.UTC(2026, 0, 1, 0, 0, tick++)).toISOString();

beforeEach(() => {
  localStorage.clear();
  tick = 0;
});

describe('cases', () => {
  it('creates, renames and deletes a case', () => {
    const s = createStore(localStorage, now);
    const c = s.createCase('  Case A ');
    expect(s.getData().cases.map((x) => x.name)).toEqual(['Case A']);
    expect(c.records).toEqual([]);

    s.renameCase(c.id, 'Case B');
    expect(s.getCase(c.id)?.name).toBe('Case B');

    s.deleteCase(c.id);
    expect(s.getData().cases).toEqual([]);
  });

  it('rejects empty names', () => {
    const s = createStore(localStorage, now);
    expect(() => s.createCase('   ')).toThrow();
    const c = s.createCase('A');
    expect(() => s.renameCase(c.id, '')).toThrow();
  });

  it('deleting a case removes its records', () => {
    const s = createStore(localStorage, now);
    const c = s.createCase('A');
    s.saveRecord(c.id, { text: 'x', keyPoints: 'y' });
    s.deleteCase(c.id);
    expect(s.listRecords(c.id)).toEqual([]);
  });
});

describe('records', () => {
  it('saves a record with text, key points and date', () => {
    const s = createStore(localStorage, now);
    const c = s.createCase('A');
    const r = s.saveRecord(c.id, { text: 'English', keyPoints: '中文' });
    expect(r.text).toBe('English');
    expect(r.keyPoints).toBe('中文');
    expect(r.createdAt).toBe('2026-01-01T00:00:00.000Z');
    expect(s.listRecords(c.id)).toHaveLength(1);
  });

  it('lists records oldest first and edits replace text', () => {
    const s = createStore(localStorage, now);
    const c = s.createCase('A');
    const r1 = s.saveRecord(c.id, { text: 'one', keyPoints: '' });
    const r2 = s.saveRecord(c.id, { text: 'two', keyPoints: '' });
    expect(s.listRecords(c.id).map((r) => r.id)).toEqual([r1.id, r2.id]);

    s.updateRecord(c.id, r1.id, 'one edited');
    const list = s.listRecords(c.id);
    expect(list[0].text).toBe('one edited');
    expect(list[0].updatedAt > list[0].createdAt).toBe(true);
    expect(list.map((r) => r.id)).toEqual([r1.id, r2.id]);
  });
});

describe('persistence', () => {
  it('data survives a new store instance on the same storage', () => {
    const a = createStore(localStorage, now);
    const c = a.createCase('A');
    a.saveRecord(c.id, { text: 'x', keyPoints: 'y' });
    a.setTemplate('# T');
    a.setRules('be neutral');

    const b = createStore(localStorage, now);
    expect(b.getCase(c.id)?.records).toHaveLength(1);
    expect(b.getData().template).toBe('# T');
    expect(b.getData().rules).toBe('be neutral');
  });

  it('keeps API key and model outside the data blob', () => {
    const s = createStore(localStorage, now);
    s.setApiKey('sk-test');
    s.setModel('some/model');
    expect(localStorage.getItem('cr.data') ?? '').not.toContain('sk-test');
    expect(s.getApiKey()).toBe('sk-test');
    s.clearApiKey();
    expect(s.getApiKey()).toBeNull();
    expect(s.getModel()).toBe('some/model');
  });

  it('keeps unreadable data aside instead of silently destroying it', () => {
    localStorage.setItem('cr.data', '{broken');
    const s = createStore(localStorage, now);
    expect(s.getData().cases).toEqual([]);
    expect(localStorage.getItem('cr.data.corrupt')).toBe('{broken');
  });
});
