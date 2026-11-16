# Redact First

Your private details stay on your device. The cloud only sees placeholders.

Paste text you want an AI to help with, or select text on any page in Chrome. Gemini Nano finds personal and confidential details on your device and swaps them for placeholders such as `[PERSON_1]`. Only the masked text goes to Gemini in the cloud. The answer comes back with placeholders, and the real values are restored on your device.

Built for **#BuildHybridAI 2026** with **Firebase AI Logic hybrid inference**.

- Live demo: https://redact-first-hybrid.web.app
- Platform: Web (Chrome) and a Chrome extension

## How it uses hybrid inference

| Step | Where | Firebase AI Logic mode |
|---|---|---|
| Detect sensitive values | On device (Gemini Nano, Prompt API) | `InferenceMode.ONLY_ON_DEVICE` with a JSON response schema |
| Mask | On device | — |
| Draft / summarize / extract | Cloud (Gemini) | `InferenceMode.ONLY_IN_CLOUD`, or `PREFER_ON_DEVICE` |
| Restore real values | On device | — |

Raw text is never sent to the cloud. If the browser has no on-device model, detection falls back to local pattern rules and the user must confirm the masked preview before anything is sent.

Other Firebase products: **App Check** (reCAPTCHA Enterprise for the web app, debug token for the extension) and **Hosting**.

## Run locally

1. Use Chrome 138+ on a machine that supports Gemini Nano (see the Chrome Prompt API hardware requirements). Without it, the app still works with local rules.
2. Create a Firebase project, enable Firebase AI Logic with the Gemini Developer API, register a web app and App Check (reCAPTCHA Enterprise).
3. Copy `.env.example` to `.env.local` and fill in your web app config and reCAPTCHA site key.
4. `npm install`
5. `npm run dev` and open http://localhost:5173

## Chrome extension

1. Put an App Check debug token registered in your Firebase project into `src/appcheck-debug.local.js`:
   `export const APPCHECK_DEBUG_TOKEN = "<uuid>";`
2. `npm run build:ext`
3. Open `chrome://extensions`, enable Developer mode, **Load unpacked** and pick `dist-ext`.
4. Select text on any page, right-click **Redact First: hide private details**.

## Testing instructions for judges

- Open https://redact-first-hybrid.web.app in Chrome, click **Load example**, then **Find sensitive info on this device**, then **Send masked text**.
- The green badge at the top shows whether Gemini Nano is available on your machine. If it is not, you will see the local-rules mode and a required review step.
- To try "use with any AI": click **Copy masked text**, paste it into any AI chat, paste the answer into **Got an answer from another AI?** and click **Restore real values**.

## Evaluation

See [eval/RESULTS.md](eval/RESULTS.md): on 12 self-written work messages with 30 sensitive values, Gemini Nano on-device plus rules found 30/30; local rules alone found 24/30.

## Built during the submission period

All code was written between Nov 16 and Nov 30, 2026. Open-source dependencies: Firebase JS SDK, Vite. An AI coding assistant (Claude) was used during development.

## License

Apache License 2.0
