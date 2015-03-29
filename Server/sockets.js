var chess = require('./chess');
var chessRooms = require('./rooms');
var redis = require('redis');
var redisCli = redis.createClient();
var chess = require('./chess');
var chessRooms = require('./rooms');

var rooms = {};
var clients = {};
var num = 1;

redisCli.smembers('names', function(err, names){
	names.forEach(function(name){
		redisCli.srem('names', name);
		console.log(name);
	});
	console.log('Nothing left');
});
module.exports.socketListen = function(io){ 
	io.on('connection', function(client) {
		console.log('Client connected ' + num);
		num++;
		//set names when player joins
		client.on('join', function(name){
		 	//add to clients object
			client.name = name;
			clients[name] = client;
		 	
			client.broadcast.emit('online', name);
			redisCli.sadd('names', name);
			redisCli.smembers('names', function(err, names){
				names.forEach(function(name){
					client.emit('online', name);
				});
			});
		});
		client.on('disconnect', function(){
			var name = client.name;
			console.log('Client disconnect ' + name);
			redisCli.srem('names', name);
			client.broadcast.emit('remove player', name);
		});
		client.on('request game', function(player2){
			var player1 = client.name;
			// rooms[name.toLowerCase() + 'VS' + opponent.toLowerCase()] = 'hi';
			// io.sockets.connected[clients.opponent].emit('request opponent', name);
			clients[player2].emit('game requested', player1);
		})
		client.on('start game', function(newGame, player1){
			var player2 = client.name;
			if(newGame){
				var roomName = player1 + ' vs ' + player2;
				//set the name of the game room being created for the opponents
				clients[player1].room = roomName;
				clients[player2].room = roomName;
				//create the room and instance of this game
				rooms[roomName] = new chessRooms.Room(player1, player2);
				//give the game engine the names for each player
				rooms[roomName].match.player1.name = player1;
				rooms[roomName].match.player2.name = player2;
				//player who submitted request can join the room
				client.join(rooms[roomName].name);
				//requested player joins room
				clients[player1].join(rooms[roomName].name);
				io.to(rooms[roomName].name).emit('initialise board');
			}
		})
		//exchange messages
		client.on('messages', function(message, toOpponentOnly){
			var clientName = client.name;
			if(toOpponentOnly){
				//what room is client in
				var roomName = clients[clientName].room;
				//get the match object for this room
				var match = rooms[roomName].match;
				var player1 = match.player1.name;
				var player2 = match.player2.name;
				clients[player1].emit('messages', clientName, message);
				clients[player2].emit('messages', clientName, message);
			} else {
				client.broadcast.emit('messages', clientName, message);
				client.emit('messages', clientName, message);
			}
			
		});
		//pick squares
		client.on('highlight', function(fromSet, toSet, id){
			var clientName = client.name;
			//what room is client in
			var roomName = clients[clientName].room;
			//get the match object for this room
			var match = rooms[roomName].match;
			var player1 = match.player1.name;
			var player2 = match.player2.name;
			var playersTurn = match.player1.go ? player1 : player2;
			if(playersTurn === clientName){
				clients[player1].emit('highlight', fromSet, toSet, id);
				clients[player2].emit('highlight', fromSet, toSet, id);
			} else {
				var message = "It is " + playersTurn + "'s turn, calm down and wait!";
				clients[player1].emit('move', null, null, false, message, null);
				clients[player2].emit('move', null, null, false, message, null);
			}
		});
		//make the move
		client.on('move', function(from, to) {
			var clientName = client.name;
			//what room is client in
			var roomName = clients[clientName].room;
			//get the match object for this room
			var match = rooms[roomName].match;
			var player1 = match.player1.name;
			var player2 = match.player2.name;
			var playersTurn = match.player1.go ? player1 : player2;
			if(playersTurn === clientName){
				//submit move to game engine to make the move and do necessary validation etc.
				match.turn(from, to);
				//has the move completed and what validation messages are there
				var message = match.message;
				var moveComplete = match.complete;
				clients[player1].emit('move', from, to, moveComplete, message, playersTurn);
				clients[player2].emit('move', from, to, moveComplete, message, playersTurn);
			} else {
				var message = "It is " + playersTurn + "'s turn, calm down and wait!";
				clients[player1].emit('move', null, null, false, message, null);
				clients[player2].emit('move', null, null, false, message, null);
			}	
		});
		
  		client.on('receive position', function (data, revert) {
     		lastPosition = data;
     		client.broadcast.emit('update position', data, revert); // send `data` to all other clients
  		});
  		client.on('highlight2', function (classHighlight, self, remove) {
  			console.log(self + ' and ' + remove);
     		client.broadcast.emit('highlight2', classHighlight, self, remove); // send `data` to all other clients
  		});
  		client.on('move piece', function(fromId, toId){
  			client.emit('move piece', fromId, toId);
  			client.broadcast.emit('move piece', fromId, toId);
  		})
	});
};