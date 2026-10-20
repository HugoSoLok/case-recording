import { parseExportFile } from '../data';
import { buildExport, hasData, importData } from '../transfer';
import { h, formatDate } from './dom';
import type { Ctx } from './ctx';

function readText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsText(file);
  });
}

export function dataSection(ctx: Ctx): HTMLElement {
  const { store, download, now } = ctx.deps;
  const last = store.getData().lastExportAt;
  const status = h('p', { className: 'muted' });
  const pending = h('div');

  const finish = (msg: string, isError = false) => {
    pending.replaceChildren();
    status.className = isError ? 'error' : 'muted';
    status.textContent = msg;
  };

  const doImport = (text: string, mode: 'replace' | 'merge') => {
    const r = importData(store, text, mode);
    if (!r.ok) return finish(r.error, true);
    ctx.rerender();
  };

  const fileInput = h('input', {
    type: 'file',
    accept: 'application/json,.json',
    ariaLabel: 'Import file',
    onchange: async () => {
      const file = fileInput.files?.[0];
      if (!file) return;
      const text = await readText(file);
      fileInput.value = '';
      if (!parseExportFile(text)) return finish('This file is not a valid Case Recording export.', true);
      if (!hasData(store)) return doImport(text, 'replace');
      status.textContent = '';
      pending.replaceChildren(
        h('p', null, 'You already have data. How should the imported file be applied?'),
        h(
          'div',
          { className: 'row' },
          h('button', { type: 'button', textContent: 'Replace existing data', className: 'danger', onclick: () => doImport(text, 'replace') }),
          h('button', { type: 'button', textContent: 'Merge into existing data', onclick: () => doImport(text, 'merge') }),
          h('button', { type: 'button', textContent: 'Cancel', onclick: () => finish('Import cancelled.') }),
        ),
      );
    },
  });

  return h(
    'section',
    null,
    h('h3', null, 'Backup'),
    h(
      'p',
      { className: 'muted' },
      'Data is stored only in this browser. Clearing site data deletes it, so export a backup regularly. ',
      last ? `Last export: ${formatDate(last)}.` : 'You have not exported yet.',
    ),
    h(
      'div',
      { className: 'row' },
      h('button', {
        type: 'button',
        textContent: 'Export data',
        onclick: () => {
          const stamp = now();
          download(`case-recording-${stamp.slice(0, 10)}.json`, JSON.stringify(buildExport(store, () => stamp), null, 2));
          store.setLastExportAt(stamp);
          ctx.rerender();
        },
      }),
      h('label', null, 'Import: ', fileInput),
    ),
    pending,
    status,
  );
}
