var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var sockets = require('./server/sockets').socketListen(io);

app.use(express.static(__dirname + '/client'));
app.get('/', function(req, res) {
  // res.render('/index.html');
  res.sendFile('/index.html');
});

server.listen(3000, function () {
  var host = server.address().address;
  var port = server.address().port;
  console.log('Server listening at http://%s:%s', host, port);
});