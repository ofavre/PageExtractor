/*
 * PageExtractor - An interactive page splitter
 *
 * Copyright(c) 2011 Olivier Favre <of.olivier.favre@gmail.com>
 * See LICENSE file.
 */

if (!window.PageExtractor) window.PageExtractor = {};
if (!window.PageExtractor.Algo) window.PageExtractor.Algo = { super: PageExtractor, root: window.PageExtractor };
if (!window.PageExtractor.Algo.Stats) window.PageExtractor.Algo.Stats = { super: window.PageExtractor.Algo, root: window.PageExtractor };

window.PageExtractor.Algo.Stats.statElements = function (elements) {
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
    // Copy elements
    rtn.elements = elements.slice();
    // Init 2D arrays
    for (var i = 0 ; i < this.super.positives.length ; i++) {
        rtn.stats.similarity.positives_as_ref.val_by_ref_by_elmt.push([]);
        rtn.stats.similarity.positives_as_ref.by_ref.avg.push(0.0);
        rtn.stats.similarity.positives_as_ref.by_ref.max.push(0.0);
    }
    for (var i = 0 ; i < this.super.negatives.length ; i++) {
        rtn.stats.similarity.negatives_as_ref.val_by_ref_by_elmt.push([]);
        rtn.stats.similarity.negatives_as_ref.by_ref.avg.push(0.0);
        rtn.stats.similarity.negatives_as_ref.by_ref.max.push(0.0);
    }

    // Collect statistics
    rtn.length = rtn.elements.length;
    var avg;
    for (var i = 0 ; i < rtn.length ; i++) {
        var ex = this.super.Data.makeExample(rtn.elements[i]);
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
        for (var p = 0 ; p < this.super.positives.length ; p++) {
            var sim = this.exampleSimilarity(rtn.data[i], this.super.positives[p]);
            avg += sim / this.super.positives.length;
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
        for (var p = 0 ; p < this.super.negatives.length ; p++) {
            var sim = this.exampleSimilarity(rtn.data[i], this.super.negatives[p]);
            avg += sim / this.super.negatives.length;
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

/** Similarity ([0;1]) of the two examples, using their hierarchy */
window.PageExtractor.Algo.Stats.exampleSimilarity = function (exA, exB) {
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
        sub += w * this.exampleSameLevelSimilarity(exA, i, exB, i);
        subr += w * this.exampleSameLevelSimilarity(exA, iAr, exB, iBr);
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

/** Normalized log difference of two positive numbers */
window.PageExtractor.Algo.Stats.logDiffNormed = function(x,y) {
    if (x == 0 && y == 0) return 1.0;
    var lx = Math.log(1+x);
    var ly = Math.log(1+y);
    return 1.0 - Math.abs(lx-ly)/Math.max(lx,ly);
}

/** Similarity ([0;1]) of the two examples at the given levels in hierarchy */
window.PageExtractor.Algo.Stats.exampleSameLevelSimilarity = function (exA, levelA, exB, levelB) {
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
    addToScore(1.5, this.logDiffNormed(A.position_max, B.position_max));
    addToScore(1.0, this.logDiffNormed(A.children_count, B.children_count));
    // XXX Deactivated: addToScore(0.0, this.logDiffNormed(A.text_len, B.text_len)); // FIXME Find good weight (0.5 ?)
    return weights == 0 ? 0.0 : rtn / weights;
}
