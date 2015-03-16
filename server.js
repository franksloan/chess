var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var redis = require('redis');
var redisCli = redis.createClient();
var chess = require('./js/chess');

app.use(express.static(__dirname));
app.get('/', function(req, res) {
  // res.render('/index.html');
  res.sendFile('/index.html');
});

var board = ["----------",
            "-CHBQKBHC-",
            "-PPPPPPPP-",
            "-        -",
            "-        -",
            "-        -",
            "-        -",
            "-PPPPPPPP-",
            "-CHBQKBHC-",
            "----------"];

var match = new chess.Match(board);
// redisCli.smembers('names', function(err, names){
// 	names.forEach(function(name){
// 		redisCli.srem('names', name);
// 		console.log(name);
// 	});
// 	console.log('Nothing left');
// });
io.on('connection', function(client) {
	console.log('Client connected');
	//set names when player joins
	client.on('join', function(name, turn){
		if(match.player1.name === null) {
	    	match.player1.name = name;
	  	} else {
	    	if(match.player2.name === null) {
	      		match.player2.name = name;
	    	}
	  	}
		client.name = name;
		client.broadcast.emit('online', name);
		redisCli.sadd('names', name);
		redisCli.smembers('names', function(err, names){
			names.forEach(function(name){
				client.emit('online', name);
			});
		});
		// console.log(match.player1.name + ' and ' + match.player2.name);
	});
	client.on('disconnect', function(){
		var name = client.name;
		console.log('Client disconnect ' + name);
		redisCli.srem('names', name);
		client.broadcast.emit('remove player', name);
	});
	//exchange messages
	client.on('messages', function(data){
		var name = client.name;
		var message = data;
		client.broadcast.emit('messages', name, message);
		client.emit('messages', name, message);
	});
	//pick squares
	client.on('highlight', function(fromSet, toSet, id){
		console.log(fromSet + ' or ' + toSet + ' at ' + id);
		client.broadcast.emit('highlight', fromSet, toSet, id);
		client.emit('highlight', fromSet, toSet, id);
	});
	//make the move
	client.on('move', function(from, to) {
		var playersTurn = match.player1.go ? match.player1.name : match.player2.name;
		if(playersTurn === client.name){
			match.turn(from, to);
			console.log('from: ' + from + ' and to: ' + to);
			client.broadcast.emit('move', from, to, match.complete, match.message, playersTurn);
			client.emit('move', from, to, match.complete, match.message, playersTurn);
			
		}		
	});
});

server.listen(3000, function () {
  var host = server.address().address;
  var port = server.address().port;
  console.log('Server listening at http://%s:%s', host, port);
});