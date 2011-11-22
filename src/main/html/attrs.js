/*
 * PageExtractor - An interactive page splitter
 *
 * Copyright(c) 2011 Olivier Favre <of.olivier.favre@gmail.com>
 * See LICENSE file.
 */

if (!window.PageExtractor) window.PageExtractor = {};
if (!window.PageExtractor.Html) window.PageExtractor.Html = { super: PageExtractor, root: window.PageExtractor };
if (!window.PageExtractor.Html.Attrs) window.PageExtractor.Html.Attrs = { super: window.PageExtractor.Html, root: window.PageExtractor };

window.PageExtractor.Html.Attrs.attributeValuesHas = function (target, attribute, values, all) {
    if (!(values instanceof Array))
        return (" "+target.getAttribute(attribute)+" ").indexOf(" "+values+" ") >= 0;
    var vls = this.attributeValuesGet(target, attribute);
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

window.PageExtractor.Html.Attrs.attributeValuesGet = function (target, attribute) {
    var value = target.getAttribute(attribute);
    if (!value || value.trim() == "") return [];
    return value.trim().split(/\s+/).sort();
}

window.PageExtractor.Html.Attrs.attributeValuesSet = function (target, attribute, values) {
    if (values instanceof Array)
        target.setAttribute(attribute, values.join(" "));
    else
        target.setAttribute(attribute, values);
}

window.PageExtractor.Html.Attrs.attributeValuesAdd = function (target, attribute, values) {
    if (!(values instanceof Array)) values = [values];
    var elmt_values = this.attributeValuesGet(target, attribute);
    for (var i = 0 ; i < values.length ; i++)
        if (elmt_values.indexOf(values[i]) < 0)
            elmt_values.push(values[i]);
        this.attributeValuesSet(target, attribute, elmt_values);
}

window.PageExtractor.Html.Attrs.attributeValuesRemove = function (target, attribute, values) {
    if (!(values instanceof Array)) values = [values];
    var elmt_values = this.attributeValuesGet(target, attribute);
    for (var i = 0 ; i < values.length ; i++) {
        var idx = elmt_values.indexOf(values[i]);
        if (idx >= 0)
            elmt_values.splice(idx, 1);
    }
    this.attributeValuesSet(target, attribute, elmt_values);
}
