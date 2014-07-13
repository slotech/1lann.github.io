var peerJSKey = "esu07ebv3ni885mi";

var isHost;
var hostID;
var peerID;
var peerName;
var peer;
var hostConnection;

var timeoutTimeout;

var functionsForTypes = {};
var connectedPeers = {};
var nicknames = {};

if (/^#(.+)/.exec(window.location.hash)) {
    isHost = false;
    hostID = /^#(.+)/.exec(window.location.hash)[1];
} else {
    isHost = true;
}


var onMessageType = function(type, func) {
    functionsForTypes[type] = func;
};

var clearMessageType = function(type) {
    delete functionsForTypes[type];
};

var sendData = function(to, type, data) {
    if (connectedPeers[to]) {
        var targetPeer = connectedPeers[to];
        targetPeer.send({
            type: type,
            data: data
        });
    } else {
        console.log("No such target!");
        return false;
    }
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


var registerPeerConnection = function(conn, label) {
    console.log("Registered new peer: "+conn.peer);
    connectedPeers[conn.peer] = conn;
    
    conn.on("data", function(data) {
        if (data["type"] && data["data"]) {
            if (functionsForTypes[data["type"]]) {
                functionsForTypes[data["type"]](this.peer, data["data"]);
            } else {
                receivedUnhandledData(this.peer, data["type"], data["data"]);
            }
            receivedData(this.peer, data["type"], data["data"]);
        }
    });
    
    conn.on("close", function() {
        delete connectedPeers[this.peer];
        peerDisconnected(this.peer);
    });
    
    conn.on("error", function(err) {
        peerError(this.peer, err);
    });
    
    if (label) {
        nicknames[conn.peer] = label;
    }
        
    peerConnected(conn.peer);
}

var connectToAllPeers = function(peerList) {
    var nicknameBuffer = {};
    for (key in peerList) {
        if (peerList[key] == hostID) {
            nicknames[hostID] = key;
        } else {
            var connection = peer.connect(peerList[key]);
            nicknameBuffer[peerList[key]] = key;
            connection.on("open", function() {
               registerPeerConnection(this, nicknameBuffer[this.peer]);
            });

            connection.on("error", function(err) {
               peerError(this.peer, err); 
            });
        }
    }
}

var connect = function(name, callback) {
    var connected = false;
    
    peerName = name;
    peer = new Peer({key: peerJSKey});
    console.log("Peer object created!");
    peer.on("open", function(id) {
        console.log("Peer open and ready!");
        peerID = id;
        
        peer.on("connection", function(conn) {
            registerPeerConnection(conn, conn.label);
        });
        
        if (isHost) {
            console.log("Hosting...")
            hostID = peerID;
            window.location.hash = peerID;
            onMessageType("peer-list", function(from) {
                console.log("Peer listing request from "+from);
                var peerList = {};
                for (key in connectedPeers) {
                    if (key != from) {
                        peerList[nicknames[key]] = key;
                    }
                }
                peerList[peerName] = peerID;
                sendData(from, "peer-list-response", peerList) 
            });
            callback();
        } else {
            console.log("Connecting to host...",hostID);
            hostConnection = peer.connect(hostID, {label: peerName});
            hostConnection.on("open", function() {
                connected = true;
                console.log("Connected to host! Requesting peer list...")
                registerPeerConnection(hostConnection);
                onMessageType("peer-list-response", function(from, data) {
                    console.log("Receive peer-list")
                    if (from == hostID) {
                        clearMessageType("peer-list-response");
                        connectToAllPeers(data);
                    }
                });
                hostConnection.send({type:"peer-list",data:"request"});
                callback();
            });
            
            timeoutTimeout = setTimeout(function() {
                if (!connected) {
                    console.log("Could not connect to host! Recreating as host...")
                    isHost = true;
                    connect(name, callback);
                }
            }, 5000);
            
        }
        
    });
    
    peer.on("error", function(err) {
        if (err.type == "peer-unavailable") {
            clear(timeoutTimeout);
            console.log("Error detected! Could not connect to host! Recreating as host...")
            isHost = true;
            connect(name, callback);
        }
    });
}

var quick = function(name) {
    connect(name, function(){console.log("Connected!")});
}