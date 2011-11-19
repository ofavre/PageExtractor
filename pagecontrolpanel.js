function Draggable(element) {
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

function initControlPanel(controlPanel) {
    new Draggable(controlPanel);
    document.getElementById("PageExtractorLaunchLearning").addEventListener("click", learn, false);
    document.getElementById("PageExtractorClearResults").addEventListener("click", clearResults, false);
    //document.getElementById("PageExtractorClose").src = chrome.extension.getURL("icon_16.png");
    document.getElementById("PageExtractorClose").addEventListener("click", PageExtractorTearDown, false);
    document.getElementById("PageExtractorDataExportHide").addEventListener("click", hideDataExport, false);
}
