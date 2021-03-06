// Everything from here down is for core development
// This will then be moved into a WebWorker in the future supposedly...

var gameDatabase = {} // Will store game data
var summonerDatabase = {} // Will be used to see who you most play with
var summonerFrequencyDatabase = {};
var summonerName;

var gameStats = {
    "loading": 0
};


var toArray = function(list) {
    return Array.prototype.slice.call(list || [], 0);
}

var processProgress = 0;
var numOfFiles = 0;

var getRegion = function(summoner) {
    var regionFrequency = {};
    for (var champion in summonerDatabase[summoner]) {
        for (var key in summonerDatabase[summoner][champion]) {
            var region = gameDatabase[summonerDatabase[summoner][champion][key]]["region"];
            if (!regionFrequency[region]) {
                regionFrequency[region] = 0;
            }
            regionFrequency[region]++;
        }
    }
    var mostOccur = 0;
    var mostRegion = "";
    for (var region in regionFrequency) {
        if (regionFrequency[region] > mostOccur) {
            mostOccur = regionFrequency[region];
            mostRegion = region;
        }
    }
    return mostRegion;
}

var ratesCache = {}
var getRates = function(summoner, champion) {
    if (champion && ratesCache[summoner+":"+champion]) {
        return ratesCache[summoner+":"+champion];
    } else if (!champion && ratesCache[summoner]) {
        return ratesCache[summoner];
    }
    var blueWins = 0;
    var blueLoses = 0;
    var purpleWins = 0;
    var purpleLoses = 0;
    var blueGames = 0;
    var purpleGames = 0;
    if (!champion) {
        for (var champion in summonerDatabase[summoner]) {
            for (var key in summonerDatabase[summoner][champion]) {
                var gameObject = gameDatabase[summonerDatabase[summoner][champion][key]];
                if (gameObject["blue"][summonerName] && gameObject["blue"][summoner]) {
                    blueGames++;
                    if (gameObject["result"] == "win") {
                        blueWins++;
                    } else if (gameObject["result"] == "lose") {
                        blueLoses++;
                    }
                } else if (gameObject["purple"][summonerName] && gameObject["purple"][summoner]) {
                    purpleGames++;
                    if (gameObject["result"] == "win") {
                        purpleWins++;
                    } else if (gameObject["result"] == "lose") {
                        purpleLoses++;
                    }
                }
            }
            ratesCache[summoner] = [blueGames+purpleGames, blueWins+purpleWins, blueLoses+purpleLoses, blueGames, purpleGames, blueWins, blueLoses, purpleWins, purpleLoses];
        }
    } else {
        for (var key in summonerDatabase[summoner][champion]) {
            var gameObject = gameDatabase[summonerDatabase[summoner][champion][key]];
            if (gameObject["blue"][summonerName] && gameObject["blue"][summoner]) {
                blueGames++;
                if (gameObject["result"] == "win") {
                    blueWins++;
                } else if (gameObject["result"] == "lose") {
                    blueLoses++;
                }
            } else if (gameObject["purple"][summonerName] && gameObject["purple"][summoner]) {
                purpleGames++;
                if (gameObject["result"] == "win") {
                    purpleWins++;
                } else if (gameObject["result"] == "lose") {
                    purpleLoses++;
                }
            }
        }
        ratesCache[summoner+":"+champion] = [blueGames+purpleGames, blueWins+purpleWins, blueLoses+purpleLoses, blueGames, purpleGames, blueWins, blueLoses, purpleWins, purpleLoses];
    }
    return [blueGames+purpleGames, blueWins+purpleWins, blueLoses+purpleLoses, blueGames, purpleGames, blueWins, blueLoses, purpleWins, purpleLoses];
}

var timeSpentPlaying = function(summoner, champion) {
    var totalTime = 0;
    
    if (champion) {
        for (var key in summonerDatabase[summoner][champion]) {
            var gameObject = gameDatabase[summonerDatabase[summoner][champion][key]];
            if (gameObject["time"] && (gameObject["blue"][summonerName] || gameObject["purple"][summonerName])) {
                totalTime = totalTime+gameDatabase[summonerDatabase[summoner][champion][key]]["time"];
            }
        }
    } else {
        for (var champ in summonerDatabase[summoner]) {
            for (var key in summonerDatabase[summoner][champ]) {
                var gameObject = gameDatabase[summonerDatabase[summoner][champ][key]];
                if (gameObject["time"] && (gameObject["blue"][summonerName] || gameObject["purple"][summonerName])) {
                    totalTime = totalTime+gameDatabase[summonerDatabase[summoner][champ][key]]["time"];
                }
            }
        }
    }
    return totalTime;
}

