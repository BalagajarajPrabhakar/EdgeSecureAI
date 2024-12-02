document.getElementById("get-text").addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs || !tabs.length) return;

    chrome.tabs.sendMessage(tabs[0].id, { action: "getSelectedText" }, (response) => {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError.message);
        alert("Error: Unable to fetch selected text.");
        return;
      }

      if (response?.selectedText) {
        document.getElementById("output").textContent = `Selected Text: ${response.selectedText}`;
      } else {
        document.getElementById("output").textContent = "No text selected!";
      }
    });
  });
});
