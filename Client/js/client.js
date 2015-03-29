$(document).ready(function(){
  var pieceIds = ['b1', 'b2'];
  var toSet = false;
  var socket = io.connect('http://localhost:3000');
  socket.on('connect', function(data){
      var nickname = prompt("What's your name?");
      socket.emit('join', nickname);
  });
  //add a player to on screen list
  socket.on('online', function(name){
      appendToList('', 'online-list', name);
      console.log(name);
      var user = document.getElementById(name);
      user.innerHTML = '<button type="button" class="btn btn-primary btn-sm">' + name + '</button>';
      user.addEventListener('click', function(){
        var player2 = user.id;
        //ask the player you click on for a game
        socket.emit('request game', player2);
      });
  });
  socket.on('update position', function (data, revert) {
      if(revert){
        $("#bh").css('top', 0);
        $("#bh").css('left', 0);
      } else {
        var x = data.x * window.innerWidth;
        var y = data.y * window.innerHeight;
        $("#bh").offset({top: y, left: x});
      }
  });
  for(i = 0; i < pieceIds.length; i++){
    console.log(pieceIds[i]);
    $("#" + pieceIds[i]).draggable({
      start: function(event, ui) {
        if(!toSet){
          var parent = $(this).parent();
          parent.addClass('from');
          var id = parent.attr('id');
          socket.emit('highlight2', 'from', id, false);
        }
      },
      drag: function(event, ui){
        if(!toSet){
          var coord = $(this).offset();
          var xPercent = coord.left/window.innerWidth;
          var yPercent = coord.top/window.innerHeight;
          socket.emit('receive position', { x: xPercent, y: yPercent });
        }
      },
      revert: function(valid){
        if(!valid) {
          //move piece back for both players if invalid
          socket.emit('receive position', null, true);
          console.log(this[0].id);
          var id = this[0].id;
          $("#" + id).css('top', 0);
          $("#" + id).css('left', 0);
          var parent = $(this).parent();
          parent.removeClass('from');
          var id = parent.attr('id');
          toSet = false;
          socket.emit('highlight2', 'from', id, true);
          $.each(pieceIds, function(id){
            $('#' + id).draggable("enable");    
          });
        }
      },
      zIndex: 200
    });
  }
  // $("#bh").draggable({
  //   start: function(event, ui) {
  //     var parent = $(this).parent();
  //     parent.addClass('from');
  //     var id = parent.attr('id');
  //     socket.emit('highlight2', 'from', id, false);
  //   },
  //   drag: function(event, ui){
  //     var coord = $(this).offset();
  //     var xPercent = coord.left/window.innerWidth;
  //     var yPercent = coord.top/window.innerHeight;
  //     socket.emit('receive position', { x: xPercent, y: yPercent });
  //   },
  //   revert: function(valid){
  //     if(!valid) {
  //       socket.emit('receive position', null, true);
  //       $("#bh").css('top', 0);
  //       $("#bh").css('left', 0);
  //       var parent = $(this).parent();
  //       parent.removeClass('from');
  //       var id = parent.attr('id');
  //       socket.emit('highlight2', 'from', id, true);
  //     }
  //   },
  //   zIndex: 200
  // });
  $("#x3y3").droppable({
    accept: "img",
    over: function(event, ui){
      $(this).addClass('to');
      socket.emit('highlight2', 'to', this.id, false);
    },
    out: function(event, ui){
      $(this).removeClass('to');
      socket.emit('highlight2', 'to', this.id, true)
    },
    drop: function(event, ui){
      socket.emit('move piece', '#x2y1', this.id);
      toSet = true;
      var dragObj = ui.draggable[0];
      $.each(pieceIds, function(n){
        console.log(dragObj.id);
        console.log(pieceIds[n]);
        var pieceId = pieceIds[n];
        if(pieceId !== dragObj.id) {
          $('#' + pieceId).draggable("disable");
        }
      });
    }
  });
  socket.on('move piece', function(fromId, toId){
    var pieceId = $(fromId + ' > img').attr('id');
    $('#' + pieceId).css('top', 0);
    $('#' + pieceId).css('left', 0);
    var pieceHtml = $(fromId).html();
    $(fromId).html('');
    $('#' + toId).html(pieceHtml);
  })
  socket.on('highlight2', function(classHighlight, id, remove) {
    if(!remove){
      $('#' + id).addClass(classHighlight);
    } else {
      $('#' + id).removeClass(classHighlight);
    }
  });
  // $(window).resize(function(){
  //   var x = piecePositions.bh.xPercent * window.innerWidth;
  //   var y = piecePositions.bh.yPercent * window.innerHeight;
  //   console.log('x: ' + x + ' y: ' + y);
  //   $("#bh").offset({top: y, left: x});
  // });
  //receive a request for a game
  socket.on('game requested', function(player1){
    var newGame = confirm("Do you want a game against " + player1 + "?");
    socket.emit('start game', newGame, player1);
  });
  socket.on('initialise board', function(){
    var initialScreen = document.getElementById('initial');
    initialScreen.style.display = 'none';
    var gameScreen = document.getElementById('chessboard');
    gameScreen.style.display = 'inline-block';
    document.getElementById('to-opponent-only').disabled = false;
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
  var chatInput = document.getElementById("chat-input");
  chatInput.addEventListener('keypress', function(e){
    if(e.keyCode === 13) {
      var message = chatInput.value;
      // var message = document.createTextNode(chatInput.value);
      // console.log(message);
      if(document.getElementById('to-opponent-only').checked) {
        socket.emit('messages', message, true);
      } else {
        socket.emit('messages', message, false);
      }
      
      chatInput.value = ''; 
    }
  });
  socket.on('messages', function(name, message){
    appendToList(name + ': ' + message, 'message-list');
  });
  document.getElementById('to-opponent-only').disabled = true;
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
    if(toSet){
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
        // var piece = document.querySelector('.from').innerHTML;
        // document.querySelector('.from').innerHTML = null;
        // doClass('from', squares, removeClass);
        // fromSet = false;
        // document.querySelector('.to').innerHTML = piece;
        // doClass('to', squares, removeClass);
        $('.from').removeClass('from');
        $('.to').removeClass('to');
        toSet = false;
        if(message !== '') {
          appendToList('Chessboard: ' + message + ' by ' + name, 'message-list');
        }
      } else {
        appendToList('Chessboard: ' + message, 'message-list');
      }
  });
});