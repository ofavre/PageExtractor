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
