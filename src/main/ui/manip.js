/*
 * PageExtractor - An interactive page splitter
 *
 * Copyright(c) 2011 Olivier Favre <of.olivier.favre@gmail.com>
 * See LICENSE file.
 */

if (!PageExtractor) PageExtractor = {};
if (!PageExtractor.Ui) PageExtractor.Ui = {};
if (!PageExtractor.Ui.Manip) PageExtractor.Ui.Manip = {};

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


PageExtractor.Ui.Manip.results = {};
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
    clearResults();
    //var tmprslt = testRule('/html/body//'+positives[0].data[positives[0].data.length-1].tag+'[contains(concat(" ",@class," "),"'+positives[0].data[positives[0].data.length-1].classes[0]+'")]');
    var tmprslt = testRule('/html/body//'+positives[0].data[positives[0].data.length-1].tag);
    console.log(tmprslt);
    for (var i = 0 ; i < tmprslt.length ; i++)
        if (tmprslt.stats.similarity.positives_as_ref.by_elmt.max[i] > tmprslt.stats.similarity.negatives_as_ref.by_elmt.max[i])
            results.push(tmprslt.elements[i]);
        highlightResults(results);
    alert(results.length+" results");

    /*
     * Try using classes and hierarchy first.
     *  - Search for anything (like '/html/body//TAG')
     *  - Sort results by decreasing max similarity with positives
     *  - Find good classes/depth:
     *     - Iterate results in order (decreasing)
     *     - Consider hierarchy from leaf to root
     *     - Note unique classes/depth and n-uples/ and /depth_reversed: use as key
     *     - (Thread not already known key as having a last met rank of 0)
     *     - (¿If last key was met in more than X ranks ago, remove?)
     *     - Else update last met rank, and keep
     *     - Add if not already available
     *     - Update element count and means max similarity with positives and negatives, for that key
     *  - Sort by mean max similarity with positives
     *  - (Prefer: higher similarity with positives, lower similarity with negatives, fewer classes)
     *  - (What now?)
     */
    var index = {};
    var data = [];
    var Criteria = function(classes, depth, depth_is_reversed) {
        if (classes instanceof Array) {
            if (classes.length == 0)
                return undefined;
        } else {
            if (classes == undefined || classes == null)
                return undefined;
            classes = [classes];
        }
        this.classes = classes;
        this.depth = depth;
        this.depth_is_reversed = depth_is_reversed ? true : false;
        this.key = function(){
            return this.classes.length+"["+this.classes.join(",")+"]"+(this.depth_is_reversed?"R":"N")+this.depth;
        };
        var idx = index[this.key()];
        if (idx != undefined)
            return data[idx];
        // Continue here with the new object if not already in index
            this.id = data.length;
            index[this.key()] = data.length;
            data.push(this);
            this.remove = function() {
                var key = this.key()
                var idx = index[key];
                if (idx == undefined) return;
                delete index[key];
                data[idx] = undefined; // don't splice, or it'll shift all other indexes!
            };
            this.element_indexes = [];
            this.mean_max_similarity_with_positives = 0.0;
            this.mean_max_similarity_with_negatives = 0.0;
            this.updateWithNewElement = function(rslt, elmt_idx) {
                this.mean_max_similarity_with_positives = (this.mean_max_similarity_with_positives * this.element_indexes.length + rslt.stats.similarity.positives_as_ref.by_elmt.max[elmt_idx]) / (this.element_indexes.length + 1.0);
                this.mean_max_similarity_with_negatives = (this.mean_max_similarity_with_negatives * this.element_indexes.length + rslt.stats.similarity.negatives_as_ref.by_elmt.max[elmt_idx]) / (this.element_indexes.length + 1.0);
                this.element_indexes.push(elmt_idx);
            };
            return this;
    };
    var result_comparator = function(rslt) {
        var tmp = rslt.stats.similarity.positives_as_ref.by_elmt.max;
        return function(i,j) {
            return tmp[i] - tmp[j]; // decreasing
        };
    };
    var sortedIdx = [];
    for (var i = 0 ; i < tmprslt.length ; i++)
        sortedIdx.push(i);
    sortedIdx.sort(result_comparator(tmprslt));
    var combinations = function(values) {
        var presence = [];
        for (var i = 0 ; i < values.length ; i++)
            presence.push(false);
        var rtn = [];
        var i = 0;
        // The following loop skips "all false", which is intentional
        while (i < presence.length) {
            if (presence[i]) {
                presence[i] = false;
                i++;
                continue;
            } else {
                presence[i] = true;
                i = 0;
            }
            var c = [];
            for (var j = 0 ; j < presence.length ; j++)
                if (presence[j])
                    c.push(values[j]);
                rtn.push(c);
        }
        return rtn;
    };
    for (var i = 0 ; i < tmprslt.length ; i++) {
        var rslt = tmprslt.data[sortedIdx[i]];
        for (var d = rslt.data.length-1 ; d >= 0 ; d--) {
            var elmt = rslt.data[d];
            var cls = combinations(elmt.classes);
            for (var j = 0 ; j < cls.length ; j++) {
                var c = new Criteria(cls[j], elmt.depth, false);
                if (c != undefined)
                    c.updateWithNewElement(tmprslt, sortedIdx[i]);
                c = new Criteria(cls[j], elmt.depth_reversed, true);
                if (c != undefined)
                    c.updateWithNewElement(tmprslt, sortedIdx[i]);
            }
        }
    }
    var data_sortedIdx = [];
    for (var i = 0 ; i < data.length ; i++)
        data_sortedIdx.push(i);
    data_sortedIdx.sort(function(i,j){
        var v;
        v = data[j].mean_max_similarity_with_positives - data[i].mean_max_similarity_with_positives; // decreasing
        if (v != 0) return v;
        v = data[i].mean_max_similarity_with_negatives - data[j].mean_max_similarity_with_negatives; // increasing
        if (v != 0) return v;
        if (data[i].depth_is_reversed == true && data[j].depth_is_reversed == false) return 1;
        if (data[i].depth_is_reversed == true)
            v = data[j].depth - data[i].depth; // decreasing (farther up in hierarchy, from leaf)
        else
            v = data[i].depth - data[j].depth; // increasing (farther down in hierarchy, from root)
        if (v != 0) return v;
        v = data[i].classes.length - data[j].classes.length; // increasing
        if (v != 0) return v;
        v = data[i].classes.join(' ').localeCompare(data[j].classes.join(' ')); // increasing
        if (v != 0) return v;
        // Don't compare element_count at this stage, it's pointless as it only depends on the preceding
        return 0;
    });
    var arff = "@relation PageExtractor\n\n"+
    "@attribute depth real\n"+
    "@attribute depth_reversed {1,0}\n"+
    "@attribute element_count real\n"+
    "@attribute mean_max_similarity_with_positives real\n"+
    "@attribute mean_max_similarity_with_negatives real\n"+
    "@attribute classes string\n"+
    "\n@data\n";
    var instances = [];
    var best;
    for (var i = 0 ; i < data_sortedIdx.length ; i++) {
        var d = data[data_sortedIdx[i]];
        if (d.mean_max_similarity_with_positives > d.mean_max_similarity_with_negatives) {
            if (best == undefined) best = i;
            instances.push([
            d.depth,
            d.depth_is_reversed ? '1' : '0',
            d.element_indexes.length,
            d.mean_max_similarity_with_positives,
            d.mean_max_similarity_with_negatives,
            d.classes.join(' & ')
            ].join(','));
        }
    }
    arff += instances.join('\n');
    setDataExport(arff);

    best = data[data_sortedIdx[best]];
    // TODO: Use the rule, check validity, recurse
    // TODO: Create a criteria class, that generates XPath queries

    /*
     * ARFF export of all elements returned by XPath
     *
     *    var arff = "@relation PageExtractor\n\n"+
     *        "@attribute tag string\n"+
     *        "@attribute position real\n"+
     *        "@attribute position_reversed real\n"+
     *        "@attribute position_max real\n"+
     *        "@attribute children_count real\n"+
     *        "@attribute text_len real\n"+
     *        "@attribute depth real\n"+
     *        "@attribute max_positive_similarity real\n"+
     *        "@attribute max_negative_similarity real\n";
     *    var classes_map = {};
     *    var classes_stub = [];
     *    for (var i = 0 ; i < tmprslt.length ; i++) {
     *        var cls = tmprslt.data[i].data.slice(-1)[0].classes;
     *        for (var j = 0 ; j < cls.length ; j++) {
     *            if (!classes_map[cls[j]]) {
     *                classes_map[cls[j]] = classes_stub.length;
     *                classes_stub.push(0);
     *                arff += "@attribute class_"+cls[j]+" {1,0}\n";
     }
     }
     }
     arff += "\n@data\n";
     var instances = [];
     for (var i = 0 ; i < tmprslt.length ; i++) {
         var obj = tmprslt.data[i].data.slice(-1)[0];
         var data = [];
         data.push(obj.tag);
         data.push(obj.position);
         data.push(obj.position_reversed);
         data.push(obj.position_max);
         data.push(obj.children_count);
         data.push(obj.text_len);
         data.push(tmprslt.data[i].data.length);
         var v;
         v = tmprslt.stats.similarity.positives_as_ref.by_elmt.max[i];
         data.push(v != undefined ? v : 0);
         v = tmprslt.stats.similarity.negatives_as_ref.by_elmt.max[i];
         data.push(v != undefined ? v : 0);
         var cls = classes_stub.slice(0);
         for (var c = 0 ; c < obj.classes.length ; c++)
             cls[classes_map[obj.classes[c]]] = 1;
         data = data.concat(cls);
         instances.push(data.join(","));
     }
     arff += instances.join("\n");
     setDataExport(arff);
     */
}
