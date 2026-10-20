import { h } from './dom';
import type { Ctx } from './ctx';

function readText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsText(file);
  });
}

function inputSection(opts: {
  title: string;
  hint: string;
  current: string;
  save: (text: string) => void;
}): HTMLElement {
  const area = h('textarea', { value: opts.current, rows: 14, ariaLabel: opts.title });
  const status = h('p', { className: 'muted' });

  const persist = (text: string) => {
    opts.save(text);
    status.textContent = 'Saved.';
  };

  const fileInput = h('input', {
    type: 'file',
    accept: '.md,.txt,text/plain,text/markdown',
    ariaLabel: `Upload ${opts.title.toLowerCase()} file`,
    onchange: async () => {
      const file = fileInput.files?.[0];
      if (!file) return;
      const text = await readText(file);
      fileInput.value = '';
      area.value = text;
      persist(text);
    },
  });

  return h(
    'section',
    null,
    h('h3', null, opts.title),
    h('p', { className: 'muted' }, opts.hint),
    area,
    h(
      'div',
      { className: 'row' },
      h('button', { type: 'button', textContent: `Save ${opts.title.toLowerCase()}`, onclick: () => persist(area.value) }),
      h('label', null, 'Upload file: ', fileInput),
    ),
    status,
  );
}

export function inputsView(ctx: Ctx): HTMLElement {
  const { store } = ctx.deps;
  const data = store.getData();
  return h(
    'section',
    null,
    h('h2', null, 'Template & rules'),
    inputSection({
      title: 'Template',
      hint: 'Required. Headings and their order for every drafted record. Changes apply to later drafts only.',
      current: data.template,
      save: (t) => store.setTemplate(t),
    }),
    inputSection({
      title: 'Rules',
      hint: 'Optional. Wording and behaviour, such as tone, terminology, or how to mark unknowns.',
      current: data.rules,
      save: (t) => store.setRules(t),
    }),
  );
}
