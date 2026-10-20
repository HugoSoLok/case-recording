import { detectIdentifiers, type IdentifierKind } from '../identifiers';
import { chat, DEFAULT_MODEL, OpenRouterError } from '../openrouter';
import { buildPrompt, type BuiltPrompt } from '../prompt';
import { h } from './dom';
import type { Ctx } from './ctx';

export function draftPanel(ctx: Ctx, caseId: string): HTMLElement {
  const { store } = ctx.deps;
  let busy = false;
  let draftKeyPoints = '';

  const keyArea = h('textarea', { rows: 8, ariaLabel: 'Chinese key points', placeholder: '輸入中文重點…' });
  const draftBtn = h('button', { type: 'button', textContent: 'Draft record', onclick: () => void run() });
  const message = h('p', { className: 'muted' });
  message.setAttribute('role', 'status');
  const connection = h('p', { className: 'muted' });
  const warning = h('div');
  const result = h('div');

  const setMessage = (text: string, isError = false) => {
    message.textContent = text;
    message.className = isError ? 'error' : 'muted';
  };

  const refresh = () => {
    const connected = store.getApiKey() !== null;
    draftBtn.disabled = busy || !connected;
    connection.replaceChildren(
      ...(connected
        ? [`Model: ${store.getModel() ?? DEFAULT_MODEL}`]
        : [
            'Not connected to OpenRouter. Connect it in Settings to draft. ',
            h('button', { type: 'button', className: 'link', textContent: 'Open Settings', onclick: () => ctx.navigate({ name: 'settings' }) }),
          ]),
    );
  };

  const showDraft = (text: string, built: BuiltPrompt) => {
    const area = h('textarea', { value: text, rows: 16, ariaLabel: 'Draft record' });
    result.replaceChildren(
      h('h4', null, 'Draft (editable)'),
      area,
      h('p', { className: 'muted' }, `Used ${built.includedRecords} of ${built.totalRecords} past record${built.totalRecords === 1 ? '' : 's'} as context.`),
      h(
        'div',
        { className: 'row' },
        h('button', {
          type: 'button',
          textContent: 'Save as record',
          onclick: () => {
            if (!area.value.trim()) return setMessage('The draft is empty; nothing to save.', true);
            store.saveRecord(caseId, { text: area.value, keyPoints: draftKeyPoints });
            ctx.rerender();
          },
        }),
        h('button', { type: 'button', textContent: 'Regenerate', onclick: () => void run() }),
        h('button', {
          type: 'button',
          textContent: 'Discard',
          onclick: () => {
            result.replaceChildren();
            setMessage('');
          },
        }),
      ),
    );
  };

  async function send(built: BuiltPrompt, keyPoints: string) {
    const apiKey = store.getApiKey();
    if (!apiKey) return refresh();
    busy = true;
    refresh();
    setMessage('Drafting…');
    try {
      const text = await chat({
        apiKey,
        model: store.getModel() ?? DEFAULT_MODEL,
        messages: built.messages,
        fetch: ctx.deps.fetch,
      });
      draftKeyPoints = keyPoints;
      showDraft(text, built);
      setMessage('');
    } catch (e) {
      if (e instanceof OpenRouterError) {
        if (e.kind === 'auth') store.clearApiKey();
        setMessage(e.message, true);
      } else {
        setMessage('Something went wrong while drafting. Try again.', true);
      }
    } finally {
      busy = false;
      refresh();
    }
  }

  const showWarning = (kinds: IdentifierKind[], proceed: () => void) => {
    warning.replaceChildren(
      h('p', { className: 'error' }, `This text may contain personal data (${kinds.join(', ')}). Nothing has been sent. Send anyway?`),
      h(
        'div',
        { className: 'row' },
        h('button', {
          type: 'button',
          textContent: 'Send anyway',
          onclick: () => {
            warning.replaceChildren();
            proceed();
          },
        }),
        h('button', { type: 'button', textContent: 'Cancel', onclick: () => warning.replaceChildren() }),
      ),
    );
  };

  async function run() {
    warning.replaceChildren();
    const keyPoints = keyArea.value.trim();
    if (!keyPoints) return setMessage('Enter key points first.', true);
    const { template, rules } = store.getData();
    if (!template.trim()) return setMessage('Add a template under "Template & rules" before drafting.', true);
    if (!store.getApiKey()) {
      refresh();
      return setMessage('Connect OpenRouter in Settings before drafting.', true);
    }

    const past = store.listRecords(caseId).map((r) => ({ createdAt: r.createdAt, text: r.text }));
    const built = buildPrompt({ template, rules, pastRecords: past, keyPoints });
    const sentRecords = past.slice(past.length - built.includedRecords);
    const kinds = detectIdentifiers([keyPoints, ...sentRecords.map((r) => r.text)].join('\n'));
    if (kinds.length > 0) {
      setMessage('');
      return showWarning(kinds, () => void send(built, keyPoints));
    }
    await send(built, keyPoints);
  }

  refresh();
  return h(
    'section',
    null,
    h('h3', null, 'Draft a new record'),
    connection,
    keyArea,
    h('div', { className: 'row' }, draftBtn),
    warning,
    message,
    result,
  );
}
