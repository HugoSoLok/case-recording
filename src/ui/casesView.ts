import { h } from './dom';
import type { Ctx } from './ctx';

export function casesView(ctx: Ctx): HTMLElement {
  const { store } = ctx.deps;
  const cases = store.getData().cases;

  const nameInput = h('input', { type: 'text', placeholder: 'New case name', ariaLabel: 'New case name' });
  const error = h('p', { className: 'error' });
  const create = () => {
    try {
      const c = store.createCase(nameInput.value);
      ctx.navigate({ name: 'case', id: c.id });
    } catch (e) {
      error.textContent = e instanceof Error ? e.message : String(e);
    }
  };

  return h(
    'section',
    null,
    h('h2', null, 'Cases'),
    h(
      'div',
      { className: 'row' },
      nameInput,
      h('button', { type: 'button', textContent: 'Create case', onclick: create }),
    ),
    error,
    cases.length === 0
      ? h('p', { className: 'muted' }, 'No cases yet.')
      : h(
          'ul',
          { className: 'list' },
          ...cases.map((c) =>
            h(
              'li',
              null,
              h('button', {
                type: 'button',
                className: 'link',
                textContent: `${c.name} (${c.records.length} record${c.records.length === 1 ? '' : 's'})`,
                onclick: () => ctx.navigate({ name: 'case', id: c.id }),
              }),
            ),
          ),
        ),
  );
}
