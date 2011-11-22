/*
 * PageExtractor - An interactive page splitter
 *
 * Copyright(c) 2011 Olivier Favre <of.olivier.favre@gmail.com>
 * See LICENSE file.
 */

if (!window.PageExtractor) window.PageExtractor = {};
if (!window.PageExtractor.Ui) window.PageExtractor.Ui = { super: PageExtractor, root: window.PageExtractor };
if (!window.PageExtractor.Ui.Manip) window.PageExtractor.Ui.Manip = { super: window.PageExtractor.Ui, root: window.PageExtractor };

window.PageExtractor.Ui.Manip.exampleHighlights = [];

window.PageExtractor.Ui.Manip.elementClicked = function (evt) {
    if (!evt) return;
    if (this.root.Html.Attrs.attributeValuesHas(evt.target,"class","PageExtractorExampleHighlight")) {
        if (this.root.Html.Attrs.attributeValuesHas(evt.target,"class","PageExtractorType-positive")) {
            if (evt.ctrlKey)
                this.removeExampleAndHighlightFromHighlight(evt.target);
        } else if (this.root.Html.Attrs.attributeValuesHas(evt.target,"class","PageExtractorType-negative")) {
            if (!evt.ctrlKey)
                this.removeExampleAndHighlightFromHighlight(evt.target);
        } else if (this.root.Html.Attrs.attributeValuesHas(evt.target,"class","PageExtractorType-result")) {
            // Get example from the result highlight
            var target = this.getExampleFromHighlight(evt.target);
            // Remove from other type, if present
            // if not, add to new type, if not already present
            var removeType = evt.ctrlKey ? "positive" : "negative";
            var addType = evt.ctrlKey ? "negative" : "positive";
            var done = false;
            if (this.root.Html.Data.getDataFrom(target)["highlight"] && this.root.Html.Data.getDataFrom(target)["highlight"][removeType]) {
                this.removeExample(target, removeType);
                this.removeHighlight(this.getHighlightFromExample(target, removeType));
                done = true;
            }
            if (!done && this.root.Html.Data.getDataFrom(target)["highlight"] && !this.root.Html.Data.getDataFrom(target)["highlight"][addType]) {
                this.addNewExampleAndHighlightIt(target, !evt.ctrlKey);
            }
            // We left the result highlight intact
        }
    } else {
        // Make sure we're not clicking on a element of the control panel
        curr = evt.target;
        while (curr && curr != document.body) {
            if (this.root.Html.Attrs.attributeValuesHas(curr,"class","PageExtractorControlPanel"))
                // Exit the function, let click work normally
            return;
            curr = curr.parentNode;
        }
        // We're on a page element, create a positive/negative example from it
        this.addNewExampleAndHighlightIt(evt.target, !evt.ctrlKey);
    }
    evt.stopPropagation();
    evt.preventDefault();
}

window.PageExtractor.Ui.Manip.addNewExampleAndHighlightIt = function (target, isPositive) {
    if (!target) return;
    if (isPositive) {
        this.root.Algo.positives.push(this.root.Algo.Data.makeExample(target, isPositive));
    } else {
        this.root.Algo.negatives.push(this.root.Algo.Data.makeExample(target, isPositive));
    }
    exampleHighlights.push(this.highlightElement(target, isPositive ? "positive" : "negative"));
}

