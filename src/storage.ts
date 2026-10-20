import {
  type AppData,
  type CaseItem,
  type CaseRecord,
  emptyData,
  parseAppData,
} from './data';

const DATA_KEY = 'cr.data';
const CORRUPT_KEY = 'cr.data.corrupt';
const API_KEY = 'cr.apiKey';
const MODEL_KEY = 'cr.model';

export interface Store {
  getData(): AppData;
  replaceData(data: AppData): void;
  getCase(caseId: string): CaseItem | undefined;
  createCase(name: string): CaseItem;
  renameCase(caseId: string, name: string): void;
  deleteCase(caseId: string): void;
  saveRecord(caseId: string, input: { text: string; keyPoints: string }): CaseRecord;
  updateRecord(caseId: string, recordId: string, text: string): void;
  /** Records of a case, oldest first. */
  listRecords(caseId: string): CaseRecord[];
  setTemplate(text: string): void;
  setRules(text: string): void;
  setLastExportAt(iso: string): void;
  getApiKey(): string | null;
  setApiKey(key: string): void;
  clearApiKey(): void;
  getModel(): string | null;
  setModel(model: string): void;
}

function cleanName(name: string): string {
  const n = name.trim();
  if (!n) throw new Error('Case name must not be empty');
  return n;
}

export function createStore(
  storage: Storage = localStorage,
  now: () => string = () => new Date().toISOString(),
): Store {
  const load = (): AppData => {
    const raw = storage.getItem(DATA_KEY);
    if (raw === null) return emptyData();
    const parsed = parseAppData(raw);
    if (parsed) return parsed;
    // Keep unreadable data aside so the next write does not destroy it.
    storage.setItem(CORRUPT_KEY, raw);
    return emptyData();
  };
  const save = (data: AppData) => storage.setItem(DATA_KEY, JSON.stringify(data));
  const mutate = (fn: (d: AppData) => void) => {
    const d = load();
    fn(d);
    save(d);
  };
  const findCase = (d: AppData, id: string): CaseItem => {
    const c = d.cases.find((x) => x.id === id);
    if (!c) throw new Error(`Unknown case: ${id}`);
    return c;
  };

  return {
    getData: load,
    replaceData: save,
    getCase: (id) => load().cases.find((c) => c.id === id),
    createCase(name) {
      const item: CaseItem = { id: crypto.randomUUID(), name: cleanName(name), records: [] };
      mutate((d) => d.cases.push(item));
      return item;
    },
    renameCase(id, name) {
      const n = cleanName(name);
      mutate((d) => {
        findCase(d, id).name = n;
      });
    },
    deleteCase(id) {
      mutate((d) => {
        d.cases = d.cases.filter((c) => c.id !== id);
      });
    },
    saveRecord(id, input) {
      const stamp = now();
      const rec: CaseRecord = {
        id: crypto.randomUUID(),
        text: input.text,
        keyPoints: input.keyPoints,
        createdAt: stamp,
        updatedAt: stamp,
      };
      mutate((d) => findCase(d, id).records.push(rec));
      return rec;
    },
    updateRecord(id, recordId, text) {
      mutate((d) => {
        const rec = findCase(d, id).records.find((r) => r.id === recordId);
        if (!rec) throw new Error(`Unknown record: ${recordId}`);
        rec.text = text;
        rec.updatedAt = now();
      });
    },
    listRecords(id) {
      const c = load().cases.find((x) => x.id === id);
      if (!c) return [];
      return [...c.records].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    },
    setTemplate: (text) => mutate((d) => void (d.template = text)),
    setRules: (text) => mutate((d) => void (d.rules = text)),
    setLastExportAt: (iso) => mutate((d) => void (d.lastExportAt = iso)),
    getApiKey: () => storage.getItem(API_KEY),
    setApiKey: (key) => storage.setItem(API_KEY, key),
    clearApiKey: () => storage.removeItem(API_KEY),
    getModel: () => storage.getItem(MODEL_KEY),
    setModel: (model) => storage.setItem(MODEL_KEY, model),
  };
}
