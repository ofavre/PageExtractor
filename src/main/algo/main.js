/*
 * PageExtractor - An interactive page splitter
 *
 * Copyright(c) 2011 Olivier Favre <of.olivier.favre@gmail.com>
 * See LICENSE file.
 */

if (!PageExtractor) PageExtractor = {};
if (!PageExtractor.Algo) PageExtractor.Algo = { super: PageExtractor, root: PageExtractor };

PageExtractor.Algo.positives = [];
PageExtractor.Algo.negatives = [];
PageExtractor.Algo.results = [];

PageExtractor.Algo.learn = function () {
    //var tmprslt = testRule('/html/body//'+positives[0].data[positives[0].data.length-1].tag+'[contains(concat(" ",@class," "),"'+positives[0].data[positives[0].data.length-1].classes[0]+'")]');
    var tmprslt = testRule('/html/body//'+positives[0].data[positives[0].data.length-1].tag);
    console.log(tmprslt);
    for (var i = 0 ; i < tmprslt.length ; i++)
        if (tmprslt.stats.similarity.positives_as_ref.by_elmt.max[i] > tmprslt.stats.similarity.negatives_as_ref.by_elmt.max[i])
            results.push(tmprslt.elements[i]);

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
