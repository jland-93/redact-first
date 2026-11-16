chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({ id: "redact-first", title: "Redact First: hide private details", contexts: ["selection"] });
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== "redact-first") return;
  await chrome.sidePanel.open({ windowId: tab.windowId });
  await chrome.storage.session.set({ pending: { text: info.selectionText, at: Date.now() } });
});
