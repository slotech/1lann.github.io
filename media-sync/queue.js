var youtubeMatcher = /www\.youtube\.com\/watch\?v=([^&]+)/
var hiddenDivID = "hidden-test-area" 

var Queue = function() {
    var queuedCodes = [];
    var codesToTitles = {};
    var currentlyPlaying;
}

Queue.prototype.setSerializedQueue = function(serializedQueue) {
    if (serializedQueue["queue"] && serializedQueue["titles"] && serializedQueue["playing"]) {
        this.queuedCodes = serializedQueue["queue"];
        this.codesToTitiles = serializedQueue["titles"];
        if (this.currentlyPlaying != serializedQueue["playing"]) {
            Queue.play(serializedQueue.playing);
        }
    }
}

Queue.prototype.play = function() {
    
}

Queue.prototype.getTitle = function(type, code) {
    if (type == "youtube") {
        
    }
}
                                       
Queue.prototype.getTitle = function(type, code, callback) {
    if (type == "youtube") {
        var testPlayer = new YT.Player(hiddenDivID, {
            height: "500px",
            width: "500px",
            videoId: code,
            events: {
                "onReady": function(callback) {
                    return function() {
                        console.log(event.target)
                    }
                }(callback);
            }
        });
    } else if (type == "soundcloud") {
        
    } else if (type == "html5") {
        callback(code.substr(code.lastIndexOf('/') + 1));
    }
}

Queue.prototype.getTypeAndCode = function(url) {
    if (youtubeMatcher.exec(url)) {
        var videoCode = youtubeMatcher.exec(url)[1];
        return ["youtube", videoCode];
    } else if (url.indexOf("//soundcloud.com") > 0) {
        console.log("Matched soundcloud audio");
        return ["soundcloud", url];
    } else {
        // Complex shit
        return ["html5", url];
    }
    // Returns type, code
}

var Queue.prototype.getSerializedQueue = function() {
    var serializedQueue = {};
    serializedQueue["queue"] = this.queuedCodes;
    serializedQueue["titles"] = this.codesToTitles;
    serializedQueue["playing"] = this.currentlyPlaying;
}

var getTitleOfMedia = function(url) {
    
}

MediaObject.prototype.getCodeFromURL = function(url) {
    if (youtubeMatcher.exec(url)) {
        console.log("Matched youtube video");
        var videoCode = youtubeMatcher.exec(url)[1];
        return ["youtube", videoCode];
    } else if (url.indexOf("//soundcloud.com") > 0) {
        console.log("Matched soundcloud audio");
        return ["soundcloud", url];
    } else {
        return ["html5", url];
    }
}