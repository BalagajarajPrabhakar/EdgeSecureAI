chrome.runtime.onInstalled.addListener(() => {
  // Create the context menu option
  chrome.contextMenus.create({
    id: "getSelectedText",
    title: "Get Selected Text",
    contexts: ["selection"], // Show only when text is selected
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "getSelectedText") {
    // Inject content script to the active tab
    chrome.scripting.executeScript(
      {
        target: { tabId: tab.id },
        files: ["content-script.js"]
      },
      () => {
        chrome.tabs.sendMessage(tab.id, { action: "getSelectedText" }, (response) => {
          if (chrome.runtime.lastError) {
            console.error(chrome.runtime.lastError.message);
            alert("Error: Unable to fetch selected text.");
            return;
          }

          if (response?.selectedText) {
            alert(`Selected Text: ${response.selectedText}`);
          } else {
            alert("No text selected!");
          }
        });
      }
    );
  }
});
