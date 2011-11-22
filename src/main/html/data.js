/*
 * PageExtractor - An interactive page splitter
 *
 * Copyright(c) 2011 Olivier Favre <of.olivier.favre@gmail.com>
 * See LICENSE file.
 */

if (!window.PageExtractor) window.PageExtractor = {};
if (!window.PageExtractor.Html) window.PageExtractor.Html = { super: PageExtractor, root: window.PageExtractor };
if (!window.PageExtractor.Html.Data) window.PageExtractor.Html.Data = { super: window.PageExtractor.Html, root: window.PageExtractor };

// Inspired by jQuery.data()
window.PageExtractor.Html.Data.dataCache = {};
window.PageExtractor.Html.Data.next_uuid = 0;
window.PageExtractor.Html.Data.recyclable_uuids = [];

window.PageExtractor.Html.Data.getDataFrom = function (node) {
    if (!node) return undefined;
    var uuid;
    if (!node.hasAttribute("data-PageExtractor-uuid")) {
        if (this.recyclable_uuids.length > 0)
            uuid = this.recyclable_uuids.shift();
        else
            uuid = ++this.next_uuid;
        node.setAttribute("data-PageExtractor-uuid", uuid);
    } else {
        uuid = parseInt(node.getAttribute("data-PageExtractor-uuid"));
    }
    var rtn = this.dataCache[uuid];
    if (rtn == undefined) {
        rtn = this.dataCache[uuid] = {};
    }
    return rtn;
}

window.PageExtractor.Html.Data.hasDataFrom = function (node) {
    if (!node || !node.hasAttribute("data-PageExtractor-uuid")) return false;
    var uuid = parseInt(node.getAttribute("data-PageExtractor-uuid"));
    if (!this.dataCache[uuid]) {
        // Shouldn't happen, fix this
        node.removeAttribute("data-PageExtractor-uuid");
        this.recyclable_uuids.push(uuid);
        return false;
    }
    return true;
}

window.PageExtractor.Html.Data.removeDataFrom = function (node) {
    if (!node || !node.hasAttribute("data-PageExtractor-uuid")) return;
    var uuid = parseInt(node.getAttribute("data-PageExtractor-uuid"));
    node.removeAttribute("data-PageExtractor-uuid");
    delete this.dataCache[uuid];
    this.recyclable_uuids.push(uuid);
}
