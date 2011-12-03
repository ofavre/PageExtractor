/*
 * PageExtractor - An interactive page splitter
 *
 * Copyright(c) 2011 Olivier Favre <of.olivier.favre@gmail.com>
 * See LICENSE file.
 */

if (!window.PageExtractor) window.PageExtractor = {};
if (!window.PageExtractor.Util) window.PageExtractor.Util = { super: PageExtractor, root: window.PageExtractor };

window.PageExtractor.Util.delegate = function (that, func) {
    if (func == undefined)
        throw "Undefined function!";
    if (func.constructor == String)
        return window.PageExtractor.Util.delegate(that, that[func]);
    return function(){
        return func.apply(that, arguments);
    };
};

/**
 * Generate combinations of the elements in the first arguments.
 * Can filter the minimum and maximum (both inclusive) element count.
 * Returns an array of array of elements.
 * Note that the element count filter is not efficient as all possible
 * combinations will be considered then filtered, before being generated.
 */
window.PageExtractor.Util.combinations = function(values, minElements, maxElements) {
    if (minElements == undefined) minElements = 0;
    if (maxElements == undefined) maxElements = values.length;
    var presence = [];
    for (var i = 0 ; i < values.length ; i++)
        presence.push(false);
    var rtn = [];
    var i = 0, cnt = 0;
    if (0 >= minElements)
        rtn.push([]);
    while (i < presence.length) {
        if (presence[i]) {
            presence[i] = false;
            cnt--;
            i++;
            continue;
        } else {
            presence[i] = true;
            cnt++;
            i = 0;
        }
        if (cnt >= minElements && cnt <= maxElements) {
            var c = [];
            for (var j = 0 ; j < presence.length ; j++)
                if (presence[j])
                    c.push(values[j]);
            rtn.push(c);
        }
    }
    return rtn;
};