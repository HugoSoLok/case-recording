import { describe, expect, it } from 'vitest';
import { buildPrompt } from './prompt';

const rec = (day: string, text: string) => ({ createdAt: `2026-01-${day}T00:00:00.000Z`, text });
const userText = (p: ReturnType<typeof buildPrompt>) => p.messages[1].content;

describe('buildPrompt', () => {
  it('includes template, rules, key points and past records in order', () => {
    const p = buildPrompt({
      template: '# Background\n# Actions',
      rules: 'Neutral tone',
      pastRecords: [rec('01', 'first note'), rec('02', 'second note')],
      keyPoints: '今天家访',
    });
    const u = userText(p);
    expect(u).toContain('# Background\n# Actions');
    expect(u).toContain('Neutral tone');
    expect(u).toContain('今天家访');
    expect(u.indexOf('first note')).toBeLessThan(u.indexOf('second note'));
    expect(p.includedRecords).toBe(2);
    expect(p.totalRecords).toBe(2);
  });

  it('tells the model to follow the template, not invent facts, and mark gaps [TBC]', () => {
    const sys = buildPrompt({ template: 't', rules: '', pastRecords: [], keyPoints: 'k' }).messages[0].content;
    expect(sys).toMatch(/same headings, same order/);
    expect(sys).toMatch(/Never invent/);
    expect(sys).toContain('[TBC]');
  });

  it('still builds a prompt for a case with no records and omits empty sections', () => {
    const p = buildPrompt({ template: 't', rules: '  ', pastRecords: [], keyPoints: 'k' });
    expect(p.includedRecords).toBe(0);
    expect(userText(p)).not.toContain('## Rules');
    expect(userText(p)).not.toContain('Past records');
    expect(userText(p)).toContain('## Key points');
  });

  it('drops the oldest records first when over the budget', () => {
    const p = buildPrompt({
      template: 't',
      rules: '',
      pastRecords: [rec('01', 'a'.repeat(50)), rec('02', 'b'.repeat(50)), rec('03', 'c'.repeat(50))],
      keyPoints: 'k',
      contextBudget: 120,
    });
    const u = userText(p);
    expect(p.includedRecords).toBe(2);
    expect(p.totalRecords).toBe(3);
    expect(u).not.toContain('a'.repeat(50));
    expect(u).toContain('b'.repeat(50));
    expect(u).toContain('c'.repeat(50));
  });

  it('keeps no records if even the newest exceeds the budget', () => {
    const p = buildPrompt({ template: 't', rules: '', pastRecords: [rec('01', 'x'.repeat(100))], keyPoints: 'k', contextBudget: 10 });
    expect(p.includedRecords).toBe(0);
  });
});
