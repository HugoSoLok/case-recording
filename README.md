# case-recording

Personal web app that drafts English social-work case records from Chinese key points, using your own template, rules and earlier records of the same case. It runs fully in the browser; data stays on the device.

## Run locally

```bash
npm install
npm run dev      # dev server
npm run build    # type-check and build to dist/
npm test         # unit tests
```

## First-run steps

1. Create an [OpenRouter](https://openrouter.ai) account and add credits. You do not need to create an API key; the app gets one when you authorize it.
2. Open the app, go to **Settings**, and click **Connect OpenRouter**. Sign in if asked and click **Authorize**. You are returned to the app and it shows "connected". Repeat once per browser or device.
3. Optional: in OpenRouter, open the key labelled "Case Recording" and set a credit limit on it.
4. Go to **Template & rules** and paste or upload a template (required) and rules (optional).
5. In **Settings**, check the model. The default can be changed to any OpenRouter model id.
6. Create a case, type Chinese key points, click **Draft record**, edit the English draft, then **Save as record**. Later drafts for the same case use its saved records as context.

Notes:

- Enter background information only. The app warns on obvious phone numbers, emails and ID numbers, but this is best-effort.
- The OpenRouter key, cases, records, template and rules live only in this browser. Clearing site data deletes them, so use **Settings > Export data** regularly. The export never contains the key. There is no sync between devices.

## Deploy to GitHub Pages

In the repository settings, set **Pages > Source** to **GitHub Actions**. Pushing to `main` runs `.github/workflows/pages.yml`, which tests, builds and publishes `dist/`. The OpenRouter authorization returns to the page URL it was started from, so no extra registration is needed.
