/*
 * PageExtractor - An interactive page splitter
 *
 * Copyright(c) 2011 Olivier Favre <of.olivier.favre@gmail.com>
 * See LICENSE file.
 */

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
