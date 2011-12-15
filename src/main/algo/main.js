/*
 * PageExtractor - An interactive page splitter
 *
 * Copyright(c) 2011 Olivier Favre <of.olivier.favre@gmail.com>
 * See LICENSE file.
 */

if (!window.PageExtractor) window.PageExtractor = {};
if (!window.PageExtractor.Algo) window.PageExtractor.Algo = { super: PageExtractor, root: window.PageExtractor };

window.PageExtractor.Algo.positives = [];
window.PageExtractor.Algo.negatives = [];
window.PageExtractor.Algo.results = [];

window.PageExtractor.Algo.learn = function () {
    var collectingQuery = new this.XPath.Query();
    var tagDone = {};
    for (var i = 0 ; i < this.positives.length ; i++) {
        var positive = this.positives[i];
        var tag = positive.data[positive.data.length-1].tag;
        if (tagDone[tag] == undefined) {
            var q = new this.XPath.Query();
            q.setUseReversedDepth(true);
            q.addCriterion(undefined, 0, tag, [], undefined);
            collectingQuery.addOr(q);
            tagDone[tag] = q;
        }
    }
    console.log("Collecting elements");
    var collectingResults = this.Stats.statElements(this.XPath.getResults(collectingQuery.toXPath()));
    console.log(collectingResults);
    console.log(collectingResults.length+" elements to examine");

    /*
     * Try using classes and hierarchy first.
     *  - Search for anything (like '/html/body//TAG')
     *  - Find good classes/depth:
     *     - Iterate results
     *     - Consider hierarchy from leaf to root
     *     - Note unique classes/depth and n-uples/ and /depth_reversed: use as key
     *     - Add if not already available
     *     - Update element count and means max similarity with positives and negatives, for that key
     *  - Sort by mean max similarity with positives
     *  - (Prefer: higher similarity with positives, lower similarity with negatives, fewer classes)
     *  - Get better criterion
     *  - Create a query from it
     *  - (What now?)
     */
    var criteriaSearchCtx = new this.CriteriaCandidateContext();
    for (var i = 0 ; i < collectingResults.length ; i++) {
        var rslt = collectingResults.data[i];
        for (var d = rslt.data.length-1, dr = 0 ; d >= 0 ; --d, --dr) {
            var elmt = rslt.data[d];
            var cls = this.root.Util.combinations(elmt.classes, 1);
            for (var j = 0 ; j < cls.length ; j++) {
                criteriaSearchCtx.getOrCreate(elmt.tag, cls[j], d+1, false).updateWithNewElement(collectingResults, i);
                criteriaSearchCtx.getOrCreate(elmt.tag, cls[j], dr , true ).updateWithNewElement(collectingResults, i);
            }
        }
    }
    console.log(criteriaSearchCtx.size()+" criteria found");
    var sortedCriteriaIdx = criteriaSearchCtx.getSortedIndexes();
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
    for (var i = 0 ; i < sortedCriteriaIdx.length ; i++) {
        var d = criteriaSearchCtx.getByIndex(sortedCriteriaIdx[i]);
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
    console.log(instances.length+" candidate criteria");
    arff += instances.join('\n');
    this.root.Ui.Arff.setDataExport(arff);

    if (best != undefined) {
        best = criteriaSearchCtx.getByIndex(sortedCriteriaIdx[best]);
        console.log("Best criterion");
        console.log(best);
    }

    // TODO: Use the rule, check validity, recurse
    var query = new this.XPath.Query();
    var d  = best.depth_is_reversed ? undefined : best.depth;
    var dr = best.depth_is_reversed ? best.depth : undefined;
    query.addCriterion(d, dr, best.tag, best.classes, undefined);
    query.setUseReversedDepth(best.depth_is_reversed);
    console.log("First query to test:", query.toXPath());
    var potentialResults = this.Stats.statElements(this.XPath.getResults(query.toXPath()));
    console.log("potential results:", potentialResults);
    var good = 0, bad = 0;
    for (var i = 0 ; i < potentialResults.length ; i++)
        if (potentialResults.stats.similarity.positives_as_ref.by_elmt.max[i] > potentialResults.stats.similarity.negatives_as_ref.by_elmt.max[i]) {
            good++;
            this.results.push(potentialResults.elements[i]);
        } else
            bad++;
    console.log("Good:",good,"Bad:",bad);
    if (bad != 0)
        alert("Not all results from the query are good!\n\n"+
            "Total:\t"+(good+bad)+"\n"+
            "Good:\t"+good+" ("+(100.0*good/(good+bad+0.0))+" %)\n"+
            "Bad:\t"+bad+" ("+(100.0*bad/(good+bad+0.0))+" %)");
}

window.PageExtractor.Algo.getSimilarTo = function (element) {
    element = this.Data.makeExample(element);
    var collectingQuery = new this.XPath.Query();
    collectingQuery.setUseReversedDepth(true);
    collectingQuery.addCriterion(undefined, 0, element.data[element.data.length-1].tag, [], undefined);
    var collectingResults = this.Stats.statElements(this.XPath.getResults(collectingQuery.toXPath()), [element], []);

    if (collectingResults.length == 0)
        return [];

    /*
     * Try using classes and hierarchy first.
     *  - Search for anything (like '/html/body//TAG')
     *  - Find good classes/depth:
     *     - Iterate results
     *     - Consider hierarchy from leaf to root
     *     - Note unique classes/depth and n-uples/ and /depth_reversed: use as key
     *     - Add if not already available
     *     - Update element count and means max similarity with positives and negatives, for that key
     *  - Sort by mean max similarity with positives
     *  - (Prefer: higher similarity with positives, lower similarity with negatives, fewer classes)
     *  - Get better criterion
     *  - Create a query from it
     */
    var criteriaSearchCtx = new this.CriteriaCandidateContext();
    for (var i = 0 ; i < collectingResults.length ; i++) {
        var rslt = collectingResults.data[i];
        for (var d = rslt.data.length-1, dr = 0 ; d >= 0 ; --d, --dr) {
            var elmt = rslt.data[d];
            var cls = this.root.Util.combinations(elmt.classes, 1);
            for (var j = 0 ; j < cls.length ; j++) {
                criteriaSearchCtx.getOrCreate(elmt.tag, cls[j], d+1, false).updateWithNewElement(collectingResults, i);
                criteriaSearchCtx.getOrCreate(elmt.tag, cls[j], dr , true ).updateWithNewElement(collectingResults, i);
            }
        }
    }
    var sortedCriteriaIdx = criteriaSearchCtx.getSortedIndexes();
    var best;
    for (var i = 0 ; i < sortedCriteriaIdx.length ; i++) {
        var d = criteriaSearchCtx.getByIndex(sortedCriteriaIdx[i]);
        if (d.mean_max_similarity_with_positives > d.mean_max_similarity_with_negatives) {
            best = i;
            break;
        }
    }

    if (best == undefined)
        return [];
    best = criteriaSearchCtx.getByIndex(sortedCriteriaIdx[best]);

    var results = [];
    var query = new this.XPath.Query();
    var d  = best.depth_is_reversed ? undefined : best.depth;
    var dr = best.depth_is_reversed ? best.depth : undefined;
    query.addCriterion(d, dr, best.tag, best.classes, undefined);
    query.setUseReversedDepth(best.depth_is_reversed);
    var potentialResults = this.Stats.statElements(this.XPath.getResults(query.toXPath()), [element], []);
    for (var i = 0 ; i < potentialResults.length ; i++)
        if (potentialResults.stats.similarity.positives_as_ref.by_elmt.max[i] > potentialResults.stats.similarity.negatives_as_ref.by_elmt.max[i])
            results.push(potentialResults.elements[i]);

    return results;
}

window.PageExtractor.Algo.CriteriaCandidateContext = function () {
    var index = {}; // Criterion key to index (for the "data" array) lookup map
    var data = []; // created criteria
    /** Returns the number of criteria this context contains */
    this.size = function() {
        return data.length;
    };
    /** Returns an existing criteria by index */
    this.getByIndex = function(index) {
        return data[index];
    };
    /** Creates a new Criteria or returns an already existing one, based on the given arguments. */
    var Criterion = function(tag, classes, depth, depth_is_reversed) {
        this.tag = tag;
        this.classes = classes;
        this.depth = depth;
        this.depth_is_reversed = depth_is_reversed ? true : false;
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
    /**
     * @param depth           Depth from /html/body, minimum is 1
     * @param depth_reversed  Depth from target to the current element (negative), maximum is 0
     */
    this.getOrCreate = function(tag, classes, depth, depth_is_reversed) {
        // Uniformize classes
        if (classes instanceof Array) {
            if (classes.length == 0)
                return undefined;
        } else {
            if (classes == undefined || classes == null)
                return undefined;
            classes = [classes];
        }
        // Deduplicate Criteria based on (classes, depth and depth_is_reversed)
        // If the key already exists in the index, return that instance instead of this newly created instance.
        var key = tag+"@"+classes.length+"["+classes.join(",")+"]"+(depth_is_reversed?"R":"N")+depth;
        var idx = index[key];
        var rtn;
        if (idx != undefined) {
            rtn = data[idx];
        } else {
            rtn = new Criterion(tag, classes, depth, depth_is_reversed);
            index[key] = data.length;
            data.push(rtn);
        }
        return rtn;
    };
    this.sortCb = function(a,b) {
        var v;
        v = b.mean_max_similarity_with_positives - a.mean_max_similarity_with_positives; // decreasing
        if (v != 0) return v;
        v = a.mean_max_similarity_with_negatives - b.mean_max_similarity_with_negatives; // increasing
        if (v != 0) return v;
        if (a.depth_is_reversed) {
            if (!b.depth_is_reversed) return -1; // reversed depth before non reversed
            v = b.depth - a.depth; // decreasing (farther up in hierarchy, from leaf)
        } else {
            if (b.depth_is_reversed) return 1; // non reversed depth after reversed
            v = a.depth - b.depth; // increasing (farther down in hierarchy, from root)
        }
        if (v != 0) return v;
        v = a.classes.length - b.classes.length; // increasing
        if (v != 0) return v;
        v = a.classes.join(' ').localeCompare(b.classes.join(' ')); // increasing
        if (v != 0) return v;
        v = a.tag.length - b.tag.length; // increasing
        if (v != 0) return v;
        v = a.tag.localeCompare(b.tag); // increasing
        if (v != 0) return v;
        // Don't compare element_count at this stage, it's pointless as it only depends on the preceding
        return 0;
    }
    this.getSortedIndexes = function(sortCb) {
        if (typeof(sortCb) != "function")
            sortCb = this.sortCb;
        boundSortCb = function(i,j) {
            return sortCb(data[i], data[j])
        };
        var rtn = [];
        for (var i = 0 ; i < data.length ; i++)
            rtn.push(i);
        rtn.sort(boundSortCb);
        return rtn;
    };
    return this;
};