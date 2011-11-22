/*
 * PageExtractor - An interactive page splitter
 *
 * Copyright(c) 2011 Olivier Favre <of.olivier.favre@gmail.com>
 * See LICENSE file.
 */

if (!window.PageExtractor) window.PageExtractor = {};
if (!window.PageExtractor.Ui) window.PageExtractor.Ui = { super: PageExtractor, root: window.PageExtractor };
if (!window.PageExtractor.Ui.Arff) window.PageExtractor.Ui.Arff = { super: window.PageExtractor.Ui, root: window.PageExtractor };

window.PageExtractor.Ui.Arff.setDataExport = function (content) {
    document.getElementById("PageExtractorDataExportContainer").style.display = "block"; // default value of a div
    document.getElementById("PageExtractorDataExport").value = content;
}

window.PageExtractor.Ui.Arff.hideDataExport = function () {
    document.getElementById("PageExtractorDataExportContainer").style.display = "none";
}
