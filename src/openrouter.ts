const API = 'https://openrouter.ai/api/v1';

export const DEFAULT_MODEL = 'deepseek/deepseek-v4-flash-0731';

export type ErrorKind = 'credits' | 'auth' | 'rate_limit' | 'network' | 'other';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export class OpenRouterError extends Error {
  constructor(
    public kind: ErrorKind,
    message: string,
  ) {
    super(message);
  }
}

const MESSAGES: Record<Exclude<ErrorKind, 'other'>, string> = {
  credits:
    'OpenRouter has no credits available for this request. Add credits to your OpenRouter account or raise the key limit, then try again.',
  auth: 'OpenRouter rejected the key (it may have been revoked). Connect OpenRouter again.',
  rate_limit: 'OpenRouter is rate limiting requests. Wait a little and try again.',
  network: 'Could not reach OpenRouter. Check your connection and try again.',
};

async function classify(res: Response): Promise<OpenRouterError> {
  let limitSource: unknown;
  try {
    const body = (await res.json()) as { error?: { metadata?: { limit_source?: unknown } } };
    limitSource = body?.error?.metadata?.limit_source;
  } catch {
    /* body is optional */
  }
  if (res.status === 402) return new OpenRouterError('credits', MESSAGES.credits);
  // Key or workspace spend limits come back as 403 with a limit_source.
  if (res.status === 403 && typeof limitSource === 'string') return new OpenRouterError('credits', MESSAGES.credits);
  if (res.status === 401) return new OpenRouterError('auth', MESSAGES.auth);
  if (res.status === 429) return new OpenRouterError('rate_limit', MESSAGES.rate_limit);
  return new OpenRouterError('other', `OpenRouter returned an error (HTTP ${res.status}). Try again or choose another model.`);
}

export async function chat(opts: {
  apiKey: string;
  model: string;
  messages: ChatMessage[];
  fetch?: typeof fetch;
}): Promise<string> {
  const doFetch = opts.fetch ?? fetch;
  let res: Response;
  try {
    res = await doFetch(`${API}/chat/completions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${opts.apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: opts.model, messages: opts.messages, max_tokens: 4000 }),
    });
  } catch {
    throw new OpenRouterError('network', MESSAGES.network);
  }
  if (!res.ok) throw await classify(res);

  const body = (await res.json()) as { choices?: { message?: { content?: unknown } }[] };
  const text = body.choices?.[0]?.message?.content;
  if (typeof text !== 'string' || !text.trim()) {
    throw new OpenRouterError('other', 'OpenRouter returned an empty response. Try again or choose another model.');
  }
  return text;
}

/** Public model list, used only for suggestions; failure is not fatal. */
export async function listModels(doFetch: typeof fetch = fetch): Promise<string[]> {
  try {
    const res = await doFetch(`${API}/models`);
    if (!res.ok) return [];
    const body = (await res.json()) as { data?: { id?: unknown }[] };
    return (body.data ?? []).map((m) => m.id).filter((id): id is string => typeof id === 'string');
  } catch {
    return [];
  }
}
