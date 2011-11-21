/*
 * PageExtractor - An interactive page splitter
 *
 * Copyright(c) 2011 Olivier Favre <of.olivier.favre@gmail.com>
 * See LICENSE file.
 */

// Inspired by jQuery.data()
var dataCache = {};
var next_uuid = 0;
var recyclable_uuids = [];
function getDataFrom(node) {
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
function hasDataFrom(node) {
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
function removeDataFrom(node) {
    if (!node || !node.hasAttribute("data-PageExtractor-uuid")) return;
    uuid = parseInt(node.getAttribute("data-PageExtractor-uuid"));
    node.removeAttribute("data-PageExtractor-uuid");
    delete dataCache[uuid];
    recyclable_uuids.push(uuid);
}