var getSummonerName = function() {
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
    summonersPlayedWith();
}

var summonersPlayedWith = function(summoner) {
    var summonerFrequency = {};
    for (var summoner in summonerDatabase) {
        var rates = getRates(summoner);
        summonerFrequency[summoner] = rates[0];
    }
    var frequencyInOrder = []
    for (var key in summonerFrequency) frequencyInOrder.push([key, summonerFrequency[key]]);
    frequencyInOrder.sort(function(a, b) {
        a = a[1];
        b = b[1];
        
        return a < b ? 1 : (a > b ? -1:0);
    });
    frequencyInOrder.shift();
    summonerFrequencyDatabase = frequencyInOrder;
}

var championsPlayedWith = function(summoner) {
    var championFrequency = {};
    var total = 0;
    for (var champion in summonerDatabase[summoner]) {
        championFrequency[champion] = summonerDatabase[summoner][champion].length;
        total = total+summonerDatabase[summoner][champion].length;
    }
    var frequencyInOrder = []
    for (var key in championFrequency) frequencyInOrder.push([key, championFrequency[key]]);
    frequencyInOrder.sort(function(a, b) {
        a = a[1];
        b = b[1];
        
        return a < b ? 1 : (a > b ? -1:0);
    });
    return frequencyInOrder;
}

var fileNameRegex = /(\d{4}).(\d{2}).(\d{2}).(\d{2}).(\d{2}).(\d{2}).r3dlog\.txt$/
var playersRegex = /Spawning champion \(([^\)]+)\) with skinID \d+ on team (\d)00 for clientID \d and summonername \(([^\)]+)\) \(is HUMAN PLAYER\)/g
var altPlayerRegex = /Hero ([^(]+).+ created for (.+)/g
var gameEndTimeRegex = /^(\d+\.\d+).+{"messageType":"riot__game_client__connection_info","message_body":"Game exited","exit_code":"EXITCODE_([^"]+)"}$/m
var altGameEndRegex = /^(\d+\.\d+).+Game exited$/m
var gameStartTimeRegex= /^(\d+\.\d+).+GAMESTATE_GAMELOOP Begin$/m
var gameTypeRegex = /Initializing GameModeComponents for mode=(\w+)\./
var gameIDRegex = /Receiving PKT_World_SendGameNumber, GameID: ([^,]+), PlatformID: ([A-Z]+)/

var pushIfNotPresent = function(arr, data) {
    for (var key in arr) {
        if (arr[key] == data) {
            return false   
        }
    }
    arr.push(data);
    return true;
}

