var peerJSKey = "t953urlnwv7ycik9";

var isHost;
var hostID;
var peerID;
var peerName;
var peer;
var hostConnection;

var functionsForTypes = [];
var connectedPeers = [];

if (/^#(.{16})/.exec(window.location.hash) > 1) {
    isHost = false;
    hostID = /^#(.{16})/.exec(window.location.hash);
} else {
    isHost = true;
}


var onMessageType = function(type, func) {
    functionsForTypes[label] = func;
};

var clearMessageType = function(type) {
    delete functionsForTypes[type];
};

var sendData = function(to, type, data) {
    
}

// Override this
var peerDisconnected = function(peerName) {
    console.log("Peer disconnected: "+peerName);
}

var peerConnected = function(peerName) {
    console.log("Peer connected: "+peerName);
}

var peerError = function(peerName, error) {
    console.log("Peer error with "+peerName,error);
}

var receivedData = function(from, type, data) {
    console.log("Received data from "+from+" type "+type+" data",data);
}

var receivedUnhandledData = function(from, type, data) {
    console.log("Received unhandeled data from "+from+" type "+type+" data",data);
}
// Override end


var registerPeerConnection = function(conn) {
    connectedPeers[conn.label] = conn;
    
    conn.on("data", function(data) {
        if (data["type"] && data["data"]) {
            if (functionsForTypes[data["type"]]) {
                functionsForTypes[data["type"]](self.label, data["data"]);
            } else {
                receivedUnhandledData(self.label, data["type"], data["data"]);
            }
            receivedData(self.label, data["type"], data["data"]);
        }
    });
    
    conn.on("close", function() {
        delete connectedPeers[self.label];
        peerDisconnected(self.label);
    });
    
    conn.on("error", function(err) {
        peerError(self.label, err);
    });
        
    peerConnected(conn.label);
}

var connectToAllPeers = function(peerList) {
    for (key in peerList) {
        var connection = peer.connect(peerList[key], {label: peerName});
        connection.on("open", function() {
           registerPeerConnection(this); 
        });
    }
}

var connect = function(name, callback) {
    peerName = name;
    peer = new Peer({key: peerJSKey});
    peer.on("open", function(id) {
        peerID = id;
        
        peer.on("connection", function(conn) {
            registerPeerConnection(conn);
        });
        
        if (isHost) {
            hostID = peerID;
            window.location.hash = peerID;
            callback();
        } else {
            hostConnection = peer.connect(hostID, {label: name});
            hostConnection.on("open", function() {
                console.log("Connected to host! Requesting peer list...")
                registerPeerConnection(hostConnection);
                hostConnection.send({type:"peer-list",content:"request"});
                callback();
            });
        }
        
    });
}