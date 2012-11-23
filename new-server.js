//------------------------------------------------------------------------------
//
// @file new-server.js
// @auther Nick Kreeger <nick@strava.com>
//
//------------------------------------------------------------------------------

var fs = require('fs');
//var express = require('express');
//
//var app = express();
//var http = require('http');
//var server = http.createServer(app);
//
//app.get('/', function(req, res) {
//    fs.readFile(__dirname + '/index.html', function(err, data) {
//        if (err) {
//            res.writeHead(500);
//            return res.end("Error loading index.html");
//        }
//        res.writeHead(200);
//        res.end(data);
//    });
//});
//
//server.listen(process.env.PORT || 5001, function() {
//    console.log("listening...");
//});
//
//var io = require('socket.io').listen(server);
//io.configure(function () { 
//    io.set("transports", ["xhr-polling"]); 
//    io.set("polling duration", 10); 
//});

var port=process.env.PORT || 3000;
var http=require('http');
var app=http.createServer(function(req,res){
    res.write("server listening to port:"+port);
    res.end();
}).listen(port);
socket=require("socket.io");
io=socket.listen(app);
io.configure(function () { 
  io.set("transports", ["xhr-polling"]); 
  io.set("polling duration", 10); 
});

io.sockets.on('connection', function(socket) {
    socket.emit('hello');

    socket.on('hello', function(data) {
        socket.athleteId = data.athleteId;

        socket.broadcast.emit('athlete connected', {
            athleteId: socket.athleteId
        });
    });

    socket.on('disconnect', function() {
        socket.broadcast.emit('athlete disconnected', {
            athleteId: socket.athleteId
        });
    });
});

