"use strict";
// background.ts
chrome.runtime.onMessage.addListener((msg, sender) => {
    var _a;
    if (msg.type !== "SCAN_RESULT" || !((_a = sender.tab) === null || _a === void 0 ? void 0 : _a.id))
        return;
    const tabId = sender.tab.id;
    // Only the top frame decides the badge, but merge iframe results if you want
    chrome.storage.session.set({ [`tab:${tabId}`]: msg });
    chrome.action.setBadgeText({
        tabId,
        text: msg.verdict === "likely" ? "$" : msg.verdict === "possible" ? "?" : "",
    });
    chrome.action.setBadgeBackgroundColor({
        tabId,
        color: msg.verdict === "likely" ? "#d33" : "#e90",
    });
});
