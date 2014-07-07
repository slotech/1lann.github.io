var dropZone = $("#drop-cover, #drop-it");
var cancelAnimateOut = false;
var processLock = false;
var correctDirectory = false;
	
$(document).bind('dragover', function (e) {
    if (!processLock) {
        cancelAnimateOut = false;
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

// Everything from here down is for core development
// This will then be moved into a WebWorker in the future supposedly...

var gameDatabase = [] // Will store game data
var summonerDatabase = {} // Will point to a game in the gameDatabase
var gameStats = {
    "time": 0,
    "loading": 0
};


var toArray = function(list) {
    return Array.prototype.slice.call(list || [], 0);
}

var processProgress = 0;
var numOfFiles = 0;

var fileNameRegex = /(\d{4}-\d{2}-\d{2})T(\d{2}-\d{2})-\d{2}_r3dlog\.txt$/
var playersRegex = /Spawning champion \(([^\)]+)\) with skinID \d+ on team (\d)00 for clientID \d and summonername \(([^\)]+)\) \(is HUMAN PLAYER\)/g
var gameEndTimeRegex = /^(\d+\.\d+).+{"messageType":"riot__game_client__connection_info","message_body":"Game exited","exit_code":"EXITCODE_([^"]+)"}$/m
var gameStartTimeRegex= /^(\d+\.\d+).+GAMESTATE_GAMELOOP Begin$/m
var gameTypeRegex = /Initializing GameModeComponents for mode=(\w+)\./

var processFile = function(fileEntry) {
    if (fileNameRegex.exec(fileEntry.name)) {
        fileEntry.file(function(file) {
            var reader = new FileReader();

            reader.onloadend = function(e) {
                var gameDataConstruct = {};
                var logData = this.result;
                var errors = 0;
                var dateTime = fileNameRegex.exec(fileEntry.name);
                gameDataConstruct["date"] = dateTime[1].replace(/-/g,"/")+" "+dateTime[2].replace("-",":");
                gameDataConstruct["blue"] = {};
                gameDataConstruct["purple"] = {};
                while (player = playersRegex.exec(logData)) {
                    if (player[2] == "1") {
                        gameDataConstruct["blue"][player[3]] = player[1];
                    } else {
                        gameDataConstruct["purple"][player[3]] = player[1];
                    }
                }
                var gameEnd = gameEndTimeRegex.exec(logData);
                var gameEndTime;
                if (gameEnd) {
                    gameEndTime = parseFloat(gameEnd[1]);
                    gameDataConstruct["result"] = gameEnd[2].toLowerCase();
                } else {
                    errors = errors+1;
                    gameDataConstruct["result"] = "unknown";
                }
                var gameStart = gameStartTimeRegex.exec(logData);
                if (gameStart) {
                    var gameStartTime = parseFloat(gameStart[1]);
                    gameDataConstruct["time"] = gameEndTime-gameStartTime;
                    gameDataConstruct["loading-time"] = gameStartTime;
                    gameStats["time"] = gameStats["time"]+gameDataConstruct["time"];
                    gameStats["loading"] = gameStats["loading"]+gameDataConstruct["loading-time"]
                } else {
                    gameDataConstruct["time"] = 0;
                    gameDataConstruct["loading-time"] = 0;
                    errors = errors+1;
                }
                var gameType = gameTypeRegex.exec(logData);
                if (gameType) {
                    gameDataConstruct["type"] = gameType[1].toLowerCase();
                } else {
                    gameDataConstruct["type"] = "unknown";
                    errors = errors+1;
                }
                if (errors <= 1) {
                    gameDatabase.push(gameDataConstruct);
                }
                processProgress = processProgress+1;
                logData = null;
                this.result = null;
            };

            reader.readAsText(file);
        }, function(e){console.log(e)});
        return true;
    } else {
        return false;
    }
};

var progressInterval;

var displayProgress = function() {
    
}

var levels = 0;
var busy = false;
var folderProcessStack = [];
var folderProcessInterval;

var processTest;

var processFolders = function() {
    if (!busy) {
        if (folderProcessStack.length > 0) {
            var folderEntry = folderProcessStack.shift()
            
            var dirReader = folderEntry.createReader();
            var entries = [];

            var readEntries = function() {
                dirReader.readEntries (function(results) {
                    if (!results.length) {
                        processTest(entries);
                        return;
                    } else {
                        entries = entries.concat(toArray(results));
                        readEntries();
                    }
                }, function(e){console.log("File listing error",e);});
            };
            
            readEntries();
        } else {
            clearInterval(folderProcessInterval);
            folderProcessInterval = null;
        }
    } else {
        console.log("skipping");
    }
}

var processFailure = function() {
    dropZone.removeClass("show");
    $("#drop-it, #drop-sub").removeClass("show");
    $("#step-number").text("Could not find logs - Try again");
    $("#step-number").css("font-size", "60px");
    $("#step-number").css("color", "#bc3a3a");
    processLock = false;
}

processTest = function(files) {
    if (correctDirectory) {
        return;   
    }
    busy = true;
    levels = levels+1;
    if (levels > 100) {
        console.log("Reached max depth level")
        clearInterval(folderProcessInterval);
        folderProcessInterval = null;
        folderProcessStack = [];
        processFailure();
        return;
    }
    var length = files.length;
    for (var i = 0; i < length; i++) {
        var entry;
        
        if (files[i].webkitGetAsEntry) {
            entry = files[i].webkitGetAsEntry();
        } else {
            entry = files[i];
        }
        if (entry.isFile && i == 0) {
            if (processFile(entry)) {
                processProgress = 0;
                numOfFiles = length;
                console.log("Number of files:",numOfFiles);
                correctDirectory = true;
                clearInterval(folderProcessInterval);
                folderProcessInterval = null;
                folderProcessStack = [];
            }
        } else if (entry.isFile && correctDirectory) {
            processFile(entry);
        } else if (!entry.isFile && !correctDirectory) {
            folderProcessStack.push(entry);
            if (!folderProcessInterval) {
                folderProcessInterval = setInterval(processFolders, 10);
            }
        }
    }
    busy = false;
    if (folderProcessStack.length <= 0 && !correctDirectory) {
        console.log("Could not find files"); 
        files = null;
        processFailure();
    }
}