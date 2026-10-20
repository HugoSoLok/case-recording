import { describe, expect, it } from 'vitest';
import { detectIdentifiers } from './identifiers';

describe('detectIdentifiers', () => {
  it.each([
    ['联系 someone@example.com 跟進', ['email address']],
    ['電話 91234567', ['phone number']],
    ['手机 13812345678', ['phone number']],
    ['call +852 91234567', ['phone number']],
    ['身份证 110101199003071234', ['ID number']],
    ['HKID A123456(7)', ['ID number']],
  ])('detects %s', (text, kinds) => {
    expect(detectIdentifiers(text)).toEqual(expect.arrayContaining(kinds));
  });

  it('reports multiple kinds once each', () => {
    const kinds = detectIdentifiers('a@b.com and 13812345678 and 13912345678');
    expect(kinds.sort()).toEqual(['email address', 'phone number']);
  });

  it.each([
    '案主今日情緒穩定，與家人傾談約45分鐘。',
    'Client attended 3 sessions in 2026, aged 12.',
    '第2次家訪，跟進學校出席率85%',
  ])('does not flag ordinary background text: %s', (text) => {
    expect(detectIdentifiers(text)).toEqual([]);
  });
});
