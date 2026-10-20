import type { CaseRecord } from '../data';
import { h, formatDate } from './dom';
import type { Ctx } from './ctx';
import { draftPanel } from './draftPanel';

function recordItem(ctx: Ctx, caseId: string, rec: CaseRecord): HTMLElement {
  const { store } = ctx.deps;
  const body = h('div', { className: 'record-body' });

  const showView = () => {
    body.replaceChildren(
      h('pre', { className: 'text' }, rec.text),
      h('button', { type: 'button', textContent: 'Edit', onclick: showEdit }),
    );
  };
  const showEdit = () => {
    const area = h('textarea', { value: rec.text, rows: 12, ariaLabel: 'Record text' });
    body.replaceChildren(
      area,
      h(
        'div',
        { className: 'row' },
        h('button', {
          type: 'button',
          textContent: 'Save',
          onclick: () => {
            store.updateRecord(caseId, rec.id, area.value);
            ctx.rerender();
          },
        }),
        h('button', { type: 'button', textContent: 'Cancel', onclick: showView }),
      ),
    );
  };
  showView();

  return h(
    'li',
    { className: 'record' },
    h('div', { className: 'muted' }, formatDate(rec.createdAt)),
    body,
  );
}

export function caseView(ctx: Ctx, caseId: string): HTMLElement {
  const { store, confirm } = ctx.deps;
  const item = store.getCase(caseId);
  if (!item) {
    return h(
      'section',
      null,
      h('p', null, 'This case no longer exists.'),
      h('button', { type: 'button', textContent: 'Back to cases', onclick: () => ctx.navigate({ name: 'cases' }) }),
    );
  }

  const nameInput = h('input', { type: 'text', value: item.name, ariaLabel: 'Case name' });
  const error = h('p', { className: 'error' });
  const records = store.listRecords(caseId);

  return h(
    'section',
    null,
    h('button', { type: 'button', className: 'link', textContent: '< All cases', onclick: () => ctx.navigate({ name: 'cases' }) }),
    h('h2', null, item.name),
    h(
      'div',
      { className: 'row' },
      nameInput,
      h('button', {
        type: 'button',
        textContent: 'Rename',
        onclick: () => {
          try {
            store.renameCase(caseId, nameInput.value);
            ctx.rerender();
          } catch (e) {
            error.textContent = e instanceof Error ? e.message : String(e);
          }
        },
      }),
      h('button', {
        type: 'button',
        className: 'danger',
        textContent: 'Delete case',
        onclick: () => {
          if (!confirm(`Delete "${item.name}" and all its records? This cannot be undone.`)) return;
          store.deleteCase(caseId);
          ctx.navigate({ name: 'cases' });
        },
      }),
    ),
    error,
    draftPanel(ctx, caseId),
    h('h3', null, 'Records'),
    records.length === 0
      ? h('p', { className: 'muted' }, 'No records yet.')
      : h('ul', { className: 'list' }, ...records.map((r) => recordItem(ctx, caseId, r))),
  );
}
