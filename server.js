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

//==================================================================================================
//
// Reported rides summary
//


//==================================================================================================
//
// Location TCP socket thingy
//
var server = net.createServer();
server.listen(PORT, HOST);
server.on('connection', function(socket) {
    console.log("CONNECTED: " + socket.remoteAddress +  ":" + socket.remotePort);

    socket.on('connect', function(data) {
        console.log(">>> CONNECTION ESTABLISHED");
    });

    socket.on('data', function(data) {
        console.log("DATA: " + socket.remoteAddress + ": " + data + ", type: " + typeof(data));
        socket.write("You said '" + data + "'");

        // Thankfully 'data' is already a JSON object... now just do something with it.

    });

    socket.on('close', function(data) {
        console.log("CLOSED: " + socket.remoteAddress + ":" + socket.remotePort);
    });
});

console.log("Server listening on " + HOST + ":" + PORT);
