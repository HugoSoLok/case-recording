# Tasks

## 1. Project setup

- [x] 1.1 Scaffold a Vite + TypeScript project with Vitest and a README section on running locally; verify `npm install`, `npm run dev`, `npm run build` and `npm test` succeed
- [x] 1.2 Configure the Vite `base` for GitHub Pages and a restrictive CSP meta tag (`connect-src` limited to `openrouter.ai`); verify the built `index.html` contains the CSP and asset paths resolve under the repo path

## 2. Local storage and records (case-records)

- [x] 2.1 Implement the versioned storage module (cases, records, template, rules, settings; API key and model kept outside the export data) with unit tests for create/rename/delete case, save/edit record, and persistence across reload
- [x] 2.2 Implement export and import (validation, replace or merge, key never exported) with unit tests for valid export, invalid file leaving data unchanged, and merge versus replace
- [x] 2.3 Build the cases list and case detail views (create, rename, delete with confirmation, records in date order, open and edit a record); verify manually in the browser and with a DOM test for delete confirmation
- [x] 2.4 Add export/import controls and a reminder showing the last export date; verify a round trip restores identical data

## 3. Template and rules (drafting-inputs)

- [x] 3.1 Build the template and rules views (upload or paste, view, edit, replace), stored via the storage module; verify with tests that replacing the template leaves rules unchanged and that rules are optional
- [x] 3.2 Block drafting when no template exists with an explanatory message; verify with a test that no network request is made

## 4. OpenRouter connection (openrouter-connection)

- [x] 4.1 Implement PKCE helpers (verifier, S256 challenge, state) with unit tests against a known test vector
- [x] 4.2 Implement connect and callback handling (redirect, state check, code exchange, store key, clean the URL, handle denial) with tests using a mocked fetch for success, denied authorization, and state mismatch
- [x] 4.3 Implement disconnect and connected-status UI; verify the key is removed from storage on disconnect
- [x] 4.4 Implement the model setting with a default and suggestions from the OpenRouter models list; verify the choice persists after reload and that a failed models fetch still allows typing a model name
- [x] 4.5 Implement the OpenRouter client with error mapping for 402, 401 and 429 and distinct user messages; verify with mocked responses that key points are retained and a 401 marks the app disconnected
- [x] 4.6 Verify the connect flow end to end on `localhost` with a real OpenRouter account and record the exact steps in the README

## 5. Drafting (case-drafting)

- [x] 5.1 Implement the pure prompt builder (template, rules, same-case records within a character budget, key points, `[TBC]` and no-invention instructions); unit tests verify other cases' records are excluded, oldest records are dropped first, and an empty case still builds a prompt
- [x] 5.2 Implement the identifier heuristic (phone, email, ID-number-like) with unit tests for detected and clean inputs
- [x] 5.3 Build the drafting view: key points input, draft request, editable draft shown as text only, regenerate, discard, explicit save to the selected case; verify empty key points sends no request and discarding adds no record
- [x] 5.4 Add the pre-send warning flow (names the identifier kind, cancel or proceed) and show how many past records were included; verify with a DOM test that nothing is sent before confirmation

## 6. Deployment and integration

- [ ] 6.1 Add a GitHub Actions workflow that builds and publishes to GitHub Pages; verify the workflow succeeds and the hosted URL loads
- [ ] 6.2 Verify end to end on the hosted URL: connect, supply a template and rules, draft from Chinese key points, edit, save, draft again using the saved record, export and import
- [x] 6.3 Update the README with first-run steps (OpenRouter account and credits, optional key credit limit, template and rules, backup reminder)
