# Flare Guard Extension

A Chrome Manifest V3 extension that scans pages for signs of fraudulent clone / phishing checkout sites and reports a risk level.

## Features

- Runs automatically on every page (`<all_urls>`, all frames).
- Detects payment-related signals: card input fields, payment provider embeds, checkout-like URL paths, payment buttons, and price text.
- Re-scans single-page apps (React/Next/etc.) as the DOM changes.
- Sets a toolbar badge (`$` for likely, `?` for possible).
- Popup shows the verdict, risk level (1–3), page URL, and the detected signals.

## Risk scale

| Level | Verdict        | Meaning                              |
| ----- | -------------- | ------------------------------------ |
| 1     | `none`         | No clone/payment signals detected    |
| 2     | `possible`     | Some suspicious signals              |
| 3     | `likely`       | Strong signals of a fraudulent clone |

Detection uses a raw weighted score internally. Raw score `>= 5` maps to level 3, `>= 3` maps to level 2, and everything else maps to level 1.

## Signals and weights

| Signal            | Weight | Source                                             |
| ----------------- | ------ | -------------------------------------------------- |
| `card-fields`     | 5      | Card / CVC inputs                                  |
| `payment-provider`| 4      | Known payment provider iframes or scripts          |
| `url-path`        | 2      | URL contains checkout/pricing/billing/etc.         |
| `payment-button`  | 2      | Buttons like "Pay now", "Buy now", "Lipa sasa"     |
| `price-text`      | 1      | Prices such as `$19.99`, `KES 1,500`               |

## Project structure

```
extension/
├── manifest.json      # Manifest V3 config
├── background.ts      # Service worker source
├── background.js      # Compiled service worker
├── scripts/
│   ├── content.ts     # Content script source (detection)
│   └── content.js     # Compiled content script
├── popup/
│   ├── main.html      # Popup UI
│   ├── main.ts        # Popup logic source
│   └── main.js        # Compiled popup script
└── images/
    └── placeholder.jpg
```

## Install (unpacked)

1. Open `chrome://extensions` in Chrome.
2. Enable **Developer mode**.
3. Click **Load unpacked** and select the `extension/` directory.
4. Visit a page; the badge and popup show the scan result.

## Development

The source is written in TypeScript and compiled to plain JavaScript next to each source file.

```sh
cd extension
npm install
tsc -p tsconfig.json
```

To rebuild a single file:

```sh
tsc background.ts --ignoreConfig --target es6 --module commonjs --types chrome --skipLibCheck
```

After rebuilding, reload the extension from `chrome://extensions`.

## How it works

1. `scripts/content.js` collects signals and sends a `SCAN_RESULT` message with `{ url, score, verdict, signals }`.
2. `background.js` stores the result in `chrome.storage.session` under `tab:<tabId>` and updates the toolbar badge.
3. `popup/main.js` reads the active tab's stored result and renders it.

## Permissions

- `storage` — persist per-tab scan results in `chrome.storage.session`.
