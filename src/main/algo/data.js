/*
 * PageExtractor - An interactive page splitter
 *
 * Copyright(c) 2011 Olivier Favre <of.olivier.favre@gmail.com>
 * See LICENSE file.
 */

if (!PageExtractor) PageExtractor = {};
if (!PageExtractor.Algo) PageExtractor.Algo = {};
if (!PageExtractor.Algo.Data) PageExtractor.Algo.Data = {};

PageExtractor.Algo.Data.makeExample = function (target, isPositive) {
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
        var datas = getDataFrom(curr);
        if (datas.data == undefined) {
            datas.data = {
                tag: curr.tagName.toLowerCase(),
                classes: attributeValuesGet(curr, "class"),
                position: getIndex(curr),
                position_reversed: getIndex(curr, true),
                position_max: getSiblingsTagCount(curr),
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