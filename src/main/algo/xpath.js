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
    var criteria = [
        // {
        //   depth: a positive (from root) number,
        //   depth_reversed: a negative (from target) number,
        //   tag: "SOMETAG" or undefined/"*",
        //   classes: [array of class, or empty],
        //   position: a positive (from first()) or negative (from last()) number or undefined
        // }
    ];
    var criteriaByDepth = {
        // depth: criteria index
    };
    var criteriaByReversedDepth = {
        // reversed depth: criteria index
    };
    this.addCriterion = function(depth, depth_reversed, tag, classes, position) {
        // New criterion
        var newCriterion = {
            depth: depth,
            depth_reversed: depth_reversed,
            tag: tag,
            classes: classes,
            position: position
        };
        // Look for depth to be already known
        var id = criteriaByDepth[depth];
        if (id == undefined) {
            // Create one new id
            // Index it
            criteriaByDepth[depth] = criteria.length;
            // Add the criterion
            criteria.push(newCriterion);
        } else
            criteria[id] = newCriterion;
        // Look for depth_reversed to be already known
        id = criteriaByReversedDepth[depth_reversed];
        if (id == undefined) {
            // Create one new id
            // Index it
            criteriaByReversedDepth[depth_reversed] = criteria.length;
            // Add the criterion
            criteria.push(newCriterion);
        } else
            criteria[id] = newCriterion;
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
        var parts = [];
        if (criteria.length > 0) {
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
            for (var key in set) {
                var crit = criteria[set[key]];
                var depth = useReversedDepth ? Math.abs(crit.depth_reversed) : crit.depth;
                var preconditions = [];
                if (crit.position != undefined) {
                    if (crit.position >= 0)
                        preconditions.push("position()="+crit.position);
                    else
                        preconditions.push("position()=last()-"+Math.abs(crit.position));
                }
                if (crit.classes.length > 0)
                    preconditions.push('contains(concat(" ",@class," ")," ' + crit.classes.join(' ") and contains(concat(" ",@class," ")," ') + ' ")');
                var part = crit.tag == undefined ? "*" : crit.tag;
                if (preconditions.length > 0)
                    part += "["+preconditions.join(" and ")+"]";
                parts[depth] = part;
            }
            for (var i = 1 ; i < parts.length ; i++)
                if (parts[i] == undefined)
                    parts[i] = "*";
            if (useReversedDepth) {
                parts.reverse();
                // Keep the first element at the first place, it's a placeholder
                parts.unshift(parts.pop());
            }
            if (useReversedDepth)
                prefix += "/";
        }
        parts[0] = prefix;
        // Get the nth ancestor of the target element
        for (var i = Math.abs(ancestryLevel) ; i > 0 ; i--) {
            if (parts[parts.length-1] == "*")
                parts.splice(parts.length-1,1);
            else
                parts.push("..");
        }
        if (ancestryLevel == 0)
            parts.push(".");
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
        for (var i = 0 ; i < criteria.length ; i++) {
            var c = criteria[i];
            rtn.addCriterion(c.depth, c.depth_reversed, c.tag, c.classes, c.position);
        }
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

window.PageExtractor.Algo.XPath.getSiblingsTagCount = function (target) {
    // Returns the number of same-tagName siblings of the target
    var cnt = 0;
    var siblings = target.parentNode.children;
    for (var i = 0 ; i < siblings.length ; i++)
        if (siblings[i].tagName == target.tagName) cnt++;
        return cnt;
}
