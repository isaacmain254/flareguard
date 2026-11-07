// background.ts
chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg.type !== "SCAN_RESULT" || sender.frameId !== 0 || !sender.tab?.id) return;
  const tabId = sender.tab.id;
  const key = `tab:${tabId}`;

  chrome.storage.session.get(key, (prev) => {
    const wasFlagged = prev[key]?.verdict && prev[key].verdict !== "none";
    const isFlagged = msg.verdict !== "none";
    if (isFlagged && !wasFlagged) {
      chrome.storage.local.get("threatsStopped", (stored) => {
        chrome.storage.local.set({
          threatsStopped: (stored.threatsStopped || 0) + 1,
        });
      });
    }

    chrome.storage.session.set({ [key]: msg });
  });

  chrome.action.setBadgeText({
    tabId,
    text:
      msg.verdict === "likely" ? "$" : msg.verdict === "possible" ? "?" : "",
  });
  chrome.action.setBadgeBackgroundColor({
    tabId,
    color: msg.verdict === "likely" ? "#d33" : "#e90",
  });
});
