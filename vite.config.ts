import { defineConfig } from 'vitest/config';

const csp = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self' data:",
  "connect-src https://openrouter.ai",
  "base-uri 'none'",
  "form-action 'none'",
  "object-src 'none'",
].join('; ');

export default defineConfig(({ command }) => ({
  // Relative base so assets resolve under any GitHub Pages repo path.
  base: './',
  // Lets the dev server be reached through GitHub Codespaces port forwarding.
  server: { allowedHosts: ['.app.github.dev'] },
  plugins: [
    {
      name: 'inject-csp',
      transformIndexHtml(html) {
        // Dev server needs inline HMR and websockets, so CSP is applied to builds only.
        if (command !== 'build') return html;
        return html.replace(
          '<head>',
          `<head>\n    <meta http-equiv="Content-Security-Policy" content="${csp}" />`,
        );
      },
    },
  ],
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts'],
  },
}));
