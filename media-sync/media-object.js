var peopleReadyToPlay = [];

var latency = 100;

var youtubeMatcher = /www\.youtube\.com\/watch\?v=([^&]+)/

var addToReadyToPlay = function(person) {
    for (key in peopleReadyToPlay) {
        if (person == peopleReadyToPlay[key]) {
            return false;
        }
    }
    peopleReadyToPlay.push(person);
    return true;
}

var MediaObject = function(url) {
    this.active = false;
    this.type = false;
    this.code = false;
    this.player = false;
    this.element = false;
    this.skipEvent = false;
    this.catchUp = false;
    this.state = "loading";
    this.buffering = false;
    this.ignoreSeek = false;
    if (url && this.getCodeFromURL(url)) {
        var typeAndCode = this.getCodeFromURL(url);
        this.type = typeAndCode[0];
        this.code = typeAndCode[1];
        this.displayMedia();
    }
    
    onMessageType("media-data", function(media) {
        return function(from, data) {
            media.setSerializedState(from, data);
        }
    }(this));
    
    onMessageType("request-media-data", function(media) {
        return function(from) {
            console.log("Received media data request");
            if (media.active) {
                media.sendUpdate(from);
            } else {
                console.log("Not active!")
            }
        }
    }(this));
}

MediaObject.prototype.displayMedia = function() {
    if (this.code) {
        if (this.type == "youtube") {
            this.active = true;
            this.player = new YT.Player("content-display-area", {
                height: "390",
                width: "640",
                videoId: this.code,
                events: {
                    "onReady": onYoutubePlayerReady,
                    "onStateChange": onYoutubePlayerStateChange
                }
            });
            return true;
        }
    } else {
        console.log("Attempt to display media without a code");
        return false;
    }
}

MediaObject.prototype.getSerializedState = function() {
    console.log("Creating serialized data");
    var serializedState = {};
    serializedState["time"] = this.getCurrentTime();
    serializedState["state"] = this.state;
    serializedState["code"] = this.code;
    serializedState["type"] = this.type;
    return serializedState;
}

MediaObject.prototype.setSerializedState = function(from, serializedState) {
    console.log("Setting state from message...")
    if (serializedState["type"] == this.type && serializedState["code"] == this.code) {
        console.log("Updating currently playing media");
        var curSeconds = new Date().getTime() / 1000;
        this.seekTo(serializedState["time"]);
        if (serializedState["state"]) {
            if (serializedState["state"] == "paused") {
                this.pause();
            } else if (serializedState["state"] == "playing") {
                this.play();
            } else if (serializedState["state"] == "ready") {
                addToReadyToPlay(from);
                if (peopleReadyToPlay.length == Object.keys(connectedPeers).length) {
                    console.log("Everyone ready! Playing...")
                    this.play();
                }
            }
        }
    } else {
        console.log("Loading new media...");
        this.destroy();
        this.type = serializedState["type"];
        this.code = serializedState["code"];
        if (serializedState["state"] == "ready") {
            addToReadyToPlay(from);
        } else {
            this.catchUp = true;
        }
        this.displayMedia();
    }
}

MediaObject.prototype.broadcastUpdate = function() {
    broadcastData("media-data", this.getSerializedState());
}

MediaObject.prototype.sendUpdate = function(target) {
    sendData(target, "media-data", this.getSerializedState());
}

MediaObject.prototype.play = function() {
    if (this.state != "playing") {
        this.skipEvent = true;
    }
    if (this.type == "youtube") {
        this.player.playVideo();
    }
}

MediaObject.prototype.pause = function() {
    if (this.state != "paused") {
        this.skipEvent = true;
    }
    if (this.type == "youtube") {
        this.player.pauseVideo();
    }
}

MediaObject.prototype.seekTo = function(seconds) {
    this.skipEvent = true;
    if (this.type == "youtube") {
        this.skipEvent = false;
        this.ignoreSeek = true;
        setTimeout(function(media) {
            return function() {
                media.ignoreSeek = false;    
            }
        }(this), 1000);
        this.player.seekTo(seconds, true);
    }
}

MediaObject.prototype.getCurrentTime = function() {
    if (this.type == "youtube") {
        return this.player.getCurrentTime();
    }
}

MediaObject.prototype.destroy = function() {
    if (this.type == "youtube") {
        console.log("Destroying player...");
        this.active = false;
        this.type = false;
        this.code = false;
        this.player = false;
        this.element = false;
        this.skipEvent = false;
        this.catchUp = false;
        this.state = "loading";
        this.buffering = false;
        this.ignoreSeek = false;
        this.player.destroy();
        if (this.element) {
            this.element.remove();
        }
    }
}

MediaObject.prototype.onPause = function() {
    if (this.state == "loading") {
        this.state = "ready";
    } else if (this.state != "ready") {
        this.state = "paused";
        if (!this.skipEvent) {
            this.broadcastUpdate();
        } else {
            this.skipEvent = false;
        }
    }
}

MediaObject.prototype.onPlay = function() {
    console.log("Play event");
    if (this.state == "loading") {
        this.readyToPlay();
    } else {
        this.state = "playing";
        if (this.buffering) {
            this.buffering = false;
            setTimeout(function(){requestData("request-media-data")}, 1000);
        }
        if (!this.skipEvent) {
            this.broadcastUpdate();  
        } else {
            this.skipEvent = false;
        }
    }
}

MediaObject.prototype.onBuffering = function() {
    this.buffering = true;
}

MediaObject.prototype.onStop = function() {
    this.state = "stopped";
}

MediaObject.prototype.onSeek = function() {
    if (!this.skipEvent) {
        console.log("Detected seek")
        this.broadcastUpdate();
    } else {
        this.skipEvent = false;
    }
}

MediaObject.prototype.readyToPlay = function() {
    console.log("Ready to play!");
    this.state = "ready";
    this.pause();
    if (this.catchUp) {
        console.log("BUT WAIT! CHATCHUP!")
        requestData("request-media-data");
        this.catchUp = false;
    } else {
        this.broadcastUpdate();
        if (peopleReadyToPlay.length >= Object.keys(connectedPeers).length) {
            console.log("Everyone already ready! Playing...")
            setTimeout(function(media) { return function() {
                media.play()
            }}(this), latency);
        }
    }
}

MediaObject.prototype.getCodeFromURL = function(url) {
    if (youtubeMatcher.exec(url)) {
        console.log("Matched youtube video");
        var videoCode = youtubeMatcher.exec(url)[1];
        return ["youtube", videoCode];
    } else {
        console.log("Invalid");
        return false;
    }
}

currentMedia = new MediaObject();