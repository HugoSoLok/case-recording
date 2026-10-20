import type { Store } from '../storage';

export interface StartupNotice {
  kind: 'ok' | 'error';
  text: string;
}

export interface Deps {
  store: Store;
  confirm: (message: string) => boolean;
  download: (filename: string, text: string) => void;
  now: () => string;
  fetch: typeof fetch;
  /** Starts the OpenRouter authorization redirect. */
  connect: () => Promise<void>;
  /** Result of an OpenRouter return, shown once on the settings page. */
  startupNotice?: StartupNotice;
}

export type Route =
  | { name: 'cases' }
  | { name: 'case'; id: string }
  | { name: 'inputs' }
  | { name: 'settings' };

export interface Ctx {
  deps: Deps;
  navigate: (route: Route) => void;
  rerender: () => void;
}
