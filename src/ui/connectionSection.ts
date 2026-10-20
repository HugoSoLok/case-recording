import { DEFAULT_MODEL, listModels } from '../openrouter';
import { h } from './dom';
import type { Ctx } from './ctx';

export function connectionSection(ctx: Ctx): HTMLElement {
  const { store } = ctx.deps;
  const connected = store.getApiKey() !== null;
  const notice = ctx.deps.startupNotice;
  ctx.deps.startupNotice = undefined;

  const modelInput = h('input', {
    type: 'text',
    value: store.getModel() ?? DEFAULT_MODEL,
    ariaLabel: 'Model',
    onchange: () => {
      const v = modelInput.value.trim();
      if (v) store.setModel(v);
      else modelInput.value = store.getModel() ?? DEFAULT_MODEL;
      saved.textContent = 'Model saved.';
    },
  });
  modelInput.setAttribute('list', 'model-suggestions');
  const suggestions = h('datalist', { id: 'model-suggestions' });
  const saved = h('p', { className: 'muted' });

  void listModels(ctx.deps.fetch).then((ids) => {
    suggestions.replaceChildren(...ids.map((id) => h('option', { value: id })));
  });

  return h(
    'section',
    null,
    h('h3', null, 'OpenRouter'),
    notice && h('p', { className: notice.kind === 'error' ? 'error' : 'muted' }, notice.text),
    h('p', null, connected ? 'Status: connected' : 'Status: not connected'),
    connected
      ? h('button', {
          type: 'button',
          textContent: 'Disconnect',
          className: 'danger',
          onclick: () => {
            store.clearApiKey();
            ctx.rerender();
          },
        })
      : h('button', { type: 'button', textContent: 'Connect OpenRouter', onclick: () => void ctx.deps.connect() }),
    h('p', { className: 'muted' }, 'The key is kept only in this browser. You need an OpenRouter account with credits.'),
    h('label', null, 'Model: ', modelInput, suggestions),
    saved,
  );
}
