var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);


// var path = require('path');


app.use(express.static(__dirname));
app.get('/', function(req, res) {
  // res.render('/index.html');
  res.sendFile('/index.html');
});

io.on('connection', function(client) {
	console.log('Client connected');

	
	client.on('messages', function(data){
		console.log(data);
		var world = data;
		client.broadcast.emit('messages', world);
	})

	
});

server.listen(3000, function () {
  var host = server.address().address;
  var port = server.address().port;
  console.log('Server listening at http://%s:%s', host, port);
});