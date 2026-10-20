export const DATA_VERSION = 1;

export interface CaseRecord {
  id: string;
  text: string;
  keyPoints: string;
  createdAt: string;
  updatedAt: string;
}

export interface CaseItem {
  id: string;
  name: string;
  records: CaseRecord[];
}

export interface AppData {
  version: number;
  cases: CaseItem[];
  template: string;
  rules: string;
  lastExportAt: string | null;
}

export interface ExportFile {
  app: 'case-recording';
  version: number;
  exportedAt: string;
  cases: CaseItem[];
  template: string;
  rules: string;
}

export function emptyData(): AppData {
  return { version: DATA_VERSION, cases: [], template: '', rules: '', lastExportAt: null };
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;
const isStr = (v: unknown): v is string => typeof v === 'string';

function isRecord(v: unknown): v is CaseRecord {
  return (
    isObj(v) &&
    isStr(v.id) &&
    isStr(v.text) &&
    isStr(v.keyPoints) &&
    isStr(v.createdAt) &&
    isStr(v.updatedAt)
  );
}

function isCase(v: unknown): v is CaseItem {
  return (
    isObj(v) &&
    isStr(v.id) &&
    isStr(v.name) &&
    Array.isArray(v.records) &&
    v.records.every(isRecord)
  );
}

export function isValidCases(v: unknown): v is CaseItem[] {
  return Array.isArray(v) && v.every(isCase);
}

/** Returns the parsed export file, or null if it is not a valid export of a supported version. */
export function parseExportFile(raw: string): ExportFile | null {
  let v: unknown;
  try {
    v = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!isObj(v) || v.app !== 'case-recording' || v.version !== DATA_VERSION) return null;
  if (!isStr(v.exportedAt) || !isStr(v.template) || !isStr(v.rules) || !isValidCases(v.cases)) {
    return null;
  }
  return {
    app: 'case-recording',
    version: v.version,
    exportedAt: v.exportedAt,
    cases: v.cases,
    template: v.template,
    rules: v.rules,
  };
}

export function parseAppData(raw: string): AppData | null {
  let v: unknown;
  try {
    v = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!isObj(v) || v.version !== DATA_VERSION) return null;
  if (!isStr(v.template) || !isStr(v.rules) || !isValidCases(v.cases)) return null;
  if (v.lastExportAt !== null && !isStr(v.lastExportAt)) return null;
  return {
    version: v.version,
    cases: v.cases,
    template: v.template,
    rules: v.rules,
    lastExportAt: v.lastExportAt,
  };
}