window.PageExtractor.Ui.Manip.highlightElement = function (target, type) {
    if (!target) return;
    var h = document.createElement("div");
    this.root.Html.Data.getDataFrom(h)["target"] = target;
    this.root.Html.Data.getDataFrom(h)["type"] = type;
    if (!this.root.Html.Data.getDataFrom(target)["highlight"])
        this.root.Html.Data.getDataFrom(target)["highlight"] = {}
    this.root.Html.Data.getDataFrom(target)["highlight"][type] = h;
    this.root.Html.Attrs.attributeValuesAdd(target, "data-PageExtractor-types", type);
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
window.PageExtractor.Ui.Manip.removeExampleAndHighlightFromExample = function (target, types) {
    if (!target) return;
    this.removeHighlight(this.getHighlightFromExample(target, types));
    this.removeExample(target, types)
}

window.PageExtractor.Ui.Manip.removeExampleAndHighlightFromHighlight = function (highlight) {
    if (!highlight) return;
    this.removeExample(this.getExampleFromHighlight(highlight), this.getTypeFromHighlight(highlight));
    this.removeHighlight(highlight);
}
window.PageExtractor.Ui.Manip.getHighlightFromExample = function (target, types) {
    if (!target) return;
    if (!types) types = ["positive", "negative", "result"];
    if (!(types instanceof Array)) types = [types];
    var data = this.root.Html.Data.getDataFrom(target);
    if (!data || !data["highlight"]) return undefined;
    for (var i = 0 ; i < types.length ; i++)
        if (data["highlight"][types[i]])
            return data["highlight"][types[i]];
    return undefined;
}
window.PageExtractor.Ui.Manip.getTypeFromHighlight = function (highlight) {
    if (!highlight) return;
    var data = this.root.Html.Data.getDataFrom(highlight);
    return data ? data["type"] : undefined;
}
window.PageExtractor.Ui.Manip.getExampleFromHighlight = function (highlight) {
    if (!highlight) return;
    var data = this.root.Html.Data.getDataFrom(highlight);
    return data ? data["target"] : undefined;
}
window.PageExtractor.Ui.Manip.removeExample = function (target, fromTypes) {
    if (!target) return;
    if (!fromTypes) fromTypes = ["positive", "negative", "result"];
    if (!(fromTypes instanceof Array)) fromTypes = [fromTypes];
    if (target instanceof Array) {
        for (var i = 0 ; i < target.length ; i++)
            this.removeExample(target[i], fromTypes);
        return;
    }
    var froms = { positive: this.root.Algo.positives, negative: this.root.Algo.negatives, result: this.root.Algo.results };
    var types = this.root.Html.Attrs.attributeValuesGet(target, "data-PageExtractor-types");
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
    this.root.Html.Attrs.attributeValuesSet(target, "data-PageExtractor-types", types);
}
window.PageExtractor.Ui.Manip.removeHighlight = function (highlight) {
    if (!highlight) return;
    if (highlight instanceof Array) {
        for (var i = 0 ; i < highlight.length ; i++)
            this.removeHighlight(highlight[i]);
        return;
    }
    var type = this.root.Html.Data.getDataFrom(highlight)["type"];
    delete this.root.Html.Data.getDataFrom(this.getExampleFromHighlight(highlight))["highlight"][type];
    var froms = { positive: exampleHighlights, negative: exampleHighlights, result: highlights };
    var from = froms[type];
    var idx = from.indexOf(highlight);
    if (idx >= 0) from.splice(idx, 1);
    this.root.Html.Data.removeDataFrom(highlight);
    highlight.parentNode.removeChild(highlight);
}
window.PageExtractor.Ui.Manip.clearExamples = function () {
    for (i = 0 ; i < exampleHighlights.length ; i++) {
        exampleHighlights[i].parentNode.removeChild(exampleHighlights[i]);
    }
    exampleHighlights = [];
    this.root.Algo.positives = [];
    this.root.Algo.negatives = [];
}


window.PageExtractor.Ui.Manip.highlights = []

window.PageExtractor.Ui.Manip.clearResults = function () {
    for (i = 0 ; i < highlights.length ; i++) {
        highlights[i].parentNode.removeChild(highlights[i]);
    }
    this.root.Algo.results = [];
    highlights = [];
}

window.PageExtractor.Ui.Manip.highlightResults = function (results) {
    for (var i = 0 ; i < results.length ; i++)
        highlights.push(this.highlightElement(results[i], "result"));
}



window.PageExtractor.Ui.Manip.learn = function () {
    this.clearResults();
    this.root.Algo.learn();
    this.highlightResults(this.root.Algo.results);
    alert(this.root.Algo.results.length+" results");
}
