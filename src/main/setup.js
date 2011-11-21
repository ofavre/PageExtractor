/*
 * PageExtractor - An interactive page splitter
 *
 * Copyright(c) 2011 Olivier Favre <of.olivier.favre@gmail.com>
 * See LICENSE file.
 */

function installCss() {
    if (!document.getElementById("PageExtractorCss")) {
        // The following call leverages a regex for chrome.extension.getURL() incrustation
        chrome.extension.sendRequest({action: "fetchExtensionFile", file: "src/css/pagecss.css"}, function(response) {
            var css = document.createElement("style");
            css.id = "PageExtractorCss";
            css.type = "text/css";
            css.innerHTML = response;
            document.head.appendChild(css);
        });
    }
}
function removeCss() {
    var ctrl = document.getElementById("PageExtractorCss");
    if (!ctrl) return;
    if (!ctrl.parentNode) return;
    ctrl.parentNode.removeChild(ctrl);
}
function installControlPanel() {
    chrome.extension.sendRequest({action: "fetchExtensionFile", file: "src/controlpanel/pagecontrolpanel.html"}, function(response) {
        var d = document.createElement('div');
        d.id = "PageExtractorControlPanel";
        d.className = "PageExtractorControlPanel";
        d.innerHTML = response; //WARN: if using outerHTML, call d=document.getElementById("PageExtractorControlPanel"); right after!
        document.body.appendChild(d);
        initControlPanel(d);
    });
}
function removeControlPanel() {
    var ctrl = document.getElementById("PageExtractorControlPanel");
    if (!ctrl) return;
    if (!ctrl.parentNode) return;
    ctrl.parentNode.removeChild(ctrl);
}
function PageExtractorSetup() {
    if (document.getElementById("PageExtractorControlPanel")) {
        console.log("PageExtractor control panel already existing");
        return;
    }
    installCss();
    document.addEventListener("click", elementClicked, true);
    installControlPanel();
}
function PageExtractorTearDown() {
    if (!document.getElementById("PageExtractorControlPanel"))
        return;
    removeCss();
    document.removeEventListener("click", elementClicked, true);
    removeControlPanel();
    clearExamples();
    clearResults();
}

PageExtractorSetup();

console.log(Thing);