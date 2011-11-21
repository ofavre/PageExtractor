/*
 * PageExtractor - An interactive page splitter
 *
 * Copyright(c) 2011 Olivier Favre <of.olivier.favre@gmail.com>
 * See LICENSE file.
 */

if (!PageExtractor) PageExtractor = {};
if (!PageExtractor.Html) PageExtractor.Html = { super: PageExtractor, root: PageExtractor };
if (!PageExtractor.Html.Data) PageExtractor.Html.Data = { super: PageExtractor.Html, root: PageExtractor };

// Inspired by jQuery.data()
PageExtractor.Html.Data.dataCache = {};
PageExtractor.Html.Data.next_uuid = 0;
PageExtractor.Html.Data.recyclable_uuids = [];

PageExtractor.Html.Data.getDataFrom = function (node) {
    if (!node) return undefined;
    if (!node.hasAttribute("data-PageExtractor-uuid")) {
        if (recyclable_uuids.length > 0)
            uuid = recyclable_uuids.shift();
        else
            uuid = ++next_uuid;
        node.setAttribute("data-PageExtractor-uuid", uuid);
    } else {
        uuid = parseInt(node.getAttribute("data-PageExtractor-uuid"));
    }
    var rtn = dataCache[uuid];
    if (rtn == undefined) {
        rtn = dataCache[uuid] = {};
    }
    return rtn;
}

PageExtractor.Html.Data.hasDataFrom = function (node) {
    if (!node || !node.hasAttribute("data-PageExtractor-uuid")) return false;
    uuid = parseInt(node.getAttribute("data-PageExtractor-uuid"));
    if (!dataCache[uuid]) {
        // Shouldn't happen, fix this
        node.removeAttribute("data-PageExtractor-uuid");
        recyclable_uuids.push(uuid);
        return false;
    }
    return true;
}

PageExtractor.Html.Data.removeDataFrom = function (node) {
    if (!node || !node.hasAttribute("data-PageExtractor-uuid")) return;
    uuid = parseInt(node.getAttribute("data-PageExtractor-uuid"));
    node.removeAttribute("data-PageExtractor-uuid");
    delete dataCache[uuid];
    recyclable_uuids.push(uuid);
}
