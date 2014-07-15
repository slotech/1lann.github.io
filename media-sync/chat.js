var colorPool = ["#ecc132", "#ed5548", "#1abc9c", "#ad4ede"];
var colorPoolIndex = 0;
var systemColor = "#555555";
var meColor = "#3498db";

var userColors = {};
var myUsername;
var lastUser;
var lastDiv;

var sanatize = function(text) {
    return text.replace(/&/g, "&amp;").replace(/>/g, "&gt;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
}

var getUserColor = function(user) {
    if (user == "System") {
        return systemColor;
    } else if (user == myUsername) {
        return meColor;
    }
    if (!userColors[user]) {
        userColors[user] = colorPool[colorPoolIndex%colorPool.length];
        colorPoolIndex++;
    }
    return userColors[user];
}

var isAtBottom = function() {
    var messageArea = $("#chat-area #message-area");
    if (messageArea.scrollTop() >= messageArea[0].scrollHeight-messageArea.height()-20) {
        return true;
    } else {
        return false;
    }
}

var displayMessage = function(message, user) {
    var messageArea = $("#chat-area #message-area");
    var isBottom = isAtBottom();
    
    if (user == "System") {
        var userColor = getUserColor(user);
        messageArea.append("<span class='username' style='color: " + userColor + ";'>" + message + "</span>")
        lastDiv = null;
        lastUser = null;
    } else if (lastUser == user) {
        lastDiv.append("<span>" + sanatize(message) + "</span><br>")
    } else {
        var userColor = getUserColor(user);
        messageArea.append("<span class='username' style='color: " + userColor + ";'>" + user + "</span>")
        lastDiv = $("<div class='message'></div>");
        lastUser = user;
        messageArea.append(lastDiv);
        lastDiv.css("borderColor", userColor);
        lastDiv.append("<span>" + sanatize(message) + "</span><br>")
    }
    
    if (isBottom) {
        messageArea.scrollTop(messageArea[0].scrollHeight);
    }
}

var startChat = function(username) {
    
    disconnectedFromNetwork = function() {
        displayMessage("Connection lost!", "System");
        $("#chat-area #input-box input").attr("disabled", true);
        $("#chat-area #input-box input").text("- Disconnected -")
    }
    
    reconnectedToNetwork = function() {
        displayMessage("Re-connected!", "System");
        $("#chat-area #input-box input").attr("disabled", false);
        $("#chat-area #input-box input").text("");
    }
    
    peerConnected = function(peerName) {
        var name = getUsername(peerName);
        displayMessage(name + " has joined the room!", "System");
    }
    
    peerDisconnected = function(peerName) {
        var name = getUsername(peerName);
        displayMessage(name + " has left the room!", "System");
    }
    
    onMessageType("chat-message", function(peerName, message) {
        if (typeof(message) == "string") {
            displayMessage(message, getUsername(peerName));
        }
    });
    
    myUsername = username;
    $("#chat-area #input-box input").on("keyup", function(e) {
        if (e.which == 13) {
            displayMessage($(this).val(), myUsername);
            broadcastData("chat-message", $(this).val());
            $(this).val("");
        }
    });
    
    displayMessage(username + " has joined the room!", "System");
}
