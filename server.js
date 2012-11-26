//------------------------------------------------------------------------------
//
// @file new-server.js
// @auther Nick Kreeger <nick@strava.com>
//
//------------------------------------------------------------------------------

var fs = require('fs');
var express = require('express');

var app = express();
var http = require('http');
var server = http.createServer(app);

app.get('/', function(req, res) {
    fs.readFile(__dirname + '/index.html', function(err, data) {
        if (err) {
            res.writeHead(500);
            return res.end("Error loading index.html");
        }
        res.writeHead(200);
        res.end(data);
    });
});


// Jitsu configuration:
server.listen(8080, function() {
    console.log("server listening:", server);
});

var io = require('socket.io').listen(server);
io.sockets.on('connection', function(socket) {
    socket.emit('hello');

    socket.on('hello', function(data) {
        socket.athleteId = data.athleteId;

        socket.broadcast.emit('athlete connected', {
            athleteId: socket.athleteId
        });
    });

    socket.on('athlete location', function(data) {
        socket.broadcast.emit('athlete location', data);
    });

    socket.on('disconnect', function() {
        socket.broadcast.emit('athlete disconnected', {
            athleteId: socket.athleteId
        });
    });
});
