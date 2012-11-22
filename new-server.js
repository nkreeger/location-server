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

io.sockets.on('connection', function(socket) {
    socket.emit('hello');

    socket.on('hello', function(data) {
        console.log(">>>> GOT HELLO: ", data);
    });
});


/*
63 var io = require('socket.io').listen(80);
264 
265 io.sockets.on('connection', function (socket) {
266   socket.broadcast.emit('user connected');
267   socket.broadcast.json.send({ a: 'message' });
268 });
*/

// Kinda old
//var locations = io.of('/locations');
//locations.on('connection', function(socket) {
//    socket.emit("hello", { message: "This is a test message" });
//
//    socket.on('hello', function(data) {
//        console.log(data);
//    });
//});
//