var processFileObject = function(file, fileName) {
    var reader = new FileReader();
    
    reader.onloadend = function(e) {
        var gameDataConstruct = {};
        var logData = this.result;

        var gameID = gameIDRegex.exec(logData);
        var dateTime = fileNameRegex.exec(fileName);
        gameDataConstruct["date"] = dateTime[1]+"/"+dateTime[2]+"/"+dateTime[3]+" "+
            dateTime[4]+":"+dateTime[5]+":"+dateTime[6];
        if (!gameID) {
            gameID = [null, gameDataConstruct["date"], "unknown"];
        }
        var gameEnd = gameEndTimeRegex.exec(logData);
        var gameEndTime;
        if (gameEnd) {
            gameEndTime = parseFloat(gameEnd[1]);
            gameDataConstruct["result"] = gameEnd[2].toLowerCase();
        } else {
            gameDataConstruct["result"] = "unknown";
            var altEndGame = altGameEndRegex.exec(logData);
            if (altEndGame) {
                gameEndTime = parseFloat(altEndGame[1]);
            }
        }
        var gameStart = gameStartTimeRegex.exec(logData);
        if (gameStart) {
            var gameStartTime = parseFloat(gameStart[1]);
            gameDataConstruct["loading-time"] = gameStartTime;
            gameStats["loading"] = gameStats["loading"]+gameDataConstruct["loading-time"]
            if (gameEndTime) {
                gameDataConstruct["time"] = gameEndTime-gameStartTime;
            } else {
                gameDataConstruct["time"] = 0;   
            }
        } else {
            gameDataConstruct["time"] = 0;
            gameDataConstruct["loading-time"] = 0;
        }
        var gameType = gameTypeRegex.exec(logData);
        if (gameType) {
            gameDataConstruct["type"] = gameType[1].toLowerCase();
        } else {
            gameDataConstruct["type"] = "unknown";
        }
        if (logData.indexOf("Creating Hero...") > 0) {
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
                pushIfNotPresent(summonerDatabase[player[3]][player[1]], gameID[1]);
            }
            if (Object.keys(gameDataConstruct["blue"]).length+Object.keys(gameDataConstruct["purple"]).length <= 0) {
                var teamIndex = 0;
                while (player = altPlayerRegex.exec(logData)) {
                    teamIndex++;
                    if (teamIndex > 5) {
                        // Purple
                        gameDataConstruct["purple"][player[2]] = player[1];
                    } else {
                        // Blue
                        gameDataConstruct["blue"][player[2]] = player[1];
                    }
                    if (!summonerDatabase[player[2]]) summonerDatabase[player[2]] = {};
                    if (!summonerDatabase[player[2]][player[1]]) summonerDatabase[player[2]][player[1]] = [];
                    pushIfNotPresent(summonerDatabase[player[2]][player[1]], gameID[1]);
                }
            }
            gameDataConstruct["region"] = gameID[2].toLowerCase();
            if (gameDataConstruct["region"] == "oc") {
                gameDataConstruct["region"] = "oce";   
            }

            gameDatabase[gameID[1]] = gameDataConstruct;
        }
        processProgress++;
        logData = null;
        this.result = null;
    };

    reader.readAsText(file);
}

var processFile = function(fileEntry) {
    if (fileNameRegex.exec(fileEntry.name)) {
        fileEntry.file(function(file) {
            processFileObject(file, fileEntry.name);
        }, function(e){console.log(e)});
        return true;
    } else {
        return false;
    }
};

var progressInterval;

var displayProgress = function() {
    var percent = Math.ceil((processProgress/numOfFiles)*1000-0.5)/10;
    $("#progress-cover").width(percent.toString()+"%");
    $("#drop-sub").text("Progress: "+percent.toString()+"%" + " (" + numOfFiles.toString() + " files)");
    if (percent >= 100) {
        clearInterval(progressInterval);   
        if (Object.keys(gameDatabase).length <= 0) {
            processFailure("No usable logs available!")
            return;
        }
        getSummonerName();
        displayAllStats();
        $("#main, #title").hide();
        $("#drop-cover").removeClass("show")
        $("#stats").show();
    }
}

var levels = 0;
var busy = false;
var folderProcessStack = [];
var folderProcessInterval;

var processData;

var processFolders = function() {
    if (!busy) {
        if (folderProcessStack.length > 0) {
            var folderEntry = folderProcessStack.shift()
            
            var dirReader = folderEntry.createReader();
            var entries = [];

            var readEntries = function() {
                dirReader.readEntries (function(results) {
                    if (!results.length) {
                        processData(entries);
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

    }
}

processData = function(files) {
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
        
        if (!entry) {
            processFailure("You didn't drop a folder!");
            break;
        }
        
        if (entry.isFile && i == 0) {
            if (processFile(entry)) {
                processProgress = 0;
                numOfFiles = length;
                clearInterval(folderProcessInterval);
                folderProcessInterval = null;
                folderProcessStack = [];
                if (numOfFiles >= 1) {
                    correctDirectory = true;
                    console.log("Using log file location: "+entry.fullPath);
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
        files = null;
        processFailure("Could not find logs - Try again");
    }
}

var resetDatabase = function() {
    gameDatabase = {};
    summonerDatabase = {};
    summonerFrequencyDatabase = {};
    summonerName = null;
    gameStats = {
        "time": 0,
        "loading": 0
    };
    processProgress = 0;
    numOfFiles = 0;
}