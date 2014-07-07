var dropZone = $("#drop-cover, #drop-it");
var cancelAnimateOut = false;
var processLock = false;
var correctDirectory = false;
	
$(document).bind('dragover', function (e) {
    if (!processLock) {
        cancelAnimateOut = false;
        $("#progress-cover").width("0%");
        timeout = window.dropZoneTimeout;
        if (!timeout) {
            $("#drop-it").text("Drop it!");
            dropZone.addClass('show');
        } else {
            clearTimeout(timeout);
        }
        var found = false,
        node = e.target;
        do {
            if (node === dropZone[0]) {
                found = true;
                break;
            }
            node = node.parentNode;
        } while (node != null);

        window.dropZoneTimeout = setTimeout(function () {
            window.dropZoneTimeout = null;
            if (!cancelAnimateOut) dropZone.removeClass('show');
        }, 100);
    }
	e.preventDefault();
});

document.ondrop = function(e) {
    processLock = true;
    e.preventDefault();

	dropZone.addClass("show");
    cancelAnimateOut = true;
    
    changeTextTimeout = function() {
        if (processLock) {
            $("#drop-it").text("Processing...");
            $("#drop-it, #drop-sub").addClass("show");
        }
    }
    
    $("#drop-it").removeClass("show");
    
    setTimeout(changeTextTimeout, 250);
    correctDirectory = false;
    processTest(e.dataTransfer.items);
    e.dataTransfer = null;
}

var processFailure = function(message) {
    dropZone.removeClass("show");
    $("#drop-it, #drop-sub").removeClass("show");
    $("#step-number").text(message);
    $("#step-number").css("font-size", "60px");
    $("#step-number").css("color", "#bc3a3a");
    processLock = false;
}
