import './style.css';
import { handleCallback, startConnect, type AuthEnv } from './openrouterAuth';
import { createStore } from './storage';
import { mountApp } from './ui/app';
import type { StartupNotice } from './ui/ctx';

function download(filename: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

async function start() {
  const root = document.getElementById('app');
  if (!root) return;
  const store = createStore();
  const authEnv = (): AuthEnv => ({
    store,
    session: sessionStorage,
    fetch: (...args) => fetch(...args),
    href: window.location.href,
    navigate: (url) => window.location.assign(url),
    replaceUrl: (url) => window.history.replaceState(null, '', url),
  });

  const result = await handleCallback(authEnv());
  const messages: Record<string, StartupNotice | undefined> = {
    connected: { kind: 'ok', text: 'Connected to OpenRouter.' },
    denied: { kind: 'error', text: 'The connection was not completed. Click Connect to try again.' },
  };
  const startupNotice =
    result.status === 'error' ? { kind: 'error' as const, text: result.message } : messages[result.status];

  mountApp(
    root,
    {
      store,
      confirm: (m) => window.confirm(m),
      download,
      now: () => new Date().toISOString(),
      fetch: (...args) => fetch(...args),
      connect: () => startConnect(authEnv()),
      startupNotice,
    },
    startupNotice ? { name: 'settings' } : { name: 'cases' },
  );
}

void start();
