/*
 * PageExtractor - An interactive page splitter
 *
 * Copyright(c) 2011 Olivier Favre <of.olivier.favre@gmail.com>
 * See LICENSE file.
 */

if (!PageExtractor) PageExtractor = {};
if (!PageExtractor.Ui) PageExtractor.Ui = {};
if (!PageExtractor.Ui.Arff) PageExtractor.Ui.Arff = {};

PageExtractor.Ui.Arff.setDataExport = function (content) {
    document.getElementById("PageExtractorDataExportContainer").style.display = "block"; // default value of a div
    document.getElementById("PageExtractorDataExport").value = content;
}

PageExtractor.Ui.Arff.hideDataExport = function () {
    document.getElementById("PageExtractorDataExportContainer").style.display = "none";
}
