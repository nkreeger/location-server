//==================================================================================================
//
// @file server.js
// @author Nick Kreeger <nick@strava.com
// @brief PubSub server for listening and broadcasting locations.
//
//==================================================================================================

var net = require("net");
var http = require("http");

//var HOST = "127.0.0.1";
var PORT = process.env.PORT || 5001;
var HTTP_PORT = process.env.PORT || 5002;  // Note: I don't think this will work on heroku...

//
// Method to generate and return a new GUID.
//
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

//
// Logging method
//
function log(message) {
    console.log("---------------------------");
    console.log(message);
    console.log("---------------------------");
}
function objDump(object) {
    var output = "";
    for (var property in object) {
        output += ", " + property;
    }
    return output;
}


var activeConnections = {};
var athleteLocations = {};

function postMessage(message, ignoreSocketGuid) {
    for (var key in activeConnections) {
        if (ignoreSocketGuid == 'undefined' || key != ignoreSocketGuid) {
            activeConnections[key].socket.write(message);
        }
    }
}

//
// Utility webserver
////
// XXX kreeger: this will not work on heroku. Need to use a DB for this to work properly.
//var httpServer = http.createServer(function (req, res) {
//    res.writeHead(200, {'Content-Type': 'text/plain'});
//
//    var output =
//        "Connected Athletes:\n" +
//        "---------------------------\n";
//    for (var athleteId in athleteLocations) {
//        var loc = athleteLocations[athleteId];
//        output += athleteId + ": " + loc.latitude + ", " + loc.longitude + "\n";
//    }
//
//    res.end(output);
//    //res.end("Hello World\n" + 
//    //        "req: " + objDump(req) + "\n" +
//    //        "res: " + objDump(res) + "\n");
//}).listen(HTTP_PORT, HOST);
//console.log("HTTP Server ready on : " + HOST + ":" + HTTP_PORT);

//
// Location TCP socket thingy
//
var server = net.createServer();
server.listen(PORT, function() {
    console.log(">>>>>>>>> Lisetning on port: " + PORT);
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
                // Set the athlete ID associated with the socket.
                socket.athleteId = message.athleteId;
    
    //          Handy for debugging:
    //            // Inform the new athlete about other connected athletes
    //            {
    //                var message = JSON.stringify({
    //                    request: "connected_clients",
    //                    clients: athleteLocations
    //                });
    //                socket.write(message);
    //            }
    //            // Inform other connected athletes that a new athlete has joined
    //            {
    //                var message = JSON.stringify({
    //                    request: "client_joined",
    //                    athleteId: message.athleteId
    //                });
    //                postMessage(message, socket.guid);
    //            }
            } else if (message.request == "location_report") {
                // Store the variables in app-session for now. Would be nice to keep one record
                // on disk - not sure if mongodb is great for that.
    
                athleteLocations[message.athleteId] = {
                    latitude: message.latitude,
                    longitude: message.longitude
                };
                
                // Inform other connected athletes of new athlete.
                var message = JSON.stringify({
                    request: "close_athletes",
                    athleteId: message.athleteId,
                    latitude: message.latitude,
                    longitude: message.longitude
                });
                postMessage(message, socket.guid);
    
                // Inform the current athlete about other connected athletes
                // NOTE: This is a hack that just appends all connected athletes.
                var closeAthletes = {};
                for (var athleteId in athleteLocations) {
                    if (athleteId != socket.athleteId) {
                        closeAthletes[athleteId] = athleteLocations[athleteId];
                    }
                }
                message = JSON.stringify({
                    request: "close_athletes",
                    clients: closeAthletes
                });
                socket.write(message);
                
            }
        });
    
        socket.on('close', function(data) {
            delete activeConnections[socket.guid];
            delete athleteLocations[socket.athleteId];
    
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


});
//console.log("Server listening on " + HOST + ":" + PORT);

