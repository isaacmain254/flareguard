"use strict";
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
const PRICE_PATTERN = /(?:[$€£]|KES|KSh|USD|EUR)\s?\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?(?:\s?\/\s?(?:mo|month|yr|year))?/i;
function collectSignals() {
    var _a, _b;
    const signals = [];
    // Card fields
    const cardFields = document.querySelectorAll('input[autocomplete^="cc-"], input[name*="card" i], input[name*="cvc" i]');
    if (cardFields.length) {
        signals.push({
            name: "card-fields",
            weight: 5,
            detail: `${cardFields.length} fields`,
        });
    }
    // Provider iframes / scripts
    const embeds = document.querySelectorAll("iframe[src], script[src]");
    for (const el of embeds) {
        try {
            const host = new URL(el.src).hostname;
            if (PROVIDER_HOSTS.some((h) => host.endsWith(h))) {
                signals.push({ name: "payment-provider", weight: 4, detail: host });
                break;
            }
        }
        catch (_c) { }
    }
    // URL
    if (/\/(checkout|pricing|subscribe|billing|payment|cart)/i.test(location.pathname)) {
        signals.push({ name: "url-path", weight: 2, detail: location.pathname });
    }
    // Buttons / links
    const clickable = document.querySelectorAll("button, a[role='button'], input[type='submit']");
    for (const el of clickable) {
        const text = (el.textContent ||
            el.value ||
            "").trim();
        if (text.length < 60 && BUTTON_PATTERNS.some((p) => p.test(text))) {
            signals.push({ name: "payment-button", weight: 2, detail: text });
            break;
        }
    }
    // Prices
    const bodyText = (_b = (_a = document.body) === null || _a === void 0 ? void 0 : _a.innerText.slice(0, 50000)) !== null && _b !== void 0 ? _b : "";
    if (PRICE_PATTERN.test(bodyText)) {
        signals.push({ name: "price-text", weight: 1 });
    }
    return signals;
}
function evaluate() {
    const signals = collectSignals();
    const rawScore = signals.reduce((sum, s) => sum + s.weight, 0);
    const verdict = rawScore >= 5 ? "likely" : rawScore >= 3 ? "possible" : "none";
    const score = verdict === "likely" ? 3 : verdict === "possible" ? 2 : 1;
    chrome.runtime.sendMessage({
        type: "SCAN_RESULT",
        url: location.href,
        score,
        verdict,
        signals,
    });
}
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if ((msg === null || msg === void 0 ? void 0 : msg.type) === "SCAN_REQUEST") {
        evaluate();
        sendResponse({ ok: true });
    }
});
// Debounced re-scan for SPAs (React/Next/etc. render after load)
let timer;
const observer = new MutationObserver(() => {
    clearTimeout(timer);
    timer = window.setTimeout(evaluate, 800);
});
observer.observe(document.documentElement, { childList: true, subtree: true });
evaluate();
