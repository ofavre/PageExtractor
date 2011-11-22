/*
 * PageExtractor - An interactive page splitter
 *
 * Copyright(c) 2011 Olivier Favre <of.olivier.favre@gmail.com>
 * See LICENSE file.
 */

if (!window.PageExtractor) window.PageExtractor = {};
if (!window.PageExtractor.Setup) window.PageExtractor.Setup = { super: PageExtractor, root: window.PageExtractor };

window.PageExtractor.Setup.installCss = function () {
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

window.PageExtractor.Setup.removeCss = function () {
    var ctrl = document.getElementById("PageExtractorCss");
    if (!ctrl) return;
    if (!ctrl.parentNode) return;
    ctrl.parentNode.removeChild(ctrl);
}

window.PageExtractor.Setup.installControlPanel = function () {
    var that = this;
    chrome.extension.sendRequest({action: "fetchExtensionFile", file: "src/controlpanel/pagecontrolpanel.html"}, function(response) {
        var d = document.createElement('div');
        d.id = "PageExtractorControlPanel";
        d.className = "PageExtractorControlPanel";
        d.innerHTML = response; //WARN: if using outerHTML, call d=document.getElementById("PageExtractorControlPanel"); right after!
        document.body.appendChild(d);
        that.initControlPanel(d);
    });
}

window.PageExtractor.Setup.removeControlPanel = function () {
    var ctrl = document.getElementById("PageExtractorControlPanel");
    if (!ctrl) return;
    if (!ctrl.parentNode) return;
    ctrl.parentNode.removeChild(ctrl);
}

window.PageExtractor.Setup.setup = function () {
    if (document.getElementById("PageExtractorControlPanel")) {
        console.log("PageExtractor control panel already existing");
        return;
    }
    this.installCss();
    document.addEventListener("click", this.root.Ui.Manip.elementClicked, true);
    this.installControlPanel();
}

window.PageExtractor.Setup.tearDown = function () {
    if (!document.getElementById("PageExtractorControlPanel"))
        return;
    this.removeCss();
    document.removeEventListener("click", this.root.Ui.Manip.elementClicked, true);
    this.removeControlPanel();
    this.root.Ui.Manip.clearExamples();
    this.root.Ui.Manip.clearResults();
}

/***
 * window.PageExtractor.Setup.setup() is to be called once every module is loaded.
 ***/
