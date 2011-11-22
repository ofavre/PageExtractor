/*
 * PageExtractor - An interactive page splitter
 *
 * Copyright(c) 2011 Olivier Favre <of.olivier.favre@gmail.com>
 * See LICENSE file.
 */

if (!window.PageExtractor) window.PageExtractor = {};
if (!window.PageExtractor.ControlPanel) window.PageExtractor.ControlPanel = { super: PageExtractor, root: window.PageExtractor };

window.PageExtractor.ControlPanel.Draggable = function (element) {
    var that = this;
    this.element = element;
    this.init = function() {
        this.element.addEventListener('mousedown', that.onMouseDown, true);
    }
    this.onMouseDown = function(evt) {
        // Make sure the user didn't click on an important (non-draggable) object inside the control panel
        if (evt.button != 0) return;
        var curr = evt.target;
        while (curr && curr != document.body && curr != that.element) {
            var attr = curr.getAttribute("data-draggable");
            if (attr != null && attr == "no") return;
            curr = curr.parentNode;
        }
        if (curr != that.element) return; // target is not a child of the control panel (or itself)
        that.lastX = evt.clientX;
        that.lastY = evt.clientY;
        document.addEventListener('mousemove', that.onMouseMove, true);
        document.addEventListener('mouseup'  , that.onMouseUp  , true);
        evt.stopPropagation();
        evt.preventDefault();
    }
    this.onMouseMove = function(evt) {
        element.style.top  = (element.offsetTop  + evt.clientY - that.lastY) + "px";
        element.style.left = (element.offsetLeft + evt.clientX - that.lastX) + "px";
        that.lastX = evt.clientX;
        that.lastY = evt.clientY;
        evt.stopPropagation();
        evt.preventDefault();
    }
    this.onMouseUp = function(evt) {
        evt.stopPropagation();
        evt.preventDefault();
        document.removeEventListener('mousemove', that.onMouseMove, true);
        document.removeEventListener('mouseup'  , that.onMouseUp  , true);
    }
    this.init();
}

window.PageExtractor.ControlPanel.initControlPanel = function (controlPanel) {
    new this.Draggable(controlPanel);
    document.getElementById("PageExtractorLaunchLearning").addEventListener("click", this.root.Util.delegate(this.root.Ui.Manip, 'learn'), false);
    document.getElementById("PageExtractorClearResults").addEventListener("click", this.root.Util.delegate(this.root.Ui.Manip, 'clearResults'), false);
    document.getElementById("PageExtractorClose").addEventListener("click", this.root.Util.delegate(this.root.Setup, 'tearDown'), false);
    document.getElementById("PageExtractorDataExportHide").addEventListener("click", this.root.Util.delegate(this.root.Ui.Arff, 'hideDataExport'), false);
}
