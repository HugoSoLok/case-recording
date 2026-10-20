# Design

## Context

Greenfield repository: no application code exists yet. See proposal.md for motivation and scope; the specs define the behavior. Constraints that shape the approach:

- Hosted on GitHub Pages, so static files only and no server-side secret.
- Single user, 1-2 devices, no cross-device sync.
- The LLM is reached through OpenRouter, directly from the browser.
- Input is background information only, so cases and records are low sensitivity but still kept local.

## Goals / Non-Goals

**Goals**
- Static site that builds to plain files and also runs locally with the same code.
- Small, dependency-light code that one person can maintain.
- Unit-testable core (prompt building, PKCE, storage, identifier detection) separate from the UI.

**Non-Goals**
- Server, proxy, accounts, or sync.
- Streaming output, multi-language output, or rich-text editing.
- Hardening against a malicious user of the same browser profile.

## Decisions

### D1. Vite + TypeScript, no UI framework
Plain TypeScript with a few small view modules, built by Vite, tested with Vitest. The UI is a handful of screens (cases, case detail/draft, template and rules, settings), which does not justify a framework.
- Alternative: React/Preact. Rejected: extra dependency and build surface for little gain.
- Alternative: no build, plain ES modules. Rejected: no TypeScript and weaker testing and base-path handling.

### D2. Static deployment via GitHub Pages workflow
A GitHub Actions workflow builds and publishes to Pages. Vite `base` is set to the repository path so assets resolve under `/<repo>/`.
- The OAuth callback is the app's own URL (origin + pathname), so the same code works on Pages and on `localhost` (any port is accepted by OpenRouter for callbacks).

### D3. OpenRouter OAuth PKCE in the browser
1. On "Connect", generate a random code verifier and a `state`, keep them in `sessionStorage`, and redirect to `https://openrouter.ai/auth` with the S256 challenge and the app URL as `callback_url`.
2. On return, verify `state`, POST the `code` and verifier to `/api/v1/auth/keys`, store the returned key in `localStorage`, and clear the query string from the URL.
3. Calls go straight to `/api/v1/chat/completions` with the key as a bearer token (non-streaming).
- Alternative: paste a key manually. Kept only as a documented fallback for development, not a v1 UI.
- Alternative: key in repo or build, or an encrypted key. Rejected: the hosted site is public.
- Alternative: proxy (e.g. a worker). Rejected: second service to run for a one-person tool.

### D4. Storage in `localStorage` with a versioned JSON model
Data is small text. One namespaced, versioned structure holds cases, records, template, rules and settings; the API key and model are stored separately from export data.
- Export/import uses a JSON file of cases, records, template and rules only. The API key is never exported.
- Import validates shape and version before touching existing data, and offers replace or merge.
- Alternative: IndexedDB. Rejected for v1: more code for a few hundred KB; revisit if quota becomes a problem.

### D5. Prompt assembly is a pure function
A single function builds the messages from template, rules, same-case past records (most recent first, within a character budget), and the key points. System-level instructions cover: follow template headings/order, English output, use only supplied facts, mark gaps as `[TBC]`, and treat rules as authoritative on wording. Records of other cases are never passed in.
- The budget keeps requests within the model context and cost; oldest records are dropped first and the UI shows how many were included.

### D6. Identifier warning is a local heuristic
Regex checks for phone numbers, email addresses and ID-number-like strings run before every request, on the key points and the included past records. It is a warning only, not a guarantee, and the user can proceed.

### D7. Safe rendering and no third-party runtime code
Draft and record text is rendered as text (never as HTML), the page has a restrictive Content-Security-Policy that only allows `connect-src` to `openrouter.ai`, and the app loads no third-party scripts. This limits the exposure of the key held in `localStorage`.

### D8. Model setting
The model is a free-text field with suggestions from OpenRouter's public models list; a default constant is used until the user picks one.

## Risks / Trade-offs

- [Key in `localStorage` is readable by any script on the origin] -> No third-party scripts, CSP, text-only rendering; user sets a credit limit on the key in OpenRouter and can revoke it.
- [Browser storage can be cleared, and there is no sync] -> Show a reminder and last-export date; export is one click.
- [OAuth flow or exact consent screen differs from the documentation] -> Verify the flow end to end once on `localhost` and on Pages before relying on it.
- [Model invents or mistranslates details] -> `[TBC]` rule, editable draft, explicit save; the user remains the author of the final record.
- [Notes sent to third-party providers through OpenRouter] -> Background-only input, identifier warning, and the user reviews OpenRouter data-retention/training settings on their account.
- [Past records exceed the context budget] -> Character budget with a visible count of included records.
- [Heuristic misses identifiers] -> Documented as best-effort; not relied on as a control.

## Migration Plan

Greenfield: no migration. Deployment is enabling GitHub Pages (source: GitHub Actions) and registering nothing else, since OpenRouter's OAuth needs no pre-registration. Rollback is reverting the commit or disabling Pages. Stored data carries a version number so later changes can migrate it.

## Open Questions

- Which default model to ship (can be changed at any time without affecting specs).
- Whether to add a manual API-key entry to the UI for development convenience.
