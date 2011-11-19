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

var positives = [];
var negatives = [];
var exampleHighlights = [];

function elementClicked(evt) {
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

function addNewExampleAndHighlightIt(target, isPositive) {
    if (!target) return;
    if (isPositive) {
        positives.push(makeExample(target, isPositive));
    } else {
        negatives.push(makeExample(target, isPositive));
    }
    exampleHighlights.push(highlightElement(target, isPositive ? "positive" : "negative"));
}
function highlightElement(target, type) {
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
function removeExampleAndHighlightFromExample(target, types) {
    if (!target) return;
    removeHighlight(getHighlightFromExample(target, types));
    removeExample(target, types)
}
function removeExampleAndHighlightFromHighlight(highlight) {
    if (!highlight) return;
    removeExample(getExampleFromHighlight(highlight), getTypeFromHighlight(highlight));
    removeHighlight(highlight);
}
function getHighlightFromExample(target, types) {
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
function getTypeFromHighlight(highlight) {
    if (!highlight) return;
    var data = getDataFrom(highlight);
    return data ? data["type"] : undefined;
}
function getExampleFromHighlight(highlight) {
    if (!highlight) return;
    var data = getDataFrom(highlight);
    return data ? data["target"] : undefined;
}
function removeExample(target, fromTypes) {
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
function removeHighlight(highlight) {
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
function clearExamples() {
    for (i = 0 ; i < exampleHighlights.length ; i++) {
        exampleHighlights[i].parentNode.removeChild(exampleHighlights[i]);
    }
    exampleHighlights = [];
    positives = [];
    negatives = [];
}


var results = {};
var highlights = []
function clearResults() {
    for (i = 0 ; i < highlights.length ; i++) {
        highlights[i].parentNode.removeChild(highlights[i]);
    }
    results = [];
    highlights = [];
}
/*function info(collection) {
    var parts = [];
    for (var i = 0 ; i < collection.length ; i++) {
        //parts.push(' - '+makeXPath(collection[i].element));
        parts.push(' - '+JSON.stringify(collection[i].data));
    }
    return parts.join('\n');
}*/
function learn() {
    clearResults();
    //alert("positives:\n"+info(positives)+"\n\nnegatives:\n"+info(negatives));
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
    var arff = "@relation PageExtractor\n\n"+
        "@attribute tag string\n"+
        "@attribute position real\n"+
        "@attribute position_reversed real\n"+
        "@attribute position_max real\n"+
        "@attribute children_count real\n"+
        "@attribute text_len real\n"+
        "@attribute depth real\n"+
        "@attribute max_positive_similarity real\n"+
        "@attribute max_negative_similarity real\n";
    var classes_map = {};
    var classes_stub = [];
    for (var i = 0 ; i < tmprslt.length ; i++) {
        var cls = tmprslt.data[i].data.slice(-1)[0].classes;
        for (var j = 0 ; j < cls.length ; j++) {
            if (!classes_map[cls[j]]) {
                classes_map[cls[j]] = classes_stub.length;
                classes_stub.push(0);
                arff += "@attribute class_"+cls[j]+" {1,0}\n";
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
function highlightResults(results) {
    for (var i = 0 ; i < results.length ; i++)
        highlights.push(highlightElement(results[i], "result"));
}

function testRule(xpath) {
    var rtn = {
        length: 0,
        elements: [],
        data: [],
        stats: {
            similarity: {
                positives_as_ref: {
                    val_by_ref_by_elmt: [],
                    by_ref: { avg: [], max: [] },
                    by_elmt: { avg: [], max: [] },
                    avg: 0.0,
                    max: 0.0
                },
                negatives_as_ref: {
                    val_by_ref_by_elmt: [],
                    by_ref: { avg: [], max: [] },
                    by_elmt: { avg: [], max: [] },
                    avg: 0.0,
                    max: 0.0
                },
                avg: 0.0 // positives having same weight as negatives, whatever their respective instance count : close to 0.5 =~ easy problem
            }
        }
    };
    // Init 2D arrays
    for (var i = 0 ; i < positives.length ; i++) {
        rtn.stats.similarity.positives_as_ref.val_by_ref_by_elmt.push([]);
        rtn.stats.similarity.positives_as_ref.by_ref.avg.push(0.0);
        rtn.stats.similarity.positives_as_ref.by_ref.max.push(0.0);
    }
    for (var i = 0 ; i < negatives.length ; i++) {
        rtn.stats.similarity.negatives_as_ref.val_by_ref_by_elmt.push([]);
        rtn.stats.similarity.negatives_as_ref.by_ref.avg.push(0.0);
        rtn.stats.similarity.negatives_as_ref.by_ref.max.push(0.0);
    }
    // Collect elements (any modification to them will break the xpath results iterator)
    var x = document.evaluate(xpath, document, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
    var r;
    while (r = x.iterateNext())
        rtn.elements.push(r);
    // Collect statistics
    rtn.length = rtn.elements.length;
    var avg;
    for (var i = 0 ; i < rtn.length ; i++) {
        var ex = makeExample(rtn.elements[i]);
        if (ex == false) {
            // Skip control panel's elements
            rtn.elements.splice(i,1);
            rtn.length--;
            i--;
            continue;
        }
        rtn.data.push(ex);
        avg = 0.0;
        rtn.stats.similarity.positives_as_ref.by_elmt.max.push(0.0);
        for (var p = 0 ; p < positives.length ; p++) {
            var sim = exampleSimilarity(rtn.data[i], positives[p]);
            avg += sim / positives.length;
            rtn.stats.similarity.positives_as_ref.val_by_ref_by_elmt[p].push(sim);
            rtn.stats.similarity.positives_as_ref.by_ref.avg[p] += sim / rtn.length;
            if (sim > rtn.stats.similarity.positives_as_ref.by_ref.max[p])
                rtn.stats.similarity.positives_as_ref.by_ref.max[p] = sim;
            if (sim > rtn.stats.similarity.positives_as_ref.by_elmt.max[i])
                rtn.stats.similarity.positives_as_ref.by_elmt.max[i] = sim;
            if (sim > rtn.stats.similarity.positives_as_ref.max)
                rtn.stats.similarity.positives_as_ref.max = sim;
        }
        rtn.stats.similarity.positives_as_ref.by_elmt.avg.push(avg);
        rtn.stats.similarity.positives_as_ref.avg += avg / rtn.length;
        avg = 0.0;
        rtn.stats.similarity.negatives_as_ref.by_elmt.max.push(0.0);
        for (var p = 0 ; p < negatives.length ; p++) {
            var sim = exampleSimilarity(rtn.data[i], negatives[p]);
            avg += sim / negatives.length;
            rtn.stats.similarity.negatives_as_ref.val_by_ref_by_elmt[p].push(sim);
            rtn.stats.similarity.negatives_as_ref.by_ref.avg[p] += sim / rtn.length;
            if (sim > rtn.stats.similarity.negatives_as_ref.by_ref.max[p])
                rtn.stats.similarity.negatives_as_ref.by_ref.max[p] = sim;
            if (sim > rtn.stats.similarity.negatives_as_ref.by_elmt.max[i])
                rtn.stats.similarity.negatives_as_ref.by_elmt.max[i] = sim;
            if (sim > rtn.stats.similarity.negatives_as_ref.max)
                rtn.stats.similarity.negatives_as_ref.max = sim;
        }
        rtn.stats.similarity.negatives_as_ref.by_elmt.avg.push(avg);
        rtn.stats.similarity.negatives_as_ref.avg += avg / rtn.length;
    }
    rtn.stats.similarity.avg = (rtn.stats.similarity.positives_as_ref.avg + rtn.stats.similarity.negatives_as_ref.avg) / 2;
    return rtn;
}
function attributeValuesHas(target, attribute, values, all) {
    if (!(values instanceof Array))
        return (" "+target.getAttribute(attribute)+" ").indexOf(" "+values+" ") >= 0;
    var vls = attributeValuesGet(target, attribute);
    if (all && values.length < vls.length) return false;
    values.sort();
    vls.sort();
    var i = 0, j = 0, match = 0;
    while (i < values.length && j < vls.length) {
        if (values[i] == vls[j]) {
            if (!all) return true;
            match++; i++; j++;
        } else if (values[i] < vls[j]) {
            if (all) return false;
            i++;
        } else
            j++;
    }
    return false;
}
function attributeValuesGet(target, attribute) {
    var value = target.getAttribute(attribute);
    if (!value || value.trim() == "") return [];
    return value.trim().split(/\s+/).sort();
}
function attributeValuesSet(target, attribute, values) {
    if (values instanceof Array)
        target.setAttribute(attribute, values.join(" "));
    else
        target.setAttribute(attribute, values);
}
function attributeValuesAdd(target, attribute, values) {
    if (!(values instanceof Array)) values = [values];
    var elmt_values = attributeValuesGet(target, attribute);
    for (var i = 0 ; i < values.length ; i++)
        if (elmt_values.indexOf(values[i]) < 0)
            elmt_values.push(values[i]);
    attributeValuesSet(target, attribute, elmt_values);
}
function attributeValuesRemove(target, attribute, values) {
    if (!(values instanceof Array)) values = [values];
    var elmt_values = attributeValuesGet(target, attribute);
    for (var i = 0 ; i < values.length ; i++) {
        var idx = elmt_values.indexOf(values[i]);
        if (idx >= 0)
            elmt_values.splice(idx, 1);
    }
    attributeValuesSet(target, attribute, elmt_values);
}
function makeExample(target, isPositive) {
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
}
/** Similarity ([0;1]) of the two examples, using their hierarchy */
function exampleSimilarity(exA, exB) {
    var rtn = 0.0;
    var weights = 0.0;
    function addToScore(weight, score) {
        rtn += score * weight;
        weights += weight;
    }
    // Hierarchy depth similarity
    var dA = exA.element_hierarchy.length;
    var dB = exB.element_hierarchy.length;
    addToScore(1.0, 1.0 - Math.abs(dA - dB)/Math.max(dA, dB));
    // Hierarchy similarity... (weight from extremity distance, ie middle has more importance)
    var sub = 0.0;
    var subw = 0.0; // ...from the root to the highest common depth
    var subr = 0.0; // ...from the leaf to the shallowest
    for (var i = 0, iAr = dA-1, iBr = dB-1 ; iAr >= 0 && iBr >= 0 ; i++, iAr--, iBr--) {
        // i is depth from root to nth step deep
        // i*r is depth from leaf (of exA and exB) to nth step shallow
        var w = (i+1.0)/Math.max(dA, dB);
        subw += w;
        sub += w * exampleSameLevelSimilarity(exA, i, exB, i);
        subr += w * exampleSameLevelSimilarity(exA, iAr, exB, iBr);
    }
    if (subw == 0) {
        addToScore(1.0, 0.0);
        addToScore(1.0, 0.0);
    } else {
        addToScore(subw, sub/subw);
        addToScore(subw, subr/subw);
    }
    return weights == 0 ? 0.0 : rtn / weights;
}
/** Similarity ([0;1]) of the two examples at the given levels in hierarchy */
function exampleSameLevelSimilarity(exA, levelA, exB, levelB) {
    // Fast exit in case of elements equality
    if (exA.element_hierarchy[levelA] == exB.element_hierarchy[levelB]) return 1.0;
    var A = exA.data[levelA];
    var B = exB.data[levelB];
    var rtn = 0.0;
    var weights = 0.0;
    function addToScore(weight, score) {
        rtn += score * weight;
        weights += weight;
    }
    // Tag equality (0 or 1)
    addToScore(5.0, A.tag == B.tag ? 1.0 : 0.0);
    // Classes purity ([0;1]): |exA.classes inter exB.classes| / |exA.classes union exB.classes|
    var sub = 0;
    for (var i = 0 ; i < A.classes.length ; i++)
        if (B.classes.indexOf(A.classes[i]) >= 0) sub++;
    var over = A.classes.length + B.classes.length - sub;
    if (over == 0)
        addToScore(1.0, 0.0);
    else
        addToScore(Math.sqrt(over), sub/over);
    // Position_max, children_count and text_len normed log difference
    function logDiffNormed(x,y) {
        if (x == 0 && y == 0) return 1.0;
        var lx = Math.log(1+x);
        var ly = Math.log(1+y);
        return 1.0 - Math.abs(lx-ly)/Math.max(lx,ly);
    }
    addToScore(1.5, logDiffNormed(A.position_max, B.position_max));
    addToScore(1.0, logDiffNormed(A.children_count, B.children_count));
    addToScore(0.0, logDiffNormed(A.text_len, B.text_len)); // FIXME Find good weight (0.5 ?)
    return weights == 0 ? 0.0 : rtn / weights;
}

function makeXPath(target) {
    var parts = [];
    var curr = target;
    while (curr && curr != document.body) {
        var classes = attributeValuesGet(curr, "class");
        if (classes.length)
            classes = 'contains(concat(" ",@class," ")," ' + classes.join(' ") and contains(concat(" ",@class," ")," ') + ' ")';
        else
            classes = undefined;
        var idx = getIndex(curr);
        if (idx > 0)
            if (classes)
                parts.push(curr.tagName.toLowerCase()+'[position()='+idx+' and '+classes+']');
            else
                parts.push(curr.tagName.toLowerCase()+'[position()='+idx+']');
        else if (classes)
            parts.push(curr.tagName.toLowerCase()+'['+classes+']');
        else
            parts.push(curr.tagName.toLowerCase());
        curr = curr.parentNode;
    }
    parts.reverse();
    return '/html/body/'+parts.join('/');
}
function getIndex(target, reverse) {
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
function getSiblingsTagCount(target) {
    // Returns the number of same-tagName siblings of the target
    var cnt = 0;
    var siblings = target.parentNode.children;
    for (var i = 0 ; i < siblings.length ; i++)
        if (siblings[i].tagName == target.tagName) cnt++;
    return cnt;
}



function setDataExport(content) {
    document.getElementById("PageExtractorDataExportContainer").style.display = "block"; // default value of a div
    document.getElementById("PageExtractorDataExport").value = content;
}
function hideDataExport() {
    document.getElementById("PageExtractorDataExportContainer").style.display = "none";
}



function installCss() {
    if (!document.getElementById("PageExtractorCss")) {
        // The following call leverages a regex for chrome.extension.getURL() incrustation
        chrome.extension.sendRequest({action: "fetchExtensionFile", file: "pagecss.css"}, function(response) {
            var css = document.createElement("style");
            css.id = "PageExtractorCss";
            css.type = "text/css";
            css.innerHTML = response;
            document.head.appendChild(css);
        });
    }
}
function removeCss() {
    var ctrl = document.getElementById("PageExtractorCss");
    if (!ctrl) return;
    if (!ctrl.parentNode) return;
    ctrl.parentNode.removeChild(ctrl);
}
function installControlPanel() {
    chrome.extension.sendRequest({action: "fetchExtensionFile", file: "pagecontrolpanel.html"}, function(response) {
        var d = document.createElement('div');
        d.id = "PageExtractorControlPanel";
        d.className = "PageExtractorControlPanel";
        d.innerHTML = response; //WARN: if using outerHTML, call d=document.getElementById("PageExtractorControlPanel"); right after!
        document.body.appendChild(d);
        initControlPanel(d);
    });
}
function removeControlPanel() {
    var ctrl = document.getElementById("PageExtractorControlPanel");
    if (!ctrl) return;
    if (!ctrl.parentNode) return;
    ctrl.parentNode.removeChild(ctrl);
}
function PageExtractorSetup() {
    if (document.getElementById("PageExtractorControlPanel")) {
        console.log("PageExtractor control panel already existing");
        return;
    }
    installCss();
    document.addEventListener("click", elementClicked, true);
    installControlPanel();
}
function PageExtractorTearDown() {
    if (!document.getElementById("PageExtractorControlPanel"))
        return;
    removeCss();
    document.removeEventListener("click", elementClicked, true);
    removeControlPanel();
    clearExamples();
    clearResults();
}

PageExtractorSetup();
