/*
 * PageExtractor - An interactive page splitter
 *
 * Copyright(c) 2011 Olivier Favre <of.olivier.favre@gmail.com>
 * See LICENSE file.
 */

if (!PageExtractor) PageExtractor = {};
if (!PageExtractor.Html) PageExtractor.Html = { super: PageExtractor, root: PageExtractor };
if (!PageExtractor.Html.Attrs) PageExtractor.Html.Attrs = { super: PageExtractor.Html, root: PageExtractor };

PageExtractor.Html.Attrs.attributeValuesHas = function (target, attribute, values, all) {
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

PageExtractor.Html.Attrs.attributeValuesGet = function (target, attribute) {
    var value = target.getAttribute(attribute);
    if (!value || value.trim() == "") return [];
    return value.trim().split(/\s+/).sort();
}

PageExtractor.Html.Attrs.attributeValuesSet = function (target, attribute, values) {
    if (values instanceof Array)
        target.setAttribute(attribute, values.join(" "));
    else
        target.setAttribute(attribute, values);
}

PageExtractor.Html.Attrs.attributeValuesAdd = function (target, attribute, values) {
    if (!(values instanceof Array)) values = [values];
    var elmt_values = this.attributeValuesGet(target, attribute);
    for (var i = 0 ; i < values.length ; i++)
        if (elmt_values.indexOf(values[i]) < 0)
            elmt_values.push(values[i]);
        this.attributeValuesSet(target, attribute, elmt_values);
}

PageExtractor.Html.Attrs.attributeValuesRemove = function (target, attribute, values) {
    if (!(values instanceof Array)) values = [values];
    var elmt_values = this.attributeValuesGet(target, attribute);
    for (var i = 0 ; i < values.length ; i++) {
        var idx = elmt_values.indexOf(values[i]);
        if (idx >= 0)
            elmt_values.splice(idx, 1);
    }
    this.attributeValuesSet(target, attribute, elmt_values);
}
