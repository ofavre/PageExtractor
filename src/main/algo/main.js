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
    //var tmprslt = testRule('/html/body//'+this.positives[0].data[this.positives[0].data.length-1].tag+'[contains(concat(" ",@class," "),"'+this.positives[0].data[this.positives[0].data.length-1].classes[0]+'")]');
    var tmprslt = this.Stats.statElements(this.XPath.getResults('/html/body//'+this.positives[0].data[this.positives[0].data.length-1].tag));
    console.log(tmprslt);
    for (var i = 0 ; i < tmprslt.length ; i++)
        if (tmprslt.stats.similarity.positives_as_ref.by_elmt.max[i] > tmprslt.stats.similarity.negatives_as_ref.by_elmt.max[i])
            this.results.push(tmprslt.elements[i]);

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
     *  - (What now?)
     */
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
    var criteriaSearchCtx = new this.CriteriaCandidateContext();
    for (var i = 0 ; i < tmprslt.length ; i++) {
        var rslt = tmprslt.data[i];
        for (var d = rslt.data.length-1 ; d >= 0 ; d--) {
            var elmt = rslt.data[d];
            var cls = combinations(elmt.classes);
            for (var j = 0 ; j < cls.length ; j++) {
                criteriaSearchCtx.getOrCreate(cls[j], elmt.depth         , false).updateWithNewElement(tmprslt, i);
                criteriaSearchCtx.getOrCreate(cls[j], elmt.depth_reversed, true ).updateWithNewElement(tmprslt, i);
            }
        }
    }
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
    arff += instances.join('\n');
    this.root.Ui.Arff.setDataExport(arff);

    if (best != undefined) {
        best = criteriaSearchCtx.getByIndex(sortedCriteriaIdx[best]);
        console.log(best);
    }
    // TODO: Use the rule, check validity, recurse
    // TODO: Create a criteria class, that generates XPath queries
}

window.PageExtractor.Algo.CriteriaCandidateContext = function () {
    var index = {}; // Criteria key to index (for the "data" array) lookup map
    var data = []; // created Criteria
    /** Returns an existing criteria by index */
    this.getByIndex = function(index) {
        return data[index];
    };
    /** Creates a new Criteria or returns an already existing one, based on the given arguments. */
    var Criteria = function(classes, depth, depth_is_reversed) {
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
    this.getOrCreate = function(classes, depth, depth_is_reversed) {
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
        var key = classes.length+"["+classes.join(",")+"]"+(depth_is_reversed?"R":"N")+depth;
        var idx = index[key];
        var rtn;
        if (idx != undefined) {
            rtn = data[idx];
        } else {
            rtn = new Criteria(classes, depth, depth_is_reversed);
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