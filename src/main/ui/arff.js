/*
 * PageExtractor - An interactive page splitter
 *
 * Copyright(c) 2011 Olivier Favre <of.olivier.favre@gmail.com>
 * See LICENSE file.
 */

function setDataExport(content) {
    document.getElementById("PageExtractorDataExportContainer").style.display = "block"; // default value of a div
    document.getElementById("PageExtractorDataExport").value = content;
}
function hideDataExport() {
    document.getElementById("PageExtractorDataExportContainer").style.display = "none";
}
