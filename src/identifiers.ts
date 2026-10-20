export type IdentifierKind = 'phone number' | 'email address' | 'ID number';

const PATTERNS: [IdentifierKind, RegExp][] = [
  ['email address', /[\w.+-]+@[\w-]+(\.[\w-]+)+/],
  // Mainland China mobile, Hong Kong 8-digit, or international numbers with a +.
  ['phone number', /(?<!\d)(?:\+?\d{1,3}[ -]?)?1[3-9]\d{9}(?!\d)|(?<!\d)[2-9]\d{3}[ -]?\d{4}(?!\d)|\+\d{1,3}[ -]?\d{6,12}/],
  // Mainland 18-digit ID, or HKID style (A123456(7)).
  ['ID number', /(?<!\d)\d{17}[\dXx](?!\d)|(?<![A-Za-z])[A-Z]{1,2}\d{6}\s?\(?[0-9A]\)?(?![\w])/],
];

/** Best-effort check; returns each kind of likely identifier found once. */
export function detectIdentifiers(text: string): IdentifierKind[] {
  return PATTERNS.filter(([, re]) => re.test(text)).map(([kind]) => kind);
}
