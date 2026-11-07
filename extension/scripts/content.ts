type Signal = { name: string; weight: number; detail?: string };

const PROVIDER_HOSTS = [
  "js.stripe.com",
  "paypal.com",
  "checkout.paddle.com",
  "paystack.co",
  "flutterwave.com",
  "klarna.com",
  "mollie.com",
];

const BUTTON_PATTERNS = [
  /\b(pay now|buy now|book now|subscribe|upgrade|checkout|place order|start (your )?free trial|make payment|proceed to pay|confirm order)\b/i,
  /\b(lipa sasa|nunua sasa|jiunge|nunua|lipa|kamilisha agizo|weka agizo|anza jaribio la bure)\b/i,
];

const PRICE_PATTERN =
  /(?:[$€£]|KES|KSh|USD|EUR)\s?\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?(?:\s?\/\s?(?:mo|month|yr|year))?/i;

function collectSignals(): Signal[] {
  const signals: Signal[] = [];

  // Card fields
  const cardFields = document.querySelectorAll(
    'input[autocomplete^="cc-"], input[name*="card" i], input[name*="cvc" i]',
  );
  if (cardFields.length) {
    signals.push({
      name: "card-fields",
      weight: 5,
      detail: `${cardFields.length} fields`,
    });
  }

  // Provider iframes / scripts
  const embeds = document.querySelectorAll<
    HTMLIFrameElement | HTMLScriptElement
  >("iframe[src], script[src]");
  for (const el of embeds) {
    try {
      const host = new URL(el.src).hostname;
      if (PROVIDER_HOSTS.some((h) => host.endsWith(h))) {
        signals.push({ name: "payment-provider", weight: 4, detail: host });
        break;
      }
    } catch {}
  }

  // URL
  if (
    /\/(checkout|pricing|subscribe|billing|payment|cart)/i.test(
      location.pathname,
    )
  ) {
    signals.push({ name: "url-path", weight: 2, detail: location.pathname });
  }

  // Buttons / links
  const clickable = document.querySelectorAll(
    "button, a[role='button'], input[type='submit']",
  );
  for (const el of clickable) {
    const text = (
      el.textContent ||
      (el as HTMLInputElement).value ||
      ""
    ).trim();
    if (text.length < 60 && BUTTON_PATTERNS.some((p) => p.test(text))) {
      signals.push({ name: "payment-button", weight: 2, detail: text });
      break;
    }
  }

  // Prices
  const bodyText = document.body?.innerText.slice(0, 50_000) ?? "";
  if (PRICE_PATTERN.test(bodyText)) {
    signals.push({ name: "price-text", weight: 1 });
  }

  return signals;
}

function evaluate() {
  const signals = collectSignals();
  const score = signals.reduce((sum, s) => sum + s.weight, 0);
  const verdict = score >= 5 ? "likely" : score >= 3 ? "possible" : "none";

  chrome.runtime.sendMessage({
    type: "SCAN_RESULT",
    url: location.href,
    score,
    verdict,
    signals,
  });
}

// Debounced re-scan for SPAs (React/Next/etc. render after load)
let timer: number | undefined;
const observer = new MutationObserver(() => {
  clearTimeout(timer);
  timer = window.setTimeout(evaluate, 800);
});
observer.observe(document.documentElement, { childList: true, subtree: true });

evaluate();
