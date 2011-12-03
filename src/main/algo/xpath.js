/*
 * PageExtractor - An interactive page splitter
 *
 * Copyright(c) 2011 Olivier Favre <of.olivier.favre@gmail.com>
 * See LICENSE file.
 */

if (!window.PageExtractor) window.PageExtractor = {};
if (!window.PageExtractor.Algo) window.PageExtractor.Algo = { super: PageExtractor, root: window.PageExtractor };
if (!window.PageExtractor.Algo.XPath) window.PageExtractor.Algo.XPath = { super: window.PageExtractor.Algo, root: window.PageExtractor };

window.PageExtractor.Algo.XPath.getResults = function (xpath) {
    var rtn =[];
    // Collect elements (any modification to them will break the xpath results iterator)
    var x = document.evaluate(xpath, document, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
    var r;
    while (r = x.iterateNext())
        rtn.push(r);
    return rtn;
}

window.PageExtractor.Algo.XPath.makeXPath = function (target) {
    var parts = [];
    var curr = target;
    while (curr && curr != document.body) {
        var classes = this.root.Html.Attrs.attributeValuesGet(curr, "class");
        if (classes.length)
            classes = 'contains(concat(" ",@class," ")," ' + classes.join(' ") and contains(concat(" ",@class," ")," ') + ' ")';
        else
            classes = undefined;
        var idx = this.getIndex(curr);
        if (idx > 0) {
            if (classes) {
                parts.push(curr.tagName.toLowerCase()+'[position()='+idx+' and '+classes+']');
            } else {
                parts.push(curr.tagName.toLowerCase()+'[position()='+idx+']');
            }
        } else if (classes) {
            parts.push(curr.tagName.toLowerCase()+'['+classes+']');
        } else {
            parts.push(curr.tagName.toLowerCase());
        }
        curr = curr.parentNode;
    }
    parts.reverse();
    return '/html/body/'+parts.join('/');
}

window.PageExtractor.Algo.XPath.getIndex = function (target, reverse) {
    var idx = 0;
    var found = false;
    var siblings = target.parentNode.children;
    reverse = reverse ? true : false;
    var i = reverse ? siblings.length-1 : 0;
    var istep = reverse ? -1 : 1;
    for (; reverse ? i >= 0 : i < siblings.length ; i += istep) {
        if (siblings[i].tagName == target.tagName) {
            if (found) return idx;
            idx += istep;
        }
        if (siblings[i] == target) {
            if (idx != 0) break; // index necessary
            found = true; // first element of that type, check if other exist (ie. is index necessary)
        }
    }
    if (Math.abs(idx) <= 1 && !found) return 0; // index not necessary
    return idx;
}

window.PageExtractor.Algo.XPath.getSiblingsTagCount = function (target) {
    // Returns the number of same-tagName siblings of the target
    var cnt = 0;
    var siblings = target.parentNode.children;
    for (var i = 0 ; i < siblings.length ; i++)
        if (siblings[i].tagName == target.tagName) cnt++;
        return cnt;
}
