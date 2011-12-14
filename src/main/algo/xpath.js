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

window.PageExtractor.Algo.XPath.Query = function() {
    /*
     * Multiple ORed queries (using "|").
     * ANDing is done implicitly when writing a query.
     * Input criteria is of the form:
     *    {Depth (reversed?), tag or "*", classes or empty, optional position} + ancestry level
     */
    var orQueries = [];
    this.addOr = function (query) {
        orQueries.push(query);
        return this;
    };
    var useReversedDepth = true;
    this.setUseReversedDepth = function (value) {
        useReversedDepth = value ? true : false;
        return this;
    };
    var criteriaByDepth = {
        // depth: criteria index
        // {
        //   depth: a positive (from root) number,
        //   tag: "SOMETAG" or undefined/"*",
        //   classes: [array of class, or empty],
        //   position: a positive (from first()) or negative (from last()) number or undefined
        // }
    };
    var criteriaByReversedDepth = {
        // (absolute value of) reversed depth: criteria index
        // {
        //   depth: the absolute value of a negative (from target) number,
        //   tag: "SOMETAG" or undefined/"*",
        //   classes: [array of class, or empty],
        //   position: a positive (from first()) or negative (from last()) number or undefined
        // }
    };
    this.addCriterion = function(depth, depth_reversed, tag, classes, position) {
        if (classes == undefined)
            classes = [];
        if (depth != undefined)
            criteriaByDepth[depth] = {
                depth: depth,
                tag: tag,
                classes: classes,
                position: position
            };
        if (depth_reversed != undefined)
            criteriaByReversedDepth[Math.abs(depth_reversed)] = {
                depth: Math.abs(depth_reversed),
                tag: tag,
                classes: classes,
                position: position
            };
    };
    var ancestryLevel = 0; // How many time to go back up from the target XPath element to reach the actual desired element
    this.setAncestryLevel = function(value) {
        ancestryLevel = parseInt(value);
        if (isNaN(ancestryLevel))
            ancestryLevel = 0;
        return this;
    };
    this.toXPath = function() {
        var prefix = "/html/body";
        var parts = ["(prefix placeholder)"];
        /*
         * Generate string for each depth
         *   constrained?
         *     generate the constrain
         *   unconstrained
         *     "*"
         * Join with "/"
         * Padding:
         *   !reversed
         *     prepend N times "*"
         *   reversed?
         *     append N times "*"
         * Bootstrap:
         *   reversed?
         *     prepend "/" (an additional / to get '//')
         */
        var set = useReversedDepth ? criteriaByReversedDepth : criteriaByDepth;
        var depthOffset = useReversedDepth ? 1 : 0; // reversed depth min is 0, depth min is 1, normalize and prevent placeholder from being erased
        for (var key in set) {
            var crit = set[key];
            var preconditions = [];
            if (crit.position != undefined) {
                if (crit.position >= 0)
                    preconditions.push("position()="+crit.position);
                else
                    preconditions.push("position()=last()-"+(Math.abs(crit.position)-1));
            }
            if (crit.classes.length > 0)
                preconditions.push('contains(concat(" ",@class," ")," ' + crit.classes.join(' ") and contains(concat(" ",@class," ")," ') + ' ")');
            var part = crit.tag == undefined ? "*" : crit.tag;
            if (preconditions.length > 0)
                part += "["+preconditions.join(" and ")+"]";
            parts[crit.depth + depthOffset] = part;
        }
        parts.shift(); // remove the placeholder for the following process
        if (parts.length > 0) {
            for (var i = 0 ; i < parts.length ; i++)
                if (parts[i] == undefined)
                    parts[i] = "*";
            if (parts.length > 0 && useReversedDepth)
                parts.reverse();
            if (useReversedDepth)
                prefix += "/";
            // Get the nth ancestor of the target element
            for (var i = Math.abs(ancestryLevel) ; i > 0 ; i--) {
                if (parts[parts.length-1] == "*")
                    parts.splice(parts.length-1,1);
                else
                    parts.push("..");
            }
        } else {
            parts.push(".");
        }
        parts.unshift(prefix);
        var rtn = parts.join("/");
        // ORing with other parts and returning
        if (orQueries.length > 0) {
            var ors = [];
            if (rtn != "")
                ors.push(rtn);
            for (var i = 0 ; i < orQueries.length ; i++) {
                var sub = orQueries[i].toXPath();
                if (sub.length != 0)
                    ors.push(sub);
            }
            rtn = ors.join(" | ");
        }
        return rtn;
    };
    this.copySelf = function() { // Returns a copy of the current query, WITHOUT the ORed queries
        var rtn = new window.PageExtractor.Algo.XPath.Query();
        rtn.setAncestryLevel(ancestryLevel);
        rtn.setUseReversedDepth(useReversedDepth);
        for (var key in criteriaByDepth) {
            var c = criteriaByDepth[key];
            rtn.addCriterion(c.depth, undefined, c.tag, c.classes, c.position);
        }
        for (var key in criteriaByReversedDepth) {
            var c = criteriaByReversedDepth[key];
            rtn.addCriterion(undefined, c.depth, c.tag, c.classes, c.position);
        }
        return rtn;
    };
    this.deepRecursiveCopy = function() { // Won't work with recursive objects!
        var rtn = this.copySelf();
        for (var i = 0 ; i < orQueries.length ; i++)
            rtn.addOr(orQueries[i].deepRecursiveCopy());
        return rtn;
    };
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
            if (found)
                return idx;
            idx += istep;
            if (siblings[i] == target) {
                // Test if index is already significant
                if (Math.abs(idx) != 1)
                    return idx;
                // Otherwise check if other exist
                found = true;
            }
        }
    }
    return 0; // index finally not necessary, or no match
}

window.PageExtractor.Algo.XPath.getSiblingsTagCount = function (target) {
    // Returns the number of same-tagName siblings of the target
    var cnt = 0;
    var siblings = target.parentNode.children;
    for (var i = 0 ; i < siblings.length ; i++)
        if (siblings[i].tagName == target.tagName) cnt++;
        return cnt;
}
