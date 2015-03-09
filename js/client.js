var socket = io.connect('http://localhost:3000');
socket.on('connect', function(data){
    var nickname = prompt("What's your name?");
    socket.emit('join', nickname);
    // alert('There are already two players!');
});


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
  socket.on('messages', function(data){
    var messages = document.getElementById("message-list");
    var messageItem = document.createElement("li");
    var mes = document.createTextNode(data);
    messageItem.appendChild(mes);
    messages.appendChild(messageItem);
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
    console.log('enough');
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
  button.addEventListener('click', function(){
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
  socket.on('move', function(from, to, successfulMove, message){
      if(successfulMove){
        var piece = document.querySelector('.from').innerHTML;
        document.querySelector('.from').innerHTML = null;
        doClass('from', squares, removeClass);
        fromSet = false;
        document.querySelector('.to').innerHTML = piece;
        doClass('to', squares, removeClass);
        toSet = false;
      } else {
        //
        var messageItem = document.createElement("li");
        var textnode = document.createTextNode("Chessboard: " + message);
        messageItem.appendChild(textnode);
        messages.appendChild(messageItem);
        //
      }
  });
});
