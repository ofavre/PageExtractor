/*
 * PageExtractor - An interactive page splitter
 *
 * Copyright(c) 2011 Olivier Favre <of.olivier.favre@gmail.com>
 * See LICENSE file.
 */

if (!PageExtractor) PageExtractor = {};
if (!PageExtractor.Ui) PageExtractor.Ui = { super: PageExtractor, root: PageExtractor };
if (!PageExtractor.Ui.Manip) PageExtractor.Ui.Manip = { super: PageExtractor.Ui, root: PageExtractor };

PageExtractor.Ui.Manip.exampleHighlights = [];

PageExtractor.Ui.Manip.elementClicked = function (evt) {
    if (!evt) return;
    if (attributeValuesHas(evt.target,"class","PageExtractorExampleHighlight")) {
        if (attributeValuesHas(evt.target,"class","PageExtractorType-positive")) {
            if (evt.ctrlKey)
                removeExampleAndHighlightFromHighlight(evt.target);
        } else if (attributeValuesHas(evt.target,"class","PageExtractorType-negative")) {
            if (!evt.ctrlKey)
                removeExampleAndHighlightFromHighlight(evt.target);
        } else if (attributeValuesHas(evt.target,"class","PageExtractorType-result")) {
            // Get example from the result highlight
            var target = getExampleFromHighlight(evt.target);
            // Remove from other type, if present
            // if not, add to new type, if not already present
            var removeType = evt.ctrlKey ? "positive" : "negative";
            var addType = evt.ctrlKey ? "negative" : "positive";
            var done = false;
            if (getDataFrom(target)["highlight"] && getDataFrom(target)["highlight"][removeType]) {
                removeExample(target, removeType);
                removeHighlight(getHighlightFromExample(target, removeType));
                done = true;
            }
            if (!done && getDataFrom(target)["highlight"] && !getDataFrom(target)["highlight"][addType]) {
                addNewExampleAndHighlightIt(target, !evt.ctrlKey);
            }
            // We left the result highlight intact
        }
    } else {
        // Make sure we're not clicking on a element of the control panel
        curr = evt.target;
        while (curr && curr != document.body) {
            if (attributeValuesHas(curr,"class","PageExtractorControlPanel"))
                // Exit the function, let click work normally
            return;
            curr = curr.parentNode;
        }
        // We're on a page element, create a positive/negative example from it
        addNewExampleAndHighlightIt(evt.target, !evt.ctrlKey);
    }
    evt.stopPropagation();
    evt.preventDefault();
}

PageExtractor.Ui.Manip.addNewExampleAndHighlightIt = function (target, isPositive) {
    if (!target) return;
    if (isPositive) {
        positives.push(makeExample(target, isPositive));
    } else {
        negatives.push(makeExample(target, isPositive));
    }
    exampleHighlights.push(highlightElement(target, isPositive ? "positive" : "negative"));
}

PageExtractor.Ui.Manip.highlightElement = function (target, type) {
    if (!target) return;
    var h = document.createElement("div");
    getDataFrom(h)["target"] = target;
    getDataFrom(h)["type"] = type;
    if (!getDataFrom(target)["highlight"])
        getDataFrom(target)["highlight"] = {}
    getDataFrom(target)["highlight"][type] = h;
    attributeValuesAdd(target, "data-PageExtractor-types", type);
    h.className = "PageExtractorExampleHighlight PageExtractorType-" + type;
    // Calculate the overall offset, by walking up the parents
    var curr = target;
    var top = -4; // initial offset for borders and padding
    var left = -4;
    while (curr && curr != document.body) {
        top  += curr.offsetTop;
        left += curr.offsetLeft;
        curr = curr.offsetParent;
    }
    if (curr == null) h.style.position = "fixed";
    h.style.top = top+"px";
    h.style.left = left+"px";
    h.style.width = target.offsetWidth+"px";
    h.style.height = target.offsetHeight+"px";
    document.body.appendChild(h); // adding to target.offsetParent would be simpler, but some elements may not accept it, and their style may affect it's position
    return h;
}
PageExtractor.Ui.Manip.removeExampleAndHighlightFromExample = function (target, types) {
    if (!target) return;
    removeHighlight(getHighlightFromExample(target, types));
    removeExample(target, types)
}

PageExtractor.Ui.Manip.removeExampleAndHighlightFromHighlight = function (highlight) {
    if (!highlight) return;
    removeExample(getExampleFromHighlight(highlight), getTypeFromHighlight(highlight));
    removeHighlight(highlight);
}
PageExtractor.Ui.Manip.getHighlightFromExample = function (target, types) {
    if (!target) return;
    if (!types) types = ["positive", "negative", "result"];
    if (!(types instanceof Array)) types = [types];
    var data = getDataFrom(target);
    if (!data || !data["highlight"]) return undefined;
    for (var i = 0 ; i < types.length ; i++)
        if (data["highlight"][types[i]])
            return data["highlight"][types[i]];
    return undefined;
}
PageExtractor.Ui.Manip.getTypeFromHighlight = function (highlight) {
    if (!highlight) return;
    var data = getDataFrom(highlight);
    return data ? data["type"] : undefined;
}
PageExtractor.Ui.Manip.getExampleFromHighlight = function (highlight) {
    if (!highlight) return;
    var data = getDataFrom(highlight);
    return data ? data["target"] : undefined;
}
PageExtractor.Ui.Manip.removeExample = function (target, fromTypes) {
    if (!target) return;
    if (!fromTypes) fromTypes = ["positive", "negative", "result"];
    if (!(fromTypes instanceof Array)) fromTypes = [fromTypes];
    if (target instanceof Array) {
        for (var i = 0 ; i < target.length ; i++)
            removeExample(target[i], fromTypes);
        return;
    }
    var froms = { positive: positives, negative: negatives, result: results };
    var types = attributeValuesGet(target, "data-PageExtractor-types");
    for (var t = 0 ; t < types.length ; t++) {
        if (fromTypes.indexOf(types[t]) < 0) continue;
        var from = froms[types[t]];
        for (var i = 0 ; i < from.length ; i++) {
            if (from[i].element == target) {
                from.splice(i, 1);
                break;
            }
        }
        types.splice(t, 1);
        t--;
    }
    attributeValuesSet(target, "data-PageExtractor-types", types);
}
PageExtractor.Ui.Manip.removeHighlight = function (highlight) {
    if (!highlight) return;
    if (highlight instanceof Array) {
        for (var i = 0 ; i < highlight.length ; i++)
            removeHighlight(highlight[i]);
        return;
    }
    var type = getDataFrom(highlight)["type"];
    delete getDataFrom(getExampleFromHighlight(highlight))["highlight"][type];
    var froms = { positive: exampleHighlights, negative: exampleHighlights, result: highlights };
    var from = froms[type];
    var idx = from.indexOf(highlight);
    if (idx >= 0) from.splice(idx, 1);
    removeDataFrom(highlight);
    highlight.parentNode.removeChild(highlight);
}
PageExtractor.Ui.Manip.clearExamples = function () {
    for (i = 0 ; i < exampleHighlights.length ; i++) {
        exampleHighlights[i].parentNode.removeChild(exampleHighlights[i]);
    }
    exampleHighlights = [];
    positives = [];
    negatives = [];
}


PageExtractor.Ui.Manip.highlights = []

PageExtractor.Ui.Manip.clearResults = function () {
    for (i = 0 ; i < highlights.length ; i++) {
        highlights[i].parentNode.removeChild(highlights[i]);
    }
    results = [];
    highlights = [];
}

PageExtractor.Ui.Manip.highlightResults = function (results) {
    for (var i = 0 ; i < results.length ; i++)
        highlights.push(highlightElement(results[i], "result"));
}



PageExtractor.Ui.Manip.learn = function () {
    this.clearResults();
    this.root.Algo.learn();
    this.highlightResults(this.root.Algo.results);
    alert(this.root.Algo.results.length+" results");
}
