import {
  type AppData,
  type CaseItem,
  DATA_VERSION,
  type ExportFile,
  parseExportFile,
} from './data';
import type { Store } from './storage';

/** Builds the export file. The API key and model are never included. */
export function buildExport(store: Store, now: () => string = () => new Date().toISOString()): ExportFile {
  const d = store.getData();
  return {
    app: 'case-recording',
    version: DATA_VERSION,
    exportedAt: now(),
    cases: d.cases,
    template: d.template,
    rules: d.rules,
  };
}

export function hasData(store: Store): boolean {
  const d = store.getData();
  return d.cases.length > 0 || d.template !== '' || d.rules !== '';
}

function mergeCases(current: CaseItem[], incoming: CaseItem[]): CaseItem[] {
  const out = current.map((c) => ({ ...c, records: [...c.records] }));
  for (const inc of incoming) {
    const existing = out.find((c) => c.id === inc.id);
    if (!existing) {
      out.push({ ...inc, records: [...inc.records] });
      continue;
    }
    for (const rec of inc.records) {
      const i = existing.records.findIndex((r) => r.id === rec.id);
      if (i === -1) existing.records.push(rec);
      else if (rec.updatedAt > existing.records[i].updatedAt) existing.records[i] = rec;
    }
  }
  return out;
}

export type ImportResult = { ok: true } | { ok: false; error: string };

/** Validates before touching existing data; an invalid file changes nothing. */
export function importData(store: Store, raw: string, mode: 'replace' | 'merge'): ImportResult {
  const file = parseExportFile(raw);
  if (!file) return { ok: false, error: 'This file is not a valid Case Recording export.' };

  const current = store.getData();
  const next: AppData =
    mode === 'replace'
      ? { ...current, cases: file.cases, template: file.template, rules: file.rules }
      : {
          ...current,
          cases: mergeCases(current.cases, file.cases),
          template: current.template || file.template,
          rules: current.rules || file.rules,
        };
  store.replaceData(next);
  return { ok: true };
}
