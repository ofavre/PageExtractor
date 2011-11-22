/*
 * PageExtractor - An interactive page splitter
 *
 * Copyright(c) 2011 Olivier Favre <of.olivier.favre@gmail.com>
 * See LICENSE file.
 */

if (!window.PageExtractor) window.PageExtractor = {};
if (!window.PageExtractor.Algo) window.PageExtractor.Algo = { super: PageExtractor, root: window.PageExtractor };
if (!window.PageExtractor.Algo.Data) window.PageExtractor.Algo.Data = { super: window.PageExtractor.Algo, root: window.PageExtractor };

window.PageExtractor.Algo.Data.makeExample = function (target, isPositive) {
    var rtn = {
        element: target,
        positive: isPositive,
        element_hierarchy: [],
        data: []
    };
    var curr = target;
    while (curr && curr != document.body) {
        if (curr.id == "PageExtractorControlPanel") return false; // skip control panel's elements
        rtn.element_hierarchy.push(curr);
        var datas = this.root.Html.Data.getDataFrom(curr);
        if (datas.data == undefined) {
            datas.data = {
                tag: curr.tagName.toLowerCase(),
                classes: this.root.Html.Attrs.attributeValuesGet(curr, "class"),
                position: this.super.XPath.getIndex(curr),
                position_reversed: this.super.XPath.getIndex(curr, true),
                position_max: this.super.XPath.getSiblingsTagCount(curr),
                children_count: curr.children.length,
                text_len: curr.textContent.replace(/[\s\n]+/,' ').trim().length
            };
        }
        rtn.data.push(datas.data);
        curr = curr.parentNode;
    }
    rtn.element_hierarchy.reverse();
    rtn.data.reverse();
    for (var d = 0 ; d < rtn.data.length ; d++) {
        rtn.data[d].depth = d;
        rtn.data[d].depth_reversed = d - (rtn.data.length-1);
    }
    return rtn;
};