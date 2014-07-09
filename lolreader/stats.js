//var gameDatabase = {} // Will store game data
//var summonerDatabase = {} // Will be used to see who you most play with
//var frequencyDatabase = []
//var summonerName

var getHumanTime = function(seconds) {
    var numdays = Math.floor(seconds / 86400);
    var numhours = Math.floor((seconds % 86400) / 3600);
    var numminutes = Math.floor(((seconds % 86400) % 3600) / 60);
    var construct = "";
    
    if (numdays == 1) {
        construct = "1 day";
    } else if (numdays > 1) {
        construct = numdays + " days";
    }
    
    if (numhours == 1) {
        if (construct != "") {
            construct = construct + ", ";
        }
        construct = construct + "1 hour";
    } else if (numhours > 1) {
        if (construct != "") {
            construct = construct + ", ";
        }
        construct = construct + numhours + " hours";
    }
    
    if (construct != "") {
        construct = construct + ", and ";
    }
    if (numminutes == 1) {
        construct = construct + "1 minute";
    } else {
        construct = construct + numminutes + " minutes";
    }
    return construct;
}

var getPercentage = function(win, loss) {
    return Math.ceil((win/(win+loss))*100-0.5);
}

var generateChampionStats = function(champion) {
    
}

var generateSummonerStats = function(summoner) {
    
}

var drawGeneralStats = function() {
    $("#general-stats-left").html("");
    $("#general-stats-right").html("");
    var dataToDrawLeft = [];
    var dataToDrawRight = [];
    var rates = getRates(summonerName);
    // return [wins, loses, blueWins, blueLoses, purpleWins, purpleLoses];
    var timeSeconds = timeSpentPlaying(summonerName);
    var gameHours = getHumanTime(timeSeconds);
    var averageMinutes = getHumanTime(timeSeconds/(rates[0]+rates[1]));
    var loadingHours = getHumanTime(gameStats["loading"]);
    console.log("hours: ",gameHours)
    dataToDrawLeft.push(["Number of games: ", (rates[0] + rates[1]).toString()]);
    dataToDrawLeft.push(["Time spent playing: ", gameHours]);
    dataToDrawLeft.push(["Time wasted on loading: ", loadingHours]);
    dataToDrawLeft.push(["Win rate: ", getPercentage(rates[0],rates[1]).toString() + "%"]);
    dataToDrawLeft.push(["Average game time: ", averageMinutes]);
    dataToDrawLeft.push(["Percentage of games on blue: ", getPercentage(rates[2]+rates[3],rates[4]+rates[5]).toString() + "%"]);
    dataToDrawRight.push(["Games on blue side: ", (rates[2]+rates[3]).toString()]);
    dataToDrawRight.push(["Games on purple side: ", (rates[4]+rates[5]).toString()]);
    dataToDrawRight.push(["Blue win rate: ", getPercentage(rates[2],rates[3]).toString() + "%"]);
    dataToDrawRight.push(["Purple win rate: ", getPercentage(rates[4], rates[5]).toString() + "%"]);
    
    for (key in dataToDrawLeft) {
        $("#general-stats-left").append(
            '<span class="stat-style">'+dataToDrawLeft[key][0]+
            '</span><span class="stat-data-style">'+dataToDrawLeft[key][1]+'</span><br>');
    }
    for (key in dataToDrawRight) {
        $("#general-stats-right").append(
            '<span class="stat-style">'+dataToDrawRight[key][0]+
            '</span><span class="stat-data-style">'+dataToDrawRight[key][1]+'</span><br>');
    }
}

var drawName = function() {
    $("#title-div>#summoner-name").text(summonerName);
}

var expandChampion = function(champion) {
    
}

var drawChampionsList = function(searchTerm, expanded) {
    var resultDatabase = [];
    if (searchTerm) {
        var searchDatabase = championsPlayedWith(summonerName);
        for (key in searchDatabase) {
            if (searchDatabase[key][0].toLowerCase().indexOf(searchTerm.toLowerCase()) > 0) {
                resultDatabase.push([searchDatabase[key][0], searchDatabase[key][1]]);
            }
        }
    } else {
        resultDatabase = championsPlayedWith(summonerName);
    }
    
    for (key in resultDatabase) {
        var rates = getRates(summonerName, resultDatabase[key][0]);
        var winrate = getPercentage(rates[0],rates[1])
        var card = '<div class="info-card" cardID=' + resultDatabase[key][0] + '><div class="main-area"><img src="http://ddragon.leagueoflegends.com/cdn/4.10.7/img/champion/' + resultDatabase[key][0] + '.png" alt="'+ resultDatabase[key][0] + '"><div class="left-section"><span class="name">' + resultDatabase[key][0] + '</span><br><span class="games-played">' + resultDatabase[key][1] + ' games played</span></div><div class="win-rate"><span class="win-percent">' + winrate + '%</span><br><span class="win-rate-text">Winrate</span></div></div><div class="details-area"><div class="details-container" style="display:none;"></div></div><div class="expand-area"><span class="glyphicon glyphicon-chevron-down"></span></div></div>'
        $("#most-played-data").append(card);
    }
}

var drawPlayersList = function(searchTerm, expanded) {
    
}

var displayAllStats = function() {
    
}