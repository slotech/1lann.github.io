var loadButton = $("#interaction-area #content-area #content-selector .input-group button");
var loadField = $("#interaction-area #content-area #content-selector .input-group input");
var contentArea = $("#interaction-area #content-area #content-display-area");

// Random youtube shit
var tag = document.createElement('script');

tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
// End of random youtube shit

var onYoutubePlayerReady = function() {
    currentMedia.play();
    
    var lastSecond;
    
    setInterval(function() {
        if (lastSecond && currentMedia.state == "playing") {
            if (!((currentMedia.getCurrentTime() >= lastSecond) && (currentMedia.getCurrentTime() <= lastSecond+2))) {
                if (currentMedia.ignoreSeek) {
                    currentMedia.ignoreSeek = false;
                } else {
                    currentMedia.onSeek();
                }
            } 
        }
        lastSecond = currentMedia.getCurrentTime();
    }, 1000);
}

var onYoutubePlayerStateChange = function(obj) {
    var state = obj.data;
    if (state == 1) {
        if (currentMedia.state != "playing") {
            currentMedia.onPlay();
        }
    } else if (state == 2) {
        currentMedia.onPause();
    } else if (state == 0) {
        currentMedia.onStop();
    } else if (state == 3) {
        currentMedia.onBuffering();
    }
}

loadButton.click(function() {
    if (loadField.val().trim().length >= 1) {
        if (currentMedia.active) {
            currentMedia.destroy();
        }
        currentMedia = new MediaObject(loadField.val().trim());
        if (!currentMedia.type) {
            console.log("Failed to load Media!")
        }
    }
});

