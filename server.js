//==================================================================================================
//
// @file server.js
// @author Nick Kreeger <nick@strava.com
// @brief PubSub server for listening and broadcasting locations.
//
//==================================================================================================

var net = require("net");

var HOST = "192.168.2.1";  // HACK FOR NOW
//var HOST = "127.0.0.1";
var PORT = 5001;

//
// Location check-in database
//

var Location = null;
var mongoose = require('mongoose');
var db = mongoose.createConnection('localhost', 'test');
db.once('open', function() {
    var LocationSchema = new mongoose.Schema({
        athleteId: Number, 
        longitude: Number,
        latitude: Number,
        time: Number
    });
    Location = db.model('Location', LocationSchema);
});

//
// Misc. helper methods
//
function jsonReplacer(key, value) {
    if (key == "_id") return undefined;
    if (key == "__v") return undefined;
    return value;
}

function log(message) {
    console.log("---------------------------");
    console.log(message);
    console.log("---------------------------");
}

//
// Location TCP socket thingy
//

var connectedSockets = [];

function socketQuery(socket, query) {
    Location.find(query, function(err, locations) {
        log("sending athlete socket(" + socket.athleteId + ") for query: '" + JSON.stringify(query) + "'" + 
        "result: " + locations.length);

        var update = {
            request: "athletes_near",
            athletes: []
        };

        for (var key in locations) {
            var curLocation = locations[key];

            // TODO: Filter on location!
            // TODO: Filter on time!
            // TODO: Filter duplicates!

            update.athletes.push(curLocation.athleteId);
        }

        try {
            socket.write(JSON.stringify(update));
        } catch (e) { 
        }
    });
}


function notifyConnectedSockets() {
    for (var i = 0; i < connectedSockets.length; i++) {
        var curSocket = connectedSockets[i];
        var query = {
            $where : "this.athleteId != " + curSocket.athleteId
        };

        socketQuery(curSocket.socket, query);
    }
}

var server = net.createServer();
server.listen(PORT, HOST);
server.on('connection', function(socket) {
    console.log("CONNECTED: " + socket.remoteAddress +  ":" + socket.remotePort);

    socket.on('connect', function() {
        log("Connection: (connections: " + server.connections + ")");
    });

    socket.on('data', function(data) {
        console.log("DATA: " + socket.remoteAddress + ": " + data + ", type: " + typeof(data));

        var message = JSON.parse(data);
        if (message.request == "hello") {
            connectedSockets.push({
                "socket" : socket,
                "athleteId" : message.athleteId
            });
        }
        else if (message.request == "report") {
            new Location(message.report).save();
            notifyConnectedSockets();
        }
    });

    socket.on('close', function(data) {
        console.log("CLOSED: " + data);

        // Prob not great?
        //for (var key in connectedSockets) {
        //    var curSocket = connectedSockets[key];
        //    if (curSocket == socket) {
        //        console.log(">>>>>> FOUND SOCKET");
        //        // REMOVE ITEM!!
        //    }
        //}
    });
});

console.log("Server listening on " + HOST + ":" + PORT);
