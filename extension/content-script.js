(() => {
  if (window.__x2mdLoaded) return;
  window.__x2mdLoaded = true;

  console.debug("[x2md] content script loaded");

  const ext = typeof browser !== "undefined" ? browser : chrome;
  let panelVisible = false;

  function createUI() {
    const root = document.createElement("div");
    root.id = "x2md-root";
    const shadow = root.attachShadow({ mode: "open" });

    shadow.innerHTML = `
      <style>
        :host { all: initial; }
        .x2md-launcher {
          position: fixed;
          bottom: 170px;
          right: 16px;
          z-index: 2147483647;
          font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
        }
        .x2md-btn {
          width: 48px;
          height: 48px;
          background: rgba(14, 14, 14, 0.9);
          color: #fff;
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 12px;
          padding: 0;
          font-size: 12px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 10px 24px rgba(0,0,0,0.25);
          backdrop-filter: blur(8px);
        }
        .x2md-btn:hover {
          background: rgba(18, 18, 18, 0.98);
        }
        .x2md-btn:active {
          transform: translateY(1px);
        }
        .x2md-tooltip {
          position: absolute;
          right: 58px;
          bottom: 8px;
          background: rgba(17, 17, 17, 0.92);
          color: #fff;
          font-size: 12px;
          padding: 6px 10px;
          border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          opacity: 0;
          pointer-events: none;
          transform: translateY(4px);
          transition: opacity 140ms ease, transform 140ms ease;
          white-space: nowrap;
        }
        .x2md-launcher:hover .x2md-tooltip {
          opacity: 1;
          transform: translateY(0);
        }
        .x2md-icon {
          width: 22px;
          height: 22px;
          display: block;
          fill: currentColor;
        }
        @media (prefers-color-scheme: light) {
          .x2md-btn {
            background: rgba(255, 255, 255, 0.94);
            color: #111;
            border: 1px solid rgba(0, 0, 0, 0.08);
            box-shadow: 0 10px 24px rgba(0,0,0,0.12);
          }
          .x2md-btn:hover {
            background: rgba(255, 255, 255, 0.98);
          }
          .x2md-tooltip {
            background: rgba(255, 255, 255, 0.98);
            color: #111;
            border: 1px solid rgba(0, 0, 0, 0.08);
          }
        }
        .x2md-panel {
          display: none;
          position: fixed;
          bottom: 64px;
          right: 16px;
          z-index: 2147483647;
          width: 280px;
          background: #fff;
          color: #111;
          border: 1px solid #e3e3e3;
          border-radius: 12px;
          padding: 12px;
          box-shadow: 0 12px 30px rgba(0,0,0,0.18);
          font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
        }
        .x2md-panel h3 {
          margin: 0 0 8px 0;
          font-size: 14px;
          font-weight: 600;
        }
        .x2md-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 6px 0;
          font-size: 12px;
        }
        .x2md-actions {
          display: flex;
          gap: 8px;
          margin-top: 10px;
        }
        .x2md-action {
          flex: 1;
          padding: 8px 10px;
          border-radius: 8px;
          border: 1px solid #ddd;
          background: #f7f7f7;
          cursor: pointer;
          font-size: 12px;
        }
        .x2md-close {
          position: absolute;
          top: 8px;
          right: 10px;
          font-size: 14px;
          cursor: pointer;
        }
        .x2md-note {
          margin-top: 8px;
          font-size: 11px;
          color: #666;
        }
        .x2md-toast {
          position: fixed;
          bottom: 16px;
          left: 16px;
          z-index: 2147483647;
          background: #111;
          color: #fff;
          padding: 8px 10px;
          border-radius: 8px;
          font-size: 12px;
          opacity: 0;
          transform: translateY(6px);
          transition: opacity 160ms ease, transform 160ms ease;
        }
        .x2md-toast.show {
          opacity: 1;
          transform: translateY(0);
        }
      </style>
      <div class="x2md-launcher">
        <button class="x2md-btn" id="x2md-toggle" aria-label="Output to Markdown" title="Output to Markdown">
          <svg class="x2md-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 4h10v2H6v12h12v-8h2v10H4V4z"></path>
            <path d="M14 4h6v6h-2V7.41l-7.29 7.3-1.42-1.42L16.59 6H14V4z"></path>
          </svg>
        </button>
        <div class="x2md-tooltip">Output to Markdown</div>
      </div>
      <div class="x2md-panel" id="x2md-panel">
        <div class="x2md-close" id="x2md-close">x</div>
        <h3>Export Options</h3>
        <label class="x2md-row"><input type="checkbox" id="x2md-include-comments" /> Include comments</label>
        <label class="x2md-row"><input type="checkbox" id="x2md-include-media" checked /> Include media links</label>
        <label class="x2md-row"><input type="checkbox" id="x2md-include-metadata" checked /> Include metadata block</label>
        <label class="x2md-row"><input type="checkbox" id="x2md-expand-text" checked /> Expand truncated text</label>
        <label class="x2md-row"><input type="checkbox" id="x2md-auto-load" checked /> Auto-load thread (scroll)</label>
        <div class="x2md-actions">
          <button class="x2md-action" id="x2md-copy">Copy</button>
          <button class="x2md-action" id="x2md-download">Download</button>
        </div>
        <div class="x2md-note">Only visible replies are included. Scroll to load more, then re-run.</div>
      </div>
      <div class="x2md-toast" id="x2md-toast"></div>
    `;

    if (!mountRoot(root)) {
      const observer = new MutationObserver(() => {
        if (mountRoot(root)) observer.disconnect();
      });
      observer.observe(document, { childList: true, subtree: true });
    }

    const toggleBtn = shadow.getElementById("x2md-toggle");
    const panel = shadow.getElementById("x2md-panel");
    const closeBtn = shadow.getElementById("x2md-close");
    const toast = shadow.getElementById("x2md-toast");

    function showToast(message) {
      toast.textContent = message;
      toast.classList.add("show");
      setTimeout(() => toast.classList.remove("show"), 1600);
    }

    function setPanelVisible(next) {
      panelVisible = next;
      panel.style.display = panelVisible ? "block" : "none";
    }

    toggleBtn.addEventListener("click", () => setPanelVisible(!panelVisible));
    closeBtn.addEventListener("click", () => setPanelVisible(false));

    shadow.getElementById("x2md-copy").addEventListener("click", async () => {
      const options = readOptions(shadow);
      const result = await exportMarkdown(options);
      if (!result.ok) return showToast(result.message);
      try {
        await navigator.clipboard.writeText(result.markdown);
        showToast("Copied Markdown to clipboard");
      } catch (err) {
        showToast("Clipboard failed. Try Download.");
      }
    });

    shadow.getElementById("x2md-download").addEventListener("click", async () => {
      const options = readOptions(shadow);
      const result = await exportMarkdown(options);
      if (!result.ok) return showToast(result.message);
      downloadMarkdown(result.markdown, result.filename);
      showToast("Downloaded Markdown");
    });

    if (ext && ext.runtime && ext.runtime.onMessage) {
      ext.runtime.onMessage.addListener((message) => {
        if (message && message.type === "X2MD_TOGGLE_PANEL") {
          setPanelVisible(!panelVisible);
        }
      });
    }
  }

  function readOptions(shadow) {
    return {
      includeComments: shadow.getElementById("x2md-include-comments").checked,
      includeMedia: shadow.getElementById("x2md-include-media").checked,
      includeMetadata: shadow.getElementById("x2md-include-metadata").checked,
      expandText: shadow.getElementById("x2md-expand-text").checked,
      autoLoad: shadow.getElementById("x2md-auto-load").checked
    };
  }

  async function exportMarkdown(options) {
    const context = getPageContext();
    const articleRoot = document.querySelector('[data-testid="twitterArticleReadView"]');

    if (!context.isStatus && !context.isArticle && !articleRoot) {
      return {
        ok: false,
        message: "Open a specific post or article to export"
      };
    }

    const tweetContainer = getTweetContainer(context);

    if (articleRoot || context.isArticle) {
      const article = extractArticle(articleRoot);
      if (!article || (!article.title && !article.blocks.length)) {
        return { ok: false, message: "Unable to read article content" };
      }
      let comments = [];
      if (options.includeComments) {
        const tweets = options.autoLoad
          ? await collectTweetsWithAutoLoad(context, tweetContainer, options)
          : collectTweets(context, tweetContainer);
        comments = filterCommentsForAuthor(tweets, context.authorFromUrl);
      }
      const markdown = buildArticleMarkdown(article, comments, context, options);
      const filename = buildFilename(context, "article");
      return { ok: true, markdown, filename };
    }

    const tweets = options.autoLoad
      ? await collectTweetsWithAutoLoad(context, tweetContainer, options)
      : collectTweets(context, tweetContainer, options);

    if (!tweets.length) {
      return {
        ok: false,
        message: "No posts found on this page"
      };
    }

    const markdown = buildMarkdown(tweets, context, options);
    const filename = buildFilename(context, "status");

    return { ok: true, markdown, filename };
  }

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function expandTruncatedText(container) {
    const scope = container || document;
    const selectors = ['[data-testid="tweet-text-show-more-link"]'];
    const buttons = new Set();
    selectors.forEach((sel) => {
      scope.querySelectorAll(sel).forEach((el) => buttons.add(el));
    });
    buttons.forEach((btn) => {
      try {
        btn.click();
      } catch (_) {}
    });
  }

  async function collectTweetsWithAutoLoad(context, container, options) {
    if (!context.isStatus) {
      return collectTweets(context, container);
    }

    const seen = new Map();
    const orderRef = { value: 0 };
    const maxRounds = options.includeComments ? 10 : 7;
    let lastCount = container.querySelectorAll('article[data-testid="tweet"]').length;
    let idleRounds = 0;

    for (let i = 0; i < maxRounds; i++) {
      if (options.expandText) {
        expandTruncatedText(container);
        await sleep(120);
      }
      collectTweets(context, container, options, seen, orderRef);

      window.scrollBy(0, Math.floor(window.innerHeight * 0.9));
      await sleep(650);

      const count = container.querySelectorAll('article[data-testid="tweet"]').length;
      if (count > lastCount) {
        lastCount = count;
        idleRounds = 0;
      } else {
        idleRounds += 1;
      }

      if (idleRounds >= 2) break;
    }

    if (options.expandText) {
      expandTruncatedText(container);
      await sleep(120);
    }
    collectTweets(context, container, options, seen, orderRef);

    return Array.from(seen.values());
  }

  function getPageContext() {
    const statusMatch = window.location.pathname.match(/^\/([^/]+)\/status\/(\d+)/);
    const threadMatch = window.location.pathname.match(/^\/([^/]+)\/thread\/(\d+)/);
    const articleMatch = window.location.pathname.match(/^\/([^/]+)\/article\/(\d+)/);
    const handle = statusMatch
      ? statusMatch[1]
      : threadMatch
        ? threadMatch[1]
        : articleMatch
          ? articleMatch[1]
          : "";
    const authorFromUrl = handle ? `@${handle}` : "";
    const statusId = statusMatch ? statusMatch[2] : threadMatch ? threadMatch[2] : "";
    const articleId = articleMatch ? articleMatch[2] : "";
    return {
      authorFromUrl,
      statusId,
      articleId,
      isStatus: Boolean(statusMatch || threadMatch),
      isArticle: Boolean(articleMatch),
      isThread: Boolean(threadMatch),
      url: window.location.href
    };
  }

  function collectTweets(context, container, options, existing, orderRef) {
    const scope = container || document;
    const articles = Array.from(scope.querySelectorAll("article[data-testid=\"tweet\"]"));
    const seen = existing || new Map();
    let order = orderRef ? orderRef.value : 0;

    for (const article of articles) {
      const tweet = extractTweet(article);
      if (!tweet || !tweet.url) continue;
      if (!tweet.id) continue;
      if (!seen.has(tweet.id)) {
        if (!tweet.authorHandle && context.authorFromUrl) {
          tweet.authorHandle = context.authorFromUrl;
        }
        tweet.domOrder = order;
        order += 1;
        seen.set(tweet.id, tweet);
      }
    }

    if (orderRef) orderRef.value = order;
    return existing ? Array.from(seen.values()) : Array.from(seen.values());
  }

  function getTweetContainer(context) {
    if (!context || !context.isStatus || !context.statusId) {
      return document;
    }
    const rootLink = document.querySelector(`a[href*="/status/${context.statusId}"]`);
    const rootArticle = rootLink ? rootLink.closest("article") : null;
    if (!rootArticle) return document;

    let node = rootArticle.parentElement;
    while (node) {
      const label = (node.getAttribute("aria-label") || "").toLowerCase();
      if (label.includes("timeline")) return node;
      node = node.parentElement;
    }

    return rootArticle.closest("main") || rootArticle.closest('[data-testid="primaryColumn"]') || document;
  }

  function extractArticle(articleRoot) {
    if (!articleRoot) return null;
    const titleEl = articleRoot.querySelector('[data-testid="twitter-article-title"]');
    const title = titleEl ? titleEl.textContent.trim() : "";
    const coverImg = articleRoot.querySelector('div[data-testid="tweetPhoto"] img');
    const coverUrl = coverImg ? (coverImg.currentSrc || coverImg.src || "") : "";

    const blocks = [];
    const richRoot = articleRoot.querySelector('[data-testid="longformRichTextComponent"]');
    if (richRoot) {
      const blockEls = richRoot.querySelectorAll(".public-DraftStyleDefault-block");
      blockEls.forEach((block) => {
        const text = serializeRichText(block);
        if (text) blocks.push(text);
      });
    }

    return { title, coverUrl, blocks };
  }

  function serializeRichText(root) {
    const parts = [];
    function walk(node) {
      if (node.nodeType === Node.TEXT_NODE) {
        parts.push(node.textContent);
        return;
      }
      if (node.nodeType !== Node.ELEMENT_NODE) return;
      const el = node;
      if (el.tagName === "BR") {
        parts.push("\n");
        return;
      }
      if (el.tagName === "IMG") {
        const alt = el.getAttribute("alt");
        if (alt) parts.push(alt);
        return;
      }
      if (el.tagName === "A") {
        let href = el.getAttribute("href") || "";
        if (href.startsWith("/")) href = `${location.origin}${href}`;
        const text = el.textContent || href;
        if (href) {
          parts.push(`[${text}](${href})`);
        } else {
          parts.push(text);
        }
        return;
      }
      for (const child of el.childNodes) walk(child);
    }
    walk(root);
    return normalizeText(parts.join(""));
  }

  function extractTweet(article) {
    const user = parseUserName(article.querySelector('[data-testid="User-Name"]'));
    const replyToHandle = extractReplyToHandle(article);
    const timeEl = article.querySelector("time");
    const timeLink = timeEl ? timeEl.closest("a") : null;
    const statusLink = timeLink || article.querySelector('a[href*="/status/"]');
    const url = statusLink ? statusLink.href : "";
    const idMatch = url.match(/status\/(\d+)/);
    const id = idMatch ? idMatch[1] : "";
    const datetime = timeEl ? timeEl.getAttribute("datetime") : "";
    const textEl = article.querySelector('[data-testid="tweetText"]');
    const text = textEl ? serializeTweetText(textEl).trim() : "";
    const media = collectMedia(article);

    return {
      id,
      url,
      datetime,
      text,
      media,
      replyToHandle,
      authorHandle: user.handle,
      authorName: user.displayName
    };
  }

  function extractReplyToHandle(article) {
    const replyRoot = article.querySelector('[data-testid="reply"]');
    if (replyRoot) {
      const handle = extractHandleFromLinks(replyRoot);
      if (handle) return handle;
    }

    const spans = Array.from(article.querySelectorAll("span"));
    for (const span of spans) {
      const text = (span.textContent || "").trim();
      if (!text || !text.toLowerCase().includes("replying to")) continue;
      const handle = extractHandleFromLinks(span.parentElement || span);
      if (handle) return handle;
    }
    return "";
  }

  function extractHandleFromLinks(root) {
    if (!root) return "";
    const link = root.querySelector('a[href^="/"]');
    if (!link) return "";
    const href = link.getAttribute("href") || "";
    const match = href.match(/^\/([A-Za-z0-9_]+)(?:$|[/?#])/);
    if (match) return `@${match[1]}`;
    const text = (link.textContent || "").trim();
    return text.startsWith("@") ? text : "";
  }

  function parseUserName(userNameEl) {
    if (!userNameEl) return { displayName: "", handle: "" };
    let handle = "";
    const anchors = Array.from(userNameEl.querySelectorAll('a[href^="/"]'));
    for (const a of anchors) {
      const href = a.getAttribute("href") || "";
      if (href.includes("/status/")) continue;
      const match = href.match(/^\/([A-Za-z0-9_]+)(?:$|[/?#])/);
      if (match) {
        handle = `@${match[1]}`;
        break;
      }
    }

    const spans = Array.from(userNameEl.querySelectorAll("span"));
    let displayName = "";
    for (const span of spans) {
      const t = (span.textContent || "").trim();
      if (t && !t.startsWith("@")) {
        displayName = t;
        break;
      }
    }

    const text = (userNameEl.textContent || "").trim();
    if (!handle) {
      const handleMatch = text.match(/@[A-Za-z0-9_]+/);
      handle = handleMatch ? handleMatch[0] : "";
    }
    if (!displayName) {
      displayName = text.replace(handle, "").trim();
    }
    return { displayName, handle };
  }

  function serializeTweetText(root) {
    const parts = [];
    function walk(node) {
      if (node.nodeType === Node.TEXT_NODE) {
        parts.push(node.textContent);
        return;
      }
      if (node.nodeType !== Node.ELEMENT_NODE) return;

      const el = node;
      if (el.tagName === "BR") {
        parts.push("\n");
        return;
      }
      if (el.tagName === "IMG") {
        const alt = el.getAttribute("alt");
        if (alt) parts.push(alt);
        return;
      }
      if (el.tagName === "A") {
        let href = el.getAttribute("href") || "";
        if (href.startsWith("/")) href = `${location.origin}${href}`;
        const text = el.textContent || href;
        if (href) {
          parts.push(`[${text}](${href})`);
        } else {
          parts.push(text);
        }
        return;
      }
      for (const child of el.childNodes) walk(child);
    }
    walk(root);
    return normalizeText(parts.join(""));
  }

  function normalizeText(text) {
    return text
      .replace(/\u00A0/g, " ")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  function collectMedia(article) {
    const media = [];
    const images = article.querySelectorAll('div[data-testid="tweetPhoto"] img');
    images.forEach((img) => {
      const url = img.currentSrc || img.src;
      if (!url) return;
      media.push({ type: "image", url, alt: img.alt || "" });
    });

    const videos = article.querySelectorAll("video");
    videos.forEach((video) => {
      const src = video.currentSrc || video.src || "";
      const poster = video.poster || "";
      media.push({ type: "video", url: src, poster });
    });

    return media;
  }

  function buildMarkdown(tweets, context, options) {
    const statusId = context.statusId;
    const rootTweet = statusId ? tweets.find((t) => t.id === statusId) : tweets[0];
    const authorHandle = context.authorFromUrl || (rootTweet ? rootTweet.authorHandle : "");
    const authorName = rootTweet ? rootTweet.authorName : "";

    const hasAuthor = Boolean(authorHandle);
    const authorTweets = hasAuthor
      ? tweets.filter((t) => t.authorHandle && t.authorHandle.toLowerCase() === authorHandle.toLowerCase())
      : [];
    const commentTweets = filterCommentsForAuthor(tweets, authorHandle);

    const lines = [];
    if (options.includeMetadata) {
      lines.push("---");
      lines.push("source: x");
      lines.push(`url: ${context.url}`);
      lines.push(`exported_at: ${new Date().toISOString()}`);
      if (authorHandle) lines.push(`author: ${authorHandle}`);
      lines.push(`thread: ${authorTweets.length > 1}`);
      lines.push(`comments_included: ${options.includeComments}`);
      lines.push("---", "");
    }

    if (authorName || authorHandle) {
      const title = [authorName, authorHandle].filter(Boolean).join(" ");
      lines.push(`# ${title}`);
      lines.push("");
    }

    const orderedAuthorTweets = sortTweets(authorTweets).filter(
      (t) => !t.replyToHandle || t.replyToHandle.toLowerCase() === authorHandle.toLowerCase()
    );
    const orderedComments = sortTweets(commentTweets);

    if (orderedAuthorTweets.length) {
      lines.push("## Thread");
      lines.push("");
      orderedAuthorTweets.forEach((tweet) => {
        lines.push(...formatTweet(tweet, options));
      });
    } else {
      lines.push("## Post");
      lines.push("");
      sortTweets(tweets).forEach((tweet) => {
        lines.push(...formatTweet(tweet, options));
      });
    }

    if (options.includeComments && orderedComments.length) {
      lines.push("");
      lines.push("## Comments");
      lines.push("");
      orderedComments.forEach((tweet) => {
        lines.push(...formatTweet(tweet, options));
      });
    }

    return lines.join("\n").trim() + "\n";
  }

  function buildArticleMarkdown(article, comments, context, options) {
    const lines = [];
    const authorHandle = context.authorFromUrl || "";

    if (options.includeMetadata) {
      lines.push("---");
      lines.push("source: x");
      lines.push("content_type: article");
      lines.push(`url: ${context.url}`);
      lines.push(`exported_at: ${new Date().toISOString()}`);
      if (authorHandle) lines.push(`author: ${authorHandle}`);
      lines.push(`comments_included: ${options.includeComments}`);
      lines.push("---", "");
    }

    if (article.title) {
      lines.push(`# ${article.title}`);
      lines.push("");
    }
    if (options.includeMedia && article.coverUrl) {
      lines.push(`![cover](${article.coverUrl})`);
      lines.push("");
    }

    if (article.blocks.length) {
      article.blocks.forEach((block) => {
        lines.push(block);
        lines.push("");
      });
    }

    if (options.includeComments && comments.length) {
      lines.push("## Comments");
      lines.push("");
      comments.forEach((tweet) => {
        lines.push(...formatTweet(tweet, options));
      });
    }

    return lines.join("\n").trim() + "\n";
  }

  function filterCommentsForAuthor(tweets, authorHandle) {
    const hasAuthor = Boolean(authorHandle);
    return hasAuthor
      ? tweets.filter((t) => !t.authorHandle || t.authorHandle.toLowerCase() !== authorHandle.toLowerCase())
      : [];
  }

  function sortTweets(tweets) {
    const withKeys = tweets.map((tweet) => {
      const timeMs = tweet.datetime ? Date.parse(tweet.datetime) : NaN;
      let idBig = null;
      if (tweet.id) {
        try {
          idBig = BigInt(tweet.id);
        } catch (_) {
          idBig = null;
        }
      }
      return { tweet, timeMs, idBig };
    });

    withKeys.sort((a, b) => {
      const aHasTime = Number.isFinite(a.timeMs);
      const bHasTime = Number.isFinite(b.timeMs);
      if (aHasTime && bHasTime && a.timeMs !== b.timeMs) {
        return a.timeMs - b.timeMs;
      }
      if (aHasTime && !bHasTime) return -1;
      if (!aHasTime && bHasTime) return 1;
      if (a.idBig !== null && b.idBig !== null && a.idBig !== b.idBig) {
        return a.idBig < b.idBig ? -1 : 1;
      }
      const aOrder = Number.isFinite(a.tweet.domOrder) ? a.tweet.domOrder : 0;
      const bOrder = Number.isFinite(b.tweet.domOrder) ? b.tweet.domOrder : 0;
      return aOrder - bOrder;
    });

    return withKeys.map((entry) => entry.tweet);
  }

  function formatTweet(tweet, options) {
    const lines = [];
    const dateLabel = tweet.datetime ? tweet.datetime : "";
    const headerParts = [dateLabel, tweet.url].filter(Boolean);
    const header = headerParts.join(" - ");
    lines.push(`### ${header}`.trim());
    if (tweet.authorHandle && tweet.authorName) {
      lines.push(`Author: ${tweet.authorName} (${tweet.authorHandle})`);
    } else if (tweet.authorHandle) {
      lines.push(`Author: ${tweet.authorHandle}`);
    }
    if (tweet.text) {
      lines.push("");
      lines.push(tweet.text);
    }
    if (options.includeMedia && tweet.media.length) {
      lines.push("");
      lines.push("Media:");
      tweet.media.forEach((item) => {
        if (item.type === "image") {
          const alt = item.alt ? item.alt : "image";
          lines.push(`- ![${alt}](${item.url})`);
        } else if (item.type === "video") {
          const label = item.url ? item.url : "video";
          lines.push(`- Video: ${label}`);
          if (item.poster) lines.push(`- Poster: ${item.poster}`);
        }
      });
    }
    lines.push("");
    return lines;
  }

  function buildFilename(context, kind) {
    const date = new Date().toISOString().slice(0, 10);
    if (kind === "article") {
      const id = context.articleId || context.statusId || "article";
      return `x-article-${id}-${date}.md`;
    }
    const id = context.statusId || "post";
    return `x-${id}-${date}.md`;
  }

  function downloadMarkdown(markdown, filename) {
    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(url);
      a.remove();
    }, 0);
  }

  function mountRoot(root) {
    const target = document.documentElement || document.body;
    if (!target) return false;
    target.appendChild(root);
    return true;
  }

  createUI();
})();
