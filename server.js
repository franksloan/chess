var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var chess = require('./chess');

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
var match = new chess.Match(board, {"-": chess.Edge, "P": chess.Pawn, "H": chess.Knight, "C": chess.Castle, 
								"B": chess.Bishop, "Q": chess.Queen, "K": chess.King});
console.log(match.toString());

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
		client.nickname = name;
		console.log(match.player1.name + ' and ' + match.player2.name);
	});
	//exchange messages
	client.on('messages', function(data){
		var nickname = client.nickname;
		console.log(data);
		var message = data;
		client.broadcast.emit('messages', nickname + ': ' + message);
		client.emit('messages', nickname + ': ' + message);
	})
	//pick squares
	client.on('highlight', function(fromSet, toSet, id){
		console.log(fromSet + ' or ' + toSet + ' at ' + id);
		client.broadcast.emit('highlight', fromSet, toSet, id);
		client.emit('highlight', fromSet, toSet, id);
	});
	//make the move
	client.on('move', function(from, to) {
		var playersTurn = match.player1.go ? match.player1.name : match.player2.name;
		if(playersTurn === client.nickname){
			match.turn(from, to);
			console.log('from: ' + from + ' and to: ' + to);
			client.broadcast.emit('move', from, to, match.complete, match.message);
			client.emit('move', from, to, match.complete, match.message);
			
		}		
	});
});

server.listen(3000, function () {
  var host = server.address().address;
  var port = server.address().port;
  console.log('Server listening at http://%s:%s', host, port);
});