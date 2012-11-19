//==================================================================================================
//
// @file server.js
// @author Nick Kreeger <nick@strava.com
// @brief PubSub server for listening and broadcasting locations.
//
//==================================================================================================

var net = require("net");

var HOST = "192.168.1.126";
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

function newGuid() {
    var S4 = function () {
        return Math.floor(
                Math.random() * 0x10000 /* 65536 */
                ).toString(16);
    };
    return (
            S4() + S4() + "-" +
            S4() + "-" +
            S4() + "-" +
            S4() + "-" +
            S4() + S4() + S4()
            );
}

function log(message) {
    console.log("---------------------------");
    console.log(message);
    console.log("---------------------------");
}

//
// Location TCP socket thingy
//

var activeConnections = {};
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
    log("Connection Started: " + socket.remoteAddress +  ":" + socket.remotePort);

    socket.on('connect', function() {
        socket.guid = newGuid();
        activeConnections[socket.guid] = {
            socket: socket,
            hasSaidHello: false,
            athleteId: -1
        };

        for (var key in activeConnections) {
            console.log("key: " + key);
        }

        socket.write(JSON.stringify({ request: "hello" }));

        log("Socket Connected [" + socket.guid + "] : (connections: " + server.connections + ")");
    });

    socket.on('data', function(data) {
        log("Socket Data [" + socket.guid + "] : " + data);

        var message = JSON.parse(data);
        if (message.request == "hello") {
            //connectedSockets.push({
            //    "socket" : socket,
            //    "athleteId" : message.athleteId
            //});

            socket.athleteId = message.athleteId;

            // hack for now - just report number of connected clients.
            var message = JSON.stringify({
                request: "client_joined",
                athleteId: message.athleteId
            });
            for (var key in activeConnections) {
                activeConnections[key].socket.write(message);
            }
        }
        else if (message.request == "report") {
            //new Location(message.report).save();
            //notifyConnectedSockets();
        }
    });

    socket.on('close', function(data) {
        delete activeConnections[socket.guid];

        log("Socket Closed [" + socket.guid + "] : (connections: " + server.connections + ")");

        // Report:
        var message = JSON.stringify({
            request: "client_left",
            athleteId: socket.athleteId
        });
        for (var key in activeConnections) {
            activeConnections[key].socket.write(message);
        }
    });
});

console.log("Server listening on " + HOST + ":" + PORT);
