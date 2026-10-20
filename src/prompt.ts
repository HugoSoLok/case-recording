import type { ChatMessage } from './openrouter';

export const DEFAULT_CONTEXT_BUDGET = 12000;

export interface PastRecord {
  createdAt: string;
  text: string;
}

export interface PromptInput {
  template: string;
  rules: string;
  /** Records of the selected case only, oldest first. */
  pastRecords: PastRecord[];
  keyPoints: string;
  contextBudget?: number;
}

export interface BuiltPrompt {
  messages: ChatMessage[];
  includedRecords: number;
  totalRecords: number;
}

const SYSTEM = [
  "You draft social-work case records in English from the worker's Chinese key points.",
  '- Output only the record text, in English, structured exactly by the template: same headings, same order.',
  '- Use only facts stated in the key points or the past records. Never invent or assume facts, names, dates or outcomes.',
  '- If neither the key points nor the past records give information for a template section, write [TBC] in that section.',
  '- Keep the style and terminology consistent with the past records when they are provided.',
  '- Follow the rules section for wording and behaviour. Rules never permit inventing facts.',
].join('\n');

/** Newest records are kept first; the oldest are dropped when over budget. */
function selectRecords(records: PastRecord[], budget: number): PastRecord[] {
  const picked: PastRecord[] = [];
  let used = 0;
  for (let i = records.length - 1; i >= 0; i--) {
    const size = records[i].text.length;
    if (used + size > budget) break;
    used += size;
    picked.unshift(records[i]);
  }
  return picked;
}

export function buildPrompt(input: PromptInput): BuiltPrompt {
  const included = selectRecords(input.pastRecords, input.contextBudget ?? DEFAULT_CONTEXT_BUDGET);

  const parts: string[] = ['## Template', input.template.trim()];
  if (input.rules.trim()) parts.push('## Rules', input.rules.trim());
  if (included.length > 0) {
    parts.push('## Past records of this case (oldest first)');
    included.forEach((r, i) => parts.push(`### Record ${i + 1} (${r.createdAt.slice(0, 10)})`, r.text.trim()));
  }
  parts.push('## Key points for the new record (Chinese)', input.keyPoints.trim(), 'Write the new record now.');

  return {
    messages: [
      { role: 'system', content: SYSTEM },
      { role: 'user', content: parts.join('\n\n') },
    ],
    includedRecords: included.length,
    totalRecords: input.pastRecords.length,
  };
}
