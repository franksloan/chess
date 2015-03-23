var chess = require('./chess');
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

function Room(player1, player2){
	this.name = player1 + ' vs ' + player2;
	this.match = new chess.Match(board);
}

exports.Room = Room;