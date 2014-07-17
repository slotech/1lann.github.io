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

Queue.prototype.getSerializedQueue = function() {
    var serializedQueue = {};
    serializedQueue["queue"] = this.queuedCodes;
    serializedQueue["titles"] = this.codesToTitles;
    serializedQueue["playing"] = this.currentlyPlaying;
}
                                       
Queue.prototype.getTitle = function(type, code, callback) {
    if (type == "youtube") {
        var testPlayer = new YT.Player(hiddenDivID, {
            height: "500px",
            width: "500px",
            videoId: code,
            events: {
                "onReady": function(callback) {
                    return function(event) {
                        var videoTitle = event.target.o.videoData.title;
                        testPlayer.destroy();
                        testPlayer = null;
                        $("#"+hiddenDivID).html("");
                        if (videoTitle.length > 0) {
                            console.log("YouTube: Valid video")
                            callback(videoTitle);
                        } else {
                            console.log("YouTube: Invalid video");
                            callback(false);
                        }
                    }
                }(callback)
            }
        });
    } else if (type == "soundcloud") {
        var testElement = $('<iframe width="500px" height="500px" scrolling="no" frameborder="no" src="https://w.soundcloud.com/player/?url='+ code +'&amp;auto_play=false&amp;hide_related=true&amp;show_comments=false&amp;show_user=true&amp;show_reposts=false&amp;visual=true"></iframe>');
        $("#"+hiddenDivID).append(testElement);
        var testPlayer = SC.Widget(testElement.get(0));
        
        var testErrorTimeout = setTimeout(function(callback, testPlayer) {
            return function() {
                console.log("Soundcloud: Could not find song!");
                testPlayer.unbind(SC.Widget.Events.READY);
                testPlayer = null;
                testElement.remove();
                testElement = null;
                $("#"+hiddenDivID).html("");
                callback(false);
            }
        }(callback, testPlayer), 5000);
        
        testPlayer.bind(SC.Widget.Events.READY, function(callback, testPlayer) {
            return function (){
                testPlayer.getCurrentSound(function(callback) {
                    return function(event) {
                        console.log("Soundcloud: Found title "+event.title);
                        clearTimeout(testErrorTimeout);
                        testPlayer = null;
                        testElement.remove();
                        testElement = null;
                        $("#"+hiddenDivID).html("");
                        callback(event.title)
                    }
                }(callback));
            }
        }(callback, testPlayer));  
    } else if (type == "html5") {
        var testAudio = $("<audio src='" + code.replace(/&/g,"&amp;") + "'></audio>")
        $("#"+hiddenDivID).append(testAudio);
        testAudio.get(0).addEventListener("error", function(callback) {
            return function() {
                console.log("HTML: Invalid audio");
                testAudio.remove();
                $("#"+hiddenDivID).html("");
                callback(false);
            }
        }(callback));
        testAudio.get(0).addEventListener("loadeddata", function(callback, code) {
            return function() {
                console.log("HTML: Valid audio");
                testAudio.remove();
                $("#"+hiddenDivID).html("");
                callback(code.substr(code.lastIndexOf('/') + 1))
            }
        }(callback, code));
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
        return ["html5", url];
    }
}