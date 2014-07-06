var dropZone = $("#drop-cover")
	
$(document).bind('dragover', function (e) {
	timeout = window.dropZoneTimeout;
	if (!timeout) {
		dropZone.addClass('in');
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
	if (found) {
		dropZone.addClass('hover');
	} else {
		dropZone.removeClass('hover');
	}
	window.dropZoneTimeout = setTimeout(function () {
		window.dropZoneTimeout = null;
		dropZone.removeClass('in hover');
	}, 100);
	e.preventDefault();
});

document.ondrop = function(e) {
alert("DROP FILES FOR WHAT?!??")
	console.log("file drop")
	dropZone.addClass("in")
	e.preventDefault();
}

document.onclick = function(e) {
alert("CLICK FILES FOR WHAT?!??")
}
