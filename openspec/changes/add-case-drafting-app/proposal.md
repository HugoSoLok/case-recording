# Proposal

## Why

A social worker writes case notes as short Chinese key points, but the case record must be written in English, in a consistent template, and in line with earlier records of the same case. Doing this by hand is slow and error-prone. A small personal tool can draft the English record from the key points, the user's template, and past records of that case.

## What Changes

- New single-user, static web app, hosted on GitHub Pages and runnable locally, with no backend.
- The user enters Chinese key points for a case; the app asks an LLM (through OpenRouter) to draft an English case record.
- The draft follows a user-supplied template file and a user-supplied rules/behaviour file, and takes the same case's past records as context.
- The user edits the draft and saves it as a new record in that case; saved records feed later drafts.
- The user connects OpenRouter with the OAuth PKCE flow; the resulting API key is kept only in that browser, never in the repo or the hosted site.
- Cases, records, template and rules are stored in the browser on each device, with optional export/import as a backup. No cross-device sync.
- Input is background information only; the app does not handle personal data and warns on obvious identifiers.

## Capabilities

### New Capabilities
- `openrouter-connection`: connect/disconnect OpenRouter via OAuth PKCE, hold the key in the browser, choose the model, and report credit/auth/rate-limit failures.
- `case-records`: create cases, store and list the saved records of a case, edit a record, and export/import all data.
- `drafting-inputs`: supply, store and replace the template file and the rules/behaviour file used to draft records.
- `case-drafting`: turn Chinese key points into an editable English draft using the template, rules and the same case's past records, and flag unsupported gaps and likely personal identifiers.

### Modified Capabilities

None (no existing specs).

## Impact

- New code: a static front-end app (build output served by GitHub Pages) and its tests; none exists yet.
- External dependency: OpenRouter (OAuth PKCE at `openrouter.ai/auth`, chat completions API called directly from the browser).
- Hosting: GitHub Pages workflow and a stable public URL used as the OAuth callback.
- User prerequisites: an OpenRouter account with credits; a template file and a rules file.
- Out of scope: multi-user support, cross-device sync, server-side components, personal data storage, and non-English output.
