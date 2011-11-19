function cutSetup(info, tab) {
    chrome.tabs.executeScript(tab.id, {file:"pagecontrolpanel.js"});
    chrome.tabs.executeScript(tab.id, {file:"pagescript.js"});
}

var parent = chrome.contextMenus.create({
    title: "Cut this page down!",
    onclick: cutSetup,
    contexts: ["all"]
});
