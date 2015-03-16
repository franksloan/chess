var socket = io.connect('http://localhost:3000');
socket.on('connect', function(data){
    var nickname = prompt("What's your name?");
    socket.emit('join', nickname);
    // alert('There are already two players!');
});
//add a player on on screen list
socket.on('online', function(name){
    appendToList('', 'online-list', name);
    var user = document.getElementById(name);
    user.innerHTML = '<button class="online-button">' + name + '</button>';
    user.addEventListener('click', function(){
      var player2 = user.id;
      //ask the player you click on for a game
      socket.emit('request game', player2);
      console.log(user.id);
    });
});
//receive a request for a game
socket.on('game requested', function(player1){
  var newGame = confirm("Do you want a game against " + player1 + "?");
  socket.emit('start game', newGame, player1);
});
socket.on('works', function(stupid){
  console.log(stupid);
});
socket.on('remove player', function(name){
    var listItem = document.getElementById(name);
    listItem.parentNode.removeChild(listItem); 
});
function appendToList(listText, list, id){
    var list = document.getElementById(list);
    var listItem = document.createElement("li");
    listItem.setAttribute('id', id || '');
    var textnode = document.createTextNode(listText);
    listItem.appendChild(textnode);
    list.appendChild(listItem);
};

document.addEventListener('DOMContentLoaded', function(){
  var chatInput = document.getElementById("chat-input");
  chatInput.addEventListener('keypress', function(e){
    if(e.keyCode === 13) {
      var message = chatInput.value;
      // var message = document.createTextNode(chatInput.value);
      // console.log(message);
      socket.emit('messages', message);
      chatInput.value = ''; 
    }
  });
  socket.on('messages', function(name, message){
    appendToList(name + ': ' + message, 'message-list');
  });

  var button = document.querySelector("button");
  var squares = document.querySelectorAll("div .square");
  //message list in chat
  var messages = document.getElementById("message-list");
  var removeClass = function(array, i){
    array[i].className = array[i].className.substring(0,12);
  }
  var doClass = function(name, array, fnc) {
    for(var i = 0; i < array.length; i++) {
      if(array[i].className.search(name) >= 0) {
        fnc(array, i);
      }
    }
  }
  var fromSet = false;
  var toSet = false;
  for(var i = 0; i < squares.length; i++) {
    squares[i].addEventListener('click', function(){
      if(this.className.search('from') >= 0) {
        //fromSet to false
        socket.emit('highlight', false, null, this.id);
      } else {
        if(!fromSet) {
          if(this.className.search('to') == -1){
            //fromSet to true
            socket.emit('highlight', true, null, this.id);
          } else {
            //toSet to false
            socket.emit('highlight', null, false, this.id);
          }
        } else {
          if(this.className.search('to') >= 0) {
            //toSet to false
            socket.emit('highlight', null, false, this.id);
          } else {
            if(!toSet) {
              //toSet to true
              socket.emit('highlight', null, true, this.id);
            }
          }
          
        }
      }
    });
  }
  //receive square pressing
  socket.on('highlight', function(fromS, toS, id){
    console.log(fromSet + ' or ' + toSet + ' at ' + id);
    if (fromS !== null){
      fromSet = fromS;
      if(fromSet){
        document.getElementById(id).className += ' from';
      } else {
        doClass('from', squares, removeClass);
      }
    }
    if (toS !== null){
      toSet = toS;
      if(toSet){
        document.getElementById(id).className += ' to';
      } else {
        doClass('to', squares, removeClass);
      }
    }

  });
  var submitMove = document.querySelector('.submit-move');
  submitMove.addEventListener('click', function(){
    if(fromSet && toSet){
      var fromX = parseInt(document.querySelector('.from').id[1]);
      var fromY = parseInt(document.querySelector('.from').id[3]);
      var toX = parseInt(document.querySelector('.to').id[1]);
      var toY = parseInt(document.querySelector('.to').id[3]);
      var from = [fromX, fromY];
      var to = [toX, toY];
      socket.emit('move', from, to);
    } else {
      console.log('Need a start (blue) and end (green) destination')
    } 
  });
    
  socket.on('move', function(from, to, successfulMove, message, name){
      if(successfulMove){
        var piece = document.querySelector('.from').innerHTML;
        document.querySelector('.from').innerHTML = null;
        doClass('from', squares, removeClass);
        fromSet = false;
        document.querySelector('.to').innerHTML = piece;
        doClass('to', squares, removeClass);
        toSet = false;
        if(message !== '') {
          appendToList('Chessboard: ' + message + ' by ' + name, 'message-list');
        }
      } else {
        //name + ": " + message
        appendToList('Chessboard: ' + message, 'message-list');
        //
      }
  });
});
