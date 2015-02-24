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

function Vector(x,y) {
      this.x = x;
      this.y = y;
};

Vector.prototype.change = function(move){
      return new Vector(this.x - move.x, this.y - move.y);
}

//Define properties and methods for the chessboard
function Board(width, height) {
      this.width = width;
      this.height = height;
      this.space = new Array(width * height);
}
Board.prototype.isInside = function(vector) {
      return vector.x > 0 && vector.x < this.width - 1 &&
            vector.y > 0 && vector.y < this.height - 1;
}
Board.prototype.get = function(vector) {
      return this.space[vector.x + this.width * vector.y];
}
Board.prototype.set = function(vector, value) {
      this.space[vector.x + this.width * vector.y] = value;
}
//

function elementFromChar(legend, chr) {
      if (chr == " "){
            return null;
      }
      var element = new legend[chr]();
      element.originChar = chr;
      return element;
}

function charFromElement(element) {
      if (element == null){
            return " ";
      } else {
            return element.originChar;
      }
}

function Match(layout, legend){
      var chessboard = new Board(layout[0].length, layout.length)
      this.chessboard = chessboard;
      this.legend = legend;
      this.player1 = new Player(true, new Vector(5,1));
      this.player2 = new Player(false, new Vector(5,8));
      this.player1.setup(1);
      this.player1.setup(2);
      this.player2.setup(7);
      this.player2.setup(8);
      this.playerTurn = this.player1;
      this.otherPlayer = this.player2;

      layout.forEach(function(line, y) {
            for (var x = 0; x < line.length; x++){
                  chessboard.set(new Vector(x,y),
                        elementFromChar(legend, line[x]));
            }
      })
}
Match.prototype.toString = function() {
      var output = "\n";
      for(var y = 0; y < this.chessboard.height; y++) {
            for(var x = 0; x < this.chessboard.width; x++){
                  var element = this.chessboard.get(new Vector(x,y));
                  output += charFromElement(element)
            }
            output += "\n";
      }
      return output;
}
Match.prototype.moveOutOfCheck = function(start,dest,startObj,destObj,self) {
      var stillInCheck = false;
      if(this.playerTurn.check){
            for ( var i = 0; i < this.otherPlayer.piecePositions.length; i++) {
                  var checkStart = this.otherPlayer.piecePositions[i];
                  var checkObj = this.chessboard.get(checkStart);
                  if(checkObj.move(checkStart, this.playerTurn.kingPosition, self)){
                        this.chessboard.set(start, startObj);
                        this.chessboard.set(dest, destObj);
                        this.playerTurn.changePosition(dest,start);
                        if(destObj != null){
                              this.otherPlayer.changePosition(null, dest);
                        }
                        stillInCheck = true;
                        return stillInCheck;
                  }
            }     
      }
      return stillInCheck;
}
Match.prototype.putOpponentInCheck = function(self) {
      for ( var i = 0; i < this.playerTurn.piecePositions.length; i++) {
            var checkStart = this.playerTurn.piecePositions[i];
            var checkObj = this.chessboard.get(checkStart);
            if(checkObj.move(checkStart,this.otherPlayer.kingPosition,self)){
                  this.otherPlayer.check = true;
                  console.log('CHECK');
            }
      }
}
Match.prototype.changePlayer = function() {
      this.playerTurn = this.player1.go ? this.player2 : this.player1;
      this.otherPlayer = this.player2.go ? this.player2 : this.player1;
      this.player1.go = !this.player1.go;
      this.player2.go = !this.player2.go;
}
Match.prototype.startMove = function(start,dest,startObj,destObj,self) {
      console.log('moving');
      this.chessboard.set(start, null);
      //is there an opposing player's piece there
      this.takeDestination(dest, destObj);
      this.playerTurn.changePosition(start, dest, false);
      //put piece in destination
      this.chessboard.set(dest, startObj);
      //is player in check - if so need to revert
      if(this.moveOutOfCheck(start,dest,startObj,destObj,self)) {
            console.log('You need to move out of CHECK');
            this.complete = false;
            return;
      }
      //have we put opposing king in check
      this.putOpponentInCheck(self);
      //Change player
      this.changePlayer();
      this.complete = true;
}
Match.prototype.turn = function(from, to) {
      var start = new Vector(from[0], from[1]);
      var dest = new Vector(to[0], to[1]);
      var startObj = this.chessboard.get(start);
      var destObj = this.chessboard.get(dest);
      var self = this;
      //is there a piece to move
      if(startObj != null) {
            //is it this player's piece
            if(this.playerTurn.playersPiece(start)) {
                  //is destination on the board
                  if(this.chessboard.isInside(dest)) {
                        //check that the move is valid for this type of piece
                        if(startObj.move(start, dest, self, destObj, this.player1.go)){
                              //finally if player's own piece is not in destination, player can move
                              if(!this.playerTurn.playersPiece(dest)){
                                    this.startMove(start,dest,startObj,destObj,self);
                                    return this.complete;
                              } else {
                                    this.complete = false;
                                    console.log("Your own piece is there!");
                              }
                        } else {
                              this.complete = false;
                              console.log("That's not a valid move for this piece");
                        }
                  } else {
                        this.complete = false;
                        console.log("That position is not on the board");
                  }
            } else {
                  this.complete = false;
                  console.log("It is not this players turn");
            }
      } else {
            this.complete = false;
            console.log("There is no piece in that position to move");
      }
};


Match.prototype.takeDestination = function(dest, destObj) {
      if(destObj != null){
            if (this.player1.go) {
                  this.player2.changePosition(dest, null, true);
            } else {
                  this.player1.changePosition(dest, null, true)
            }
            console.log(charFromElement(destObj) + " has been taken, hard luck!");
      }
}

