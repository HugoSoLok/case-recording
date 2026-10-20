import { beforeEach, describe, expect, it, vi } from 'vitest';
import { button, createCase, pickFile, setup } from './testHelpers';

beforeEach(() => localStorage.clear());

describe('cases and records', () => {
  it('creating a case opens it and lists it', () => {
    const { root, store } = setup();
    createCase(root, 'Case A');
    expect(root.querySelector('h2')?.textContent).toBe('Case A');
    expect(store.getData().cases).toHaveLength(1);
    button(root, '< All cases').click();
    expect(root.textContent).toContain('Case A (0 records)');
  });

  it('shows an error for an empty case name', () => {
    const { root, store } = setup();
    createCase(root, '  ');
    expect(root.querySelector('.error')?.textContent).toMatch(/empty/i);
    expect(store.getData().cases).toHaveLength(0);
  });

  it('delete asks for confirmation and removes only when confirmed', () => {
    const declined = setup({ confirmResult: false });
    createCase(declined.root, 'A');
    button(declined.root, 'Delete case').click();
    expect(declined.deps.confirm).toHaveBeenCalledTimes(1);
    expect(declined.store.getData().cases).toHaveLength(1);

    localStorage.clear();
    const accepted = setup({ confirmResult: true });
    createCase(accepted.root, 'A');
    button(accepted.root, 'Delete case').click();
    expect(accepted.store.getData().cases).toHaveLength(0);
    expect(accepted.root.textContent).toContain('No cases yet.');
  });

  it('renames a case', () => {
    const { root, store } = setup();
    createCase(root, 'A');
    root.querySelector<HTMLInputElement>('input[aria-label="Case name"]')!.value = 'B';
    button(root, 'Rename').click();
    expect(store.getData().cases[0].name).toBe('B');
  });

  it('lists records in date order and edits a record', () => {
    const { root, store } = setup();
    createCase(root, 'A');
    const id = store.getData().cases[0].id;
    store.saveRecord(id, { text: 'first', keyPoints: '' });
    store.saveRecord(id, { text: 'second', keyPoints: '' });
    button(root, 'Rename').click(); // re-render the case view
    const texts = [...root.querySelectorAll('.record .text')].map((e) => e.textContent);
    expect(texts).toEqual(['first', 'second']);

    button(root, 'Edit').click();
    const area = root.querySelector<HTMLTextAreaElement>('textarea[aria-label="Record text"]')!;
    area.value = 'first edited';
    button(root, 'Save').click();
    expect(store.listRecords(id)[0].text).toBe('first edited');
    expect(root.textContent).toContain('first edited');
  });

  it('renders record text as text, not HTML', () => {
    const { root, store } = setup();
    createCase(root, 'A');
    store.saveRecord(store.getData().cases[0].id, { text: '<img src=x onerror=alert(1)>', keyPoints: '' });
    button(root, 'Rename').click();
    expect(root.querySelector('.record img')).toBeNull();
    expect(root.querySelector('.record .text')?.textContent).toBe('<img src=x onerror=alert(1)>');
  });
});

describe('backup', () => {
  it('export downloads a file and records the export date', () => {
    const { root, store, downloads } = setup();
    createCase(root, 'A');
    button(root, 'Settings').click();
    expect(root.textContent).toContain('You have not exported yet.');
    button(root, 'Export data').click();
    expect(downloads).toHaveLength(1);
    expect(downloads[0].filename).toBe('case-recording-2026-03-04.json');
    expect(JSON.parse(downloads[0].text).cases).toHaveLength(1);
    expect(store.getData().lastExportAt).toBe('2026-03-04T10:00:00.000Z');
    expect(root.textContent).toContain('Last export:');
  });

  it('round trip: export, clear, import restores the data', async () => {
    const { root, store, downloads } = setup();
    createCase(root, 'A');
    store.setTemplate('# T');
    button(root, 'Settings').click();
    button(root, 'Export data').click();
    const exported = downloads[0].text;

    localStorage.clear();
    const fresh = setup();
    button(fresh.root, 'Settings').click();
    pickFile(fresh.root.querySelector<HTMLInputElement>('input[type=file]')!, exported);
    await vi.waitFor(() => expect(fresh.store.getData().cases).toHaveLength(1));
    expect(fresh.store.getData().cases[0].name).toBe('A');
    expect(fresh.store.getData().template).toBe('# T');
  });

  it('with existing data, import waits for the user to choose', async () => {
    const { root, store } = setup();
    createCase(root, 'A');
    button(root, 'Settings').click();
    const json = JSON.stringify({
      app: 'case-recording',
      version: 1,
      exportedAt: 'x',
      cases: [{ id: 'z', name: 'Z', records: [] }],
      template: '',
      rules: '',
    });
    pickFile(root.querySelector<HTMLInputElement>('input[type=file]')!, json);
    await vi.waitFor(() => expect(root.textContent).toContain('How should the imported file be applied?'));
    expect(store.getData().cases).toHaveLength(1);

    button(root, 'Merge into existing data').click();
    expect(store.getData().cases.map((c) => c.name)).toEqual(['A', 'Z']);
  });

  it('shows an error for an invalid file and changes nothing', async () => {
    const { root, store } = setup();
    createCase(root, 'A');
    button(root, 'Settings').click();
    pickFile(root.querySelector<HTMLInputElement>('input[type=file]')!, 'nope');
    await vi.waitFor(() => expect(root.querySelector('.error')?.textContent).toMatch(/not a valid/i));
    expect(store.getData().cases).toHaveLength(1);
  });
});

describe('template and rules', () => {
  it('replacing the template leaves rules unchanged', () => {
    const { root, store } = setup();
    store.setRules('be neutral');
    button(root, 'Template & rules').click();
    const area = root.querySelector<HTMLTextAreaElement>('textarea[aria-label="Template"]')!;
    area.value = '# New template';
    button(root, 'Save template').click();
    expect(store.getData().template).toBe('# New template');
    expect(store.getData().rules).toBe('be neutral');
    expect(root.textContent).toContain('Saved.');
  });

  it('uploading a file stores it and shows it in the editor', async () => {
    const { root, store } = setup();
    button(root, 'Template & rules').click();
    pickFile(root.querySelector<HTMLInputElement>('input[aria-label="Upload template file"]')!, '# From file', 't.md');
    await vi.waitFor(() => expect(store.getData().template).toBe('# From file'));
    expect(root.querySelector<HTMLTextAreaElement>('textarea[aria-label="Template"]')!.value).toBe('# From file');
  });

  it('shows the stored template and rules in full', () => {
    const { root, store } = setup();
    store.setTemplate('T1\nT2');
    store.setRules('R1');
    button(root, 'Template & rules').click();
    expect(root.querySelector<HTMLTextAreaElement>('textarea[aria-label="Template"]')!.value).toBe('T1\nT2');
    expect(root.querySelector<HTMLTextAreaElement>('textarea[aria-label="Rules"]')!.value).toBe('R1');
  });
});
