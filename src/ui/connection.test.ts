import { beforeEach, describe, expect, it } from 'vitest';
import { DEFAULT_MODEL } from '../openrouter';
import { button, jsonResponse, setup } from './testHelpers';

beforeEach(() => localStorage.clear());

const modelInput = (root: HTMLElement) => root.querySelector<HTMLInputElement>('input[aria-label="Model"]')!;

describe('connection settings', () => {
  it('shows disconnected state and starts the connection on click', () => {
    const { root, connect } = setup();
    button(root, 'Settings').click();
    expect(root.textContent).toContain('Status: not connected');
    button(root, 'Connect OpenRouter').click();
    expect(connect).toHaveBeenCalledTimes(1);
  });

  it('disconnect removes the stored key and disables drafting', () => {
    const { root, store } = setup({ preset: (s) => s.setApiKey('sk-x') });
    button(root, 'Settings').click();
    expect(root.textContent).toContain('Status: connected');
    button(root, 'Disconnect').click();
    expect(store.getApiKey()).toBeNull();
    expect(localStorage.getItem('cr.apiKey')).toBeNull();
    expect(root.textContent).toContain('Status: not connected');
  });

  it('shows the result of returning from OpenRouter once', () => {
    const first = setup({ startupNotice: { kind: 'error', text: 'The connection was not completed.' } });
    button(first.root, 'Settings').click();
    expect(first.root.textContent).toContain('The connection was not completed.');
    button(first.root, 'Cases').click();
    button(first.root, 'Settings').click();
    expect(first.root.textContent).not.toContain('The connection was not completed.');
  });
});

describe('model setting', () => {
  it('uses and shows a default model on first use', () => {
    const { root } = setup();
    button(root, 'Settings').click();
    expect(modelInput(root).value).toBe(DEFAULT_MODEL);
  });

  it('persists the chosen model across reloads', () => {
    const first = setup();
    button(first.root, 'Settings').click();
    modelInput(first.root).value = 'anthropic/some-model';
    modelInput(first.root).dispatchEvent(new Event('change'));

    const second = setup();
    button(second.root, 'Settings').click();
    expect(modelInput(second.root).value).toBe('anthropic/some-model');
  });

  it('offers suggestions from the models list', async () => {
    const { root } = setup({
      fetchImpl: async () => jsonResponse(200, { data: [{ id: 'a/b' }, { id: 'c/d' }] }),
    });
    button(root, 'Settings').click();
    await expect.poll(() => root.querySelectorAll('#model-suggestions option').length).toBe(2);
  });

  it('still allows typing a model when the models list cannot be fetched', async () => {
    const { root, store } = setup({
      fetchImpl: async () => {
        throw new TypeError('offline');
      },
    });
    button(root, 'Settings').click();
    modelInput(root).value = 'my/typed-model';
    modelInput(root).dispatchEvent(new Event('change'));
    expect(store.getModel()).toBe('my/typed-model');
    expect(root.querySelectorAll('#model-suggestions option')).toHaveLength(0);
  });
});
