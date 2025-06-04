// Used by the manifest v3 extension

chrome.runtime.onInstalled.addListener((object) => {
  if (object.reason === "install") {
    chrome.tabs.query({ url: "*://twitter.com/*" }, (tabs) => {
      tabs.forEach((tab) => {
        chrome.tabs.reload(tab.id);
      });
    });
    chrome.tabs.query({ url: "*://x.com/*" }, (tabs) => {
      tabs.forEach((tab) => {
        chrome.tabs.reload(tab.id);
      });
    });
  }
});

chrome.runtime.onMessage.addListener((message) => {
  switch (message?.type) {
    case "popup":
      chrome.windows.create({
        url: chrome.runtime.getURL("index.html"),
        type: "popup",
        width: 455,
        height: 650,
      });
      break;

    default:
      break;
  }
});
