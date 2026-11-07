// background.ts
chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg.type !== "SCAN_RESULT" || !sender.tab?.id) return;
  const tabId = sender.tab.id;

  // Only the top frame decides the badge, but merge iframe results if you want
  chrome.storage.session.set({ [`tab:${tabId}`]: msg });

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
