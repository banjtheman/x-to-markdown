# X to Markdown

Browser extension (Chrome + Firefox) that exports X (Twitter) posts, threads, and articles into Markdown for LLM-friendly workflows.

## Features
- Export a single post, full thread (author-only), or article
- Optional comments
- Metadata front matter (source, URL, export time)
- Copy to clipboard or download `.md`
- In-page floating button

## Install (Chrome)
1. Open `chrome://extensions`
2. Enable Developer mode
3. Click **Load unpacked**
4. Select `extension`

## Install (Firefox)
1. Open `about:debugging#/runtime/this-firefox`
2. Click **Load Temporary Add-on**
3. Select `extension/manifest.json`

## Usage
- Open an X post, thread, or article
- Click the square **Output to Markdown** button
- Choose options, then **Copy** or **Download**

## Notes
- X is highly dynamic; thread content is loaded as you scroll.
- The extension collects thread posts incrementally during auto-scroll.
- Comments include only what is visible in the DOM.

## Development
Main files are in `extension/`.

- `extension/manifest.json`
- `extension/content-script.js`
- `extension/content-style.css`
