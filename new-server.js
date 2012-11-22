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
console.log("listening... : ", app);

var io = require('socket.io').listen(app);

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

