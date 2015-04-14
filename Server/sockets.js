// var redis = require('redis');
// var redisCli = redis.createClient();
var chess = require('./chess');
var chessRoom = require('./rooms');
var chessPieceIds = require('./chessPieceIds');
var rooms = {};
var clients = {};
var num = 1;
var online = [];

// redisCli.smembers('names', function(err, names){
// 	names.forEach(function(name){
// 		redisCli.srem('names', name);
// 		console.log(name);
// 	});
// 	console.log('Nothing left');
// });
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
			online.push(name);
			// redisCli.sadd('names', name);
			online.forEach(function(name){
					client.emit('online', name);
			});
			// redisCli.smembers('names', function(err, names){
			// 	names.forEach(function(name){
			// 		client.emit('online', name);
			// 	});
			// });
		});
		client.on('disconnect', function(){
			var name = client.name;
			console.log('Client disconnect ' + name);
			var remUser = online.indexOf(name);
			online.splice(remUser, 1);
			// redisCli.srem('names', name);
			client.broadcast.emit('remove player', name);
		});
		client.on('request game', function(player2){
			var player1 = client.name;
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
				rooms[roomName] = new chessRoom.Room(player1, player2);
				//give the game engine the names for each player
				rooms[roomName].match.player1.name = player1;
				rooms[roomName].match.player2.name = player2;
				//player who submitted request can join the room
				client.join(rooms[roomName].name);
				//requested player joins room
				clients[player1].join(rooms[roomName].name);
				var p1Pieces = chessPieceIds.player1;
				var p2Pieces = chessPieceIds.player2;
				function initialiseBoard(playersTurn, otherPlayer){
					clients[playersTurn].emit('initialise board', p1Pieces, true);
					clients[otherPlayer].emit('initialise board', p2Pieces, false);
				}
				toRoom(initialiseBoard);
			}
		})
		//exchange messages
		client.on('messages', function(message, toOpponentOnly){
			function messageOpponent(playersTurn, otherPlayer, clientName){
				clients[playersTurn].emit('messages', clientName, message);
				clients[otherPlayer].emit('messages', clientName, message);
			};
			//send messages to opponent only or everyone online
			if(toOpponentOnly){
				toRoom(messageOpponent);
			} else {
				var clientName = client.name;
				client.broadcast.emit('messages', clientName, message);
				client.emit('messages', clientName, message);
			}	
		});
		//make the move
		client.on('move', function(fromId, toId) {
			function move(playersTurn, otherPlayer, clientName, match){
				if(playersTurn === clientName){
					var fromX = parseInt(fromId[1]);
			      	var fromY = parseInt(fromId[3]);
			      	var toX = parseInt(toId[1]);
			      	var toY = parseInt(toId[3]);
			      	var from = [fromX, fromY];
			      	var to = [toX, toY];
					//submit move to game engine to make the move and do necessary validation etc.
					match.turn(from, to);
					//has the move completed and what validation messages are there
					var message = match.message;
					var moveComplete = match.complete;
					clients[playersTurn].emit('move', fromId, toId, moveComplete, message, playersTurn, false);
					clients[otherPlayer].emit('move', fromId, toId, moveComplete, message, playersTurn, true);
				} else {
					var message = "It is " + playersTurn + "'s turn, calm down and wait!";
					clients[playersTurn].emit('move', null, null, false, message, null);
					clients[otherPlayer].emit('move', null, null, false, message, null);
				}
			}
			toRoom(move);
		});
  		client.on('receive position', function (coordinates, revert, id) {
  			function movingPositions(playersTurn, otherPlayer, clientName){
  				if(playersTurn === clientName){
					if(revert){
						client.emit('update position', coordinates, revert, id);
					}
					clients[otherPlayer].emit('update position', coordinates, revert, id);
				}
  			}
			toRoom(movingPositions);
  		});
  		client.on('highlight', function (classHighlight, self, remove) {
  			function highlight(playersTurn, otherPlayer, clientName){
  				if(playersTurn === clientName){
					clients[playersTurn].emit('highlight', classHighlight, self, remove);
					clients[otherPlayer].emit('highlight', classHighlight, self, remove);
				} else {
					var message = "It is " + playersTurn + "'s turn, calm down and wait!";
					clients[playersTurn].emit('move', null, null, false, message, null);
					clients[otherPlayer].emit('move', null, null, false, message, null);
				}
  			}
  			toRoom(highlight);
			
  		});
  		client.on('reposition on drop', function(fromId, toId){
  			function reposition(playersTurn, otherPlayer){
  				clients[playersTurn].emit('reposition on drop', fromId, toId);
  				clients[otherPlayer].emit('reposition on drop', fromId, toId);
  			}
  			toRoom(reposition);
  		});
  		//collect details and then send something to the players
  		function toRoom(fnc){
	      var clientName = client.name;
	      //what room is client in
	      var roomName = clients[clientName].room;
	      //get the match object for this room
	      var match = rooms[roomName].match;
	      var player1 = match.player1.name;
	      var player2 = match.player2.name;
	      var playersTurn = match.player1.go ? player1 : player2;
	      var otherPlayer = match.player1.go ? player2 : player1;
	      fnc(playersTurn, otherPlayer, clientName, match);
		}
	});
};