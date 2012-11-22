//------------------------------------------------------------------------------
//
// @file new-server.js
// @auther Nick Kreeger <nick@strava.com>
//
//------------------------------------------------------------------------------

var fs = require('fs');

var app = require('http').createServer(function(req, res) {
    fs.readFile(__dirname + '/index.html', function(err, data) {
        if (err) {
            res.writeHead(500);
            return res.end("Error loading index.html");
        }
        res.writeHead(200);
        res.end(data);
    });
});
app.listen(process.env.PORT || 5001);

var io = require('socket.io').listen(app);

var locations = io.of('/locations');
locations.on('connection', function(socket) {
    socket.emit("hello", { message: "This is a test message" });

    socket.on('hello', function(data) {
        console.log(data);
    });
});
