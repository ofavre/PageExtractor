/*
 * PageExtractor - An interactive page splitter
 *
 * Copyright(c) 2011 Olivier Favre <of.olivier.favre@gmail.com>
 * See LICENSE file.
 */

function cutSetup(info, tab) {
    chrome.tabs.executeScript(tab.id, {file:"src/controlpanel/pagecontrolpanel.js"});
    chrome.tabs.executeScript(tab.id, {file:"src/main/html/attrs.js"});
    chrome.tabs.executeScript(tab.id, {file:"src/main/html/data.js"});
    chrome.tabs.executeScript(tab.id, {file:"src/main/ui/manip.js"});
    chrome.tabs.executeScript(tab.id, {file:"src/main/ui/arff.js"});
    chrome.tabs.executeScript(tab.id, {file:"src/main/algo/data.js"});
    chrome.tabs.executeScript(tab.id, {file:"src/main/algo/stats.js"});
    chrome.tabs.executeScript(tab.id, {file:"src/main/algo/xpath.js"});
    chrome.tabs.executeScript(tab.id, {file:"src/main/algo/main.js"});
    chrome.tabs.executeScript(tab.id, {file:"src/main/setup.js"});
}

var parent = chrome.contextMenus.create({
    title: "Cut this page down!",
    onclick: cutSetup,
    contexts: ["all"]
});
