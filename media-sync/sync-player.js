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
                currentMedia.onSeek();
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

var onSCPlayerReady = function() {
    currentMedia.player.bind(SC.Widget.Events.PLAY, function(e) {
        currentMedia.altCurrentTime = e.currentPosition/1000;
        currentMedia.onPlay();
    });
    
    currentMedia.player.bind(SC.Widget.Events.PAUSE, function(e) {
        currentMedia.altCurrentTime = e.currentPosition/1000;
        currentMedia.onPause();
    });
    
    currentMedia.player.bind(SC.Widget.Events.FINISH, function(e) {
        currentMedia.altCurrentTime = e.currentPosition/1000;
        currentMedia.onStop();
    });
    
    currentMedia.player.bind(SC.Widget.Events.SEEK, function(e) {
        currentMedia.altCurrentTime = e.currentPosition/1000;
        currentMedia.onSeek();
    });
    
    currentMedia.player.bind(SC.Widget.Events.PLAY_PROGRESS, function(e) {
        currentMedia.altCurrentTime = e.currentPosition/1000;
        if (currentMedia.broadcastOnNextUpdate) {
            currentMedia.broadcastUpdate();
            currentMedia.broadcastOnNextUpdate = false;
        }
    });
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

