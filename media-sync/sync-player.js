var loadButton = $("#interaction-area #content-area #content-selector .input-group button");
var loadField = $("#interaction-area #content-area #content-selector .input-group input");
var contentArea = $("#interaction-area #content-area #content-display-area");

var youtubeMatcher = /www\.youtube\.com\/watch\?v=([^\?]+)/
var embedURL;
var embedElement;
var mediaPlayer;
var videoLoadTimeout;
var transitionPeriod;
var latency = 100;

var peopleReadyToPlay = [];

// Random youtube shit
var tag = document.createElement('script');

tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

onMessageType("ready-to-play", function(from, mediaURL) {
    if (mediaURL != embedURL) {
        peopleReadyToPlay = [];
        loadYoutube(mediaURL);
        peopleReadyToPlay.push(from);
    } else {
        for (key in peopleReadyToPlay) {
            if (peopleReadyToPlay[key] == from) {
                return;
            }
        }
        peopleReadyToPlay.push(from);
        
        if (peopleReadyToPlay.length == Object.keys(connectedPeers).length) {
            mediaPlayer.playVideo();
        }
    }
});

onMessageType("pause-media", function(from, time) {
    transitionPeriod = true;
    mediaPlayer.seekTo(time, true);
    mediaPlayer.pauseVideo();
    console.log("Pause video message");
});

onMessageType("play-media", function(from, time) {
    transitionPeriod = true;
    mediaPlayer.seekTo(time, true);
    console.log("Play video message");
    mediaPlayer.playVideo();
});

var getEmbedURL = function(url) {
    if (youtubeMatcher.exec(url)) {
        var videoCode = youtubeMatcher.exec(url)[1];
        return videoCode;
    } else {
        return false;
    }
}

var onPlayerReady = function() {
    console.log("Player ready!");
    mediaPlayer.playVideo();
}

var readyToPlay = function() {
    broadcastData("ready-to-play", embedURL);
    if (peopleReadyToPlay.length == Object.keys(connectedPeers).length) {
        setTimeout(mediaPlayer.playVideo, latency);
    }
}

var lastState = "start";
var onPlayerStateChange = function(obj) {
    var state = obj.data;
    console.log("Transitional:",transitionPeriod,"Last state:",lastState,"Current state:",state);
    if (state == 1 && !(peopleReadyToPlay.length == Object.keys(connectedPeers).length)) {
        mediaPlayer.pauseVideo();
        lastState = state;
    } else if (!transitionPeriod) {
        if (lastState == "start") {
            if (state == 1) {
                transitionPeriod = true;
                mediaPlayer.pauseVideo();
                console.log("Playing, stopping.")
            }
            console.log("Ready to play!");
            readyToPlay();
        } else if (lastState == 1 || lastState == 3) {
            if (state == 2) {
                console.log("Pausing");
                broadcastData("pause-media", mediaPlayer.getCurrentTime());
            }
        } else if (state == 1) {
            console.log("Playing");
            broadcastData("play-media", mediaPlayer.getCurrentTime());
        }
        lastState = state;
    } else {
        transitionPeriod = false;
    }
}

var loadYoutube = function(url) {
    contentArea.html("");
    embedURL = url;
    mediaPlayer = new YT.Player('content-display-area', {
      height: '390',
      width: '640',
      videoId: url,
      events: {
        'onReady': onPlayerReady,
        'onStateChange': onPlayerStateChange
      }
    });
}

loadButton.click(function() {
    if (loadField.val().trim().length >= 1) {
        embedURL = getEmbedURL(loadField.val().trim());
        if (embedURL) {
            loadYoutube(embedURL);
        } else {
            console.log("Error loading video");
        }
    }
});