//Pieces - contains constructors for each type of piece
function Edge(){

}
function Pawn(){
      this.firstGo = true;
}
Pawn.prototype.move = function(start, dest, self, destObj, player1) {
      var move = dest.change(start); //move is vector of the change
      var dir = player1 ? 1 : -1; //which way the player is going
      var pieceInWay = self.chessboard.get(new Vector((start.x),(start.y + dir)));
      //if it's a pawn's first move it can move two spaces in y direction
      if ( this.firstGo && (move.y === 2 * dir) && (move.x === 0) && !pieceInWay) {
            this.firstGo = false;
            return true
      }
      if ( ( move.y === dir) && ((move.x === 0 && destObj == null) || ((move.x === 1 || move.x === -1) && destObj != null))) {
            return true;
      } else {
            return false;
      }
}
function Piece() {

}
Piece.prototype.validMove = function(start,dest) {
      var move = dest.change(start);
      for (var i = 0; i < this.validMoves.length; i++) {
            if (move.x == this.validMoves[i][0] && move.y == this.validMoves[i][1]) {
                  return true;
            }
      }
      return false;      
}
Piece.prototype.squareMove = function(start,dest,self){
      var move = dest.change(start);
      var i;
      function square(set_i, end, x, y) {
            for (set_i; i < end; i++) {
                  var pieceInWay = self.chessboard.get(new Vector(x,y));
                  if (pieceInWay != null) {
                        return false;
                  }
            }
            return true;
      }
      if ((move.x != 0 && move.y == 0)) {
            if(square(i = start.x + 1, dest.x, i, start.y) &&
                  square(i = dest.x + 1, start.x, i, start.y)) {
                  return true;
            } else {
                  return false;
            }
      }
      if ((move.x == 0 && move.y != 0)) {
            if(square(i = start.y + 1, dest.y, start.x, i) &&
                  square(i = dest.y + 1, start.y, start.x, i)) {
                  return true;
            } else {
                  return false;
            }
      }
}
Piece.prototype.diagonalMove = function(start,dest,self) {
      var move = dest.change(start);
      var i, j;
      function diag(set_i, set_j, end) {
            for(set_i, set_j; i < end; i++, j++) {
                  var x = Math.sqrt(i * i);
                  var y = Math.sqrt(j * j); 
                  var pieceInWay = self.chessboard.get(new Vector(x,y));
                  if (pieceInWay != null) {
                        return false;
                  }
            }
            return true;
      }
      //top left - bottom right
      if (move.x / move.y == 1) {
            if(diag(i = start.x + 1, j = start.y + 1, dest.x) &&
            diag(i = dest.x + 1, j = dest.y + 1, start.x)) {
                  return true;
            } else {
                  return false;
            }
      }
      //top right - bottom left
      if (move.x / move.y == -1) {
            if(diag(i = start.x + 1, j = -(start.y - 1), dest.x) &&
            diag(i = -(start.x - 1), j = start.y + 1, -dest.x)) {
                  return true;
            } else {
                  return false;
            }
      }
}
function Knight(){
      //List of moves that a knight can make
      this.validMoves = [[1,2],[1,-2],[2,1],[2,-1],[-1,2],[-1,-2],[-2,1],[-2,-1]];
}
Knight.prototype = new Piece();
Knight.prototype.move = function(start,dest) {
      return this.validMove(start,dest);
}
function Castle(){

}
Castle.prototype = new Piece();
Castle.prototype.move = function(start, dest, self) {
      return this.squareMove(start, dest, self);
}
function Bishop() {

}
Bishop.prototype = new Piece();
Bishop.prototype.move = function(start, dest, self) {
      return this.diagonalMove(start, dest, self);
}
function King() {
      this.validMoves = [[1,1],[1,0],[1,-1],[0,1],[0,-1],[-1,1],[-1,0],[-1,-1]];
}
King.prototype = new Piece();
King.prototype.move = function(start, dest) {
      return this.validMove(start,dest);
}
function Queen() {

}
Queen.prototype = new Piece();
Queen.prototype.move = function(start,dest,self) {
      if(!this.squareMove(start,dest,self)){
            return this.diagonalMove(start,dest,self);
      } else {
            return true;
      }
}
//END - pieces section
function Player(go, king) {
      this.go = go;
      this.piecePositions = [];
      this.kingPosition = king;
      //list of positions that the king is in check from
      this.check = false;
}
Player.prototype.setup = function(yPosition){
      for (var i = 1; i <= 8; i++) {
            var newPosition = new Vector(i, yPosition);
            this.piecePositions.push(newPosition);
      }
}
Player.prototype.playersPiece = function(position) {
      for (var i = 0; i < this.piecePositions.length; i++) {
            if( position.x == this.piecePositions[i].x && position.y == this.piecePositions[i].y){
                  return true;
            }
      }
      return false;
}
Player.prototype.changePosition = function(start, dest, taken) {
      for (var i = 0; i < this.piecePositions.length; i++) {
            if( start == null || (start.x == this.piecePositions[i].x && start.y == this.piecePositions[i].y)){
                  if (taken || start != null) {
                        this.piecePositions.splice(i,1);
                  }
                  if (!taken) {
                        //add end position
                        this.piecePositions.push(new Vector(dest.x, dest.y));
                        return         
                  }
            }
      }
}

var match = new Match(board, {"-": Edge, "P": Pawn, "H": Knight, "C": Castle, "B": Bishop,
                              "Q": Queen, "K": King});
match.toString();