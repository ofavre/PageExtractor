/*
 * PageExtractor - An interactive page splitter
 *
 * Copyright(c) 2011 Olivier Favre <of.olivier.favre@gmail.com>
 * See LICENSE file.
 */

function cutSetup(info, tab) {
    chrome.tabs.executeScript(tab.id, {file:"pagecontrolpanel.js"});
    chrome.tabs.executeScript(tab.id, {file:"pagescript.js"});
}

var parent = chrome.contextMenus.create({
    title: "Cut this page down!",
    onclick: cutSetup,
    contexts: ["all"]
});
