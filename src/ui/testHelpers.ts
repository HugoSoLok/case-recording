import { vi } from 'vitest';
import { createStore, type Store } from '../storage';
import { mountApp } from './app';
import type { Deps, StartupNotice } from './ctx';

export interface SetupOptions {
  confirmResult?: boolean;
  fetchImpl?: (url: string, init?: RequestInit) => Promise<Response>;
  startupNotice?: StartupNotice;
  preset?: (store: Store) => void;
}

export function setup(opts: SetupOptions = {}) {
  const root = document.createElement('div');
  document.body.replaceChildren(root);
  const store = createStore(localStorage);
  opts.preset?.(store);
  const downloads: { filename: string; text: string }[] = [];
  const fetchMock = vi.fn(
    opts.fetchImpl ?? (async () => new Response('{}', { status: 404 })),
  );
  const connect = vi.fn(async () => {});
  const deps: Deps = {
    store,
    confirm: vi.fn(() => opts.confirmResult ?? true),
    download: (filename, text) => downloads.push({ filename, text }),
    now: () => '2026-03-04T10:00:00.000Z',
    fetch: fetchMock as unknown as typeof fetch,
    connect,
    startupNotice: opts.startupNotice,
  };
  mountApp(root, deps);
  return { root, store, deps, downloads, fetchMock, connect };
}

export const button = (root: HTMLElement, label: string): HTMLButtonElement => {
  const b = [...root.querySelectorAll('button')].find((x) => x.textContent === label);
  if (!b) throw new Error(`No button "${label}"`);
  return b;
};

export function createCase(root: HTMLElement, name: string) {
  const input = root.querySelector<HTMLInputElement>('input[aria-label="New case name"]')!;
  input.value = name;
  button(root, 'Create case').click();
}

export function pickFile(input: HTMLInputElement, content: string, name = 'f.json') {
  const file = new File([content], name);
  Object.defineProperty(input, 'files', { value: [file], configurable: true });
  input.dispatchEvent(new Event('change'));
}

export const jsonResponse = (status: number, body: unknown = {}) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
