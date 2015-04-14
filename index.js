var express = require('express');
var app = express();
var server = require('http').createServer(app);
// var server = app.listen(5000);
var io = require('socket.io')(server);
var sockets = require('./Server/sockets').socketListen(io);

app.set('port', (process.env.PORT || 5000));
app.use(express.static(__dirname + '/client'));
app.get('/', function(req, res) {
  // res.render('/index.html');
  res.sendFile('/index.html');
});

server.listen(app.get('port'), function () {
  var host = server.address().address;
  var port = server.address().port;
  console.log('Server listening at http://%s:%s', host, port);
});