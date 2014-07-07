// Everything from here down is for core development
// This will then be moved into a WebWorker in the future supposedly...

var gameDatabase = {} // Will store game data
var summonerDatabase = {} // Will be used to see who you most play with
var frequencyDatabase = []
var summonerName;

var gameStats = {
    "time": 0,
    "loading": 0
};


var toArray = function(list) {
    return Array.prototype.slice.call(list || [], 0);
}

var processProgress = 0;
var numOfFiles = 0;

var getRates = function(summoner, champion) {
    var wins = 0;
    var loses = 0;
    if (!champion) {
        for (var champion in summonerDatabase[summoner]) {
            for (var key in summonerDatabase[summoner][champion]) {
                if (gameDatabase[summonerDatabase[summoner][champion][key]]["result"] == "win") {
                    wins++;
                } else {
                    loses++;
                }
            }
        }
    } else {
        for (var key in summonerDatabase[summoner][champion]) {
            if (gameDatabase[summonerDatabase[summoner][champion][key]]["result"] == "win") {
                wins++;
            } else {
                loses++;
            }
        }
    }
    return [wins, loses, Math.ceil((wins/(loses+wins))*1000-0.5)/10];
}

var summonersPlayedWith = function() {
    var summonerFrequency = {};
    for (var summoner in summonerDatabase) {
        summonerFrequency[summoner] = 0;
        for (var championName in summonerDatabase[summoner]) {
            for (var key in summonerDatabase[summoner][championName]) {
                summonerFrequency[summoner]++;
            }
        }
    }
    var frequencyInOrder = []
    for (var key in summonerFrequency) frequencyInOrder.push([key, summonerFrequency[key]]);
    frequencyInOrder.sort(function(a, b) {
        a = a[1];
        b = b[1];
        
        return a < b ? 1 : (a > b ? -1:0);
    });
    summonerName = frequencyInOrder.shift()[0];
    frequencyDatabase = frequencyInOrder;
}

var fileNameRegex = /(\d{4}-\d{2}-\d{2})T(\d{2}-\d{2})-\d{2}_r3dlog\.txt$/
var playersRegex = /Spawning champion \(([^\)]+)\) with skinID \d+ on team (\d)00 for clientID \d and summonername \(([^\)]+)\) \(is HUMAN PLAYER\)/g
var gameEndTimeRegex = /^(\d+\.\d+).+{"messageType":"riot__game_client__connection_info","message_body":"Game exited","exit_code":"EXITCODE_([^"]+)"}$/m
var gameStartTimeRegex= /^(\d+\.\d+).+GAMESTATE_GAMELOOP Begin$/m
var gameTypeRegex = /Initializing GameModeComponents for mode=(\w+)\./
var gameIDRegex = /Receiving PKT_World_SendGameNumber, GameID: ([^,]+),/

var pushIfNotPresent = function(arr, data) {
    for (var key in arr) {
        if (arr[key] == data) {
            return false   
        }
    }
    arr.push(data);
    return true;
}

var processFile = function(fileEntry) {
    if (fileNameRegex.exec(fileEntry.name)) {
        fileEntry.file(function(file) {
            var reader = new FileReader();

            reader.onloadend = function(e) {
                var gameDataConstruct = {};
                var logData = this.result;
                var errors = 0;
                var gameID = gameIDRegex.exec(logData);
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
                    if (!summonerDatabase[player[3]]) summonerDatabase[player[3]] = {};
                    if (!summonerDatabase[player[3]][player[1]]) summonerDatabase[player[3]][player[1]] = [];
                    if (gameID) {
                        pushIfNotPresent(summonerDatabase[player[3]][player[1]], gameID[1]);
                    }
                }
                var gameEnd = gameEndTimeRegex.exec(logData);
                var gameEndTime;
                if (gameEnd) {
                    gameEndTime = parseFloat(gameEnd[1]);
                    gameDataConstruct["result"] = gameEnd[2].toLowerCase();
                } else {
                    errors++;
                    gameDataConstruct["result"] = "unknown";
                }
                var gameStart = gameStartTimeRegex.exec(logData);
                if (gameStart) {
                    var gameStartTime = parseFloat(gameStart[1]);
                    gameDataConstruct["loading-time"] = gameStartTime;
                    gameStats["loading"] = gameStats["loading"]+gameDataConstruct["loading-time"]
                    if (gameEndTime) {
                        gameDataConstruct["time"] = gameEndTime-gameStartTime;
                        gameStats["time"] = gameStats["time"]+gameDataConstruct["time"];
                    } else {
                        gameDataConstruct["time"] = 0;   
                    }
                } else {
                    gameDataConstruct["time"] = 0;
                    gameDataConstruct["loading-time"] = 0;
                    errors++;
                }
                var gameType = gameTypeRegex.exec(logData);
                if (gameType) {
                    gameDataConstruct["type"] = gameType[1].toLowerCase();
                } else {
                    gameDataConstruct["type"] = "unknown";
                    errors++;
                }
                if (errors <= 1 && gameID) {
                    gameDatabase[gameID[1]] = gameDataConstruct;
                }
                processProgress++;
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
    var percent = Math.ceil((processProgress/numOfFiles)/1.333333*1000-0.5)/10;
    $("#progress-cover").width(percent.toString()+"%");
    $("#drop-sub").text("Progress: "+percent.toString()+"%");
    if (percent >= 75) {
        clearInterval(progressInterval);   
        summonersPlayedWith();
    }
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

processTest = function(files) {
    if (correctDirectory) {
        return;   
    }
    busy = true;
    levels++;
    if (levels > 100) {
        console.log("Reached max depth level")
        clearInterval(folderProcessInterval);
        folderProcessInterval = null;
        folderProcessStack = [];
        processFailure("Could not find logs - Try again");
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
                clearInterval(folderProcessInterval);
                folderProcessInterval = null;
                folderProcessStack = [];
                if (numOfFiles >= 20) {
                    correctDirectory = true;
                    progressInterval = setInterval(displayProgress, 200);
                } else {
                    files = null;
                    processFailure("Not enough logs to generate useful information!");   
                    return;
                }
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
        processFailure("Could not find logs - Try again");
    }
}