$(document).ready(function(){
  var pieceIds = [];
  var targets = [];
  var toSet = false;
  // var socket = io.connect('http://localhost:5000');
  var socket = io.connect();
  var chatInput = document.getElementById("chat-input");
  var submitMove = $('.submit-move');
  document.getElementById('to-opponent-only').disabled = true;
  function sortElements(fn) {
    $('#chessboard').children().each(function(){
      $(this).children().each(function(){
        if($(this).hasClass('square')){
          var squareId = $(this).attr('id');
          fn(squareId);
        }
      })
    })
  };
  //set droppable squares
  function setTargets(squareId){
    targets.push(squareId);
  }
  //disable squares where player's pieces are
  function disableDroppables(squareId){
    var imageObject = $('#' + squareId + ' > img');
    if(imageObject.length){
      var imageId = imageObject.attr('id');
      if(pieceIds.indexOf(imageId) > -1){
        $('#' + squareId).droppable("option", "disabled", true);
      }
    }
  };
  function enableDraggables(enable){
    $.each(pieceIds, function(n){
      var pieceId = pieceIds[n];
      $('#' + pieceId).draggable(enable);
    });
  };
  function appendToList(listText, list, id){
      // var list = document.getElementById(list);
      var list = $('#' + list);
      var listItem = document.createElement("li");
      listItem.setAttribute('id', id || '');
      var textnode = document.createTextNode(listText);
      listItem.appendChild(textnode);
      list.append(listItem);
  };
  function setDraggables(){
    for(i = 0; i < pieceIds.length; i++){
      var pieceId = pieceIds[i];
      $("#" + pieceId).draggable({
        start: function(event, ui) {
          var parent = $(this).parent();
          // parent.addClass('from');
          var id = parent.attr('id');
          socket.emit('highlight', 'from', id, false);
        },
        drag: function(event, ui){
          var coord = $(this).offset();
          var xPercent = coord.left/window.innerWidth;
          var yPercent = coord.top/window.innerHeight;
          var id = $(this)[0].id;
          socket.emit('receive position', { x: xPercent, y: yPercent }, false, id);
        },
        revert: function(valid){
          if(!valid) {
            var draggableId = this[0].id;
            //update both players pieces back to original square
            socket.emit('receive position', null, true, draggableId);
            var parent = $(this).parent();
            var id = parent.attr('id');
            toSet = false;
            //remove blue highlight from start position
            socket.emit('highlight', 'from', id, true);
            $.each(pieceIds, function(n){
              var pieceId = pieceIds[n];
              $('#' + pieceId).draggable("enable");    
            });
          }
        },
        zIndex: 200
      });
    }
  };
  function setDroppable(target){
    $("#" + target).droppable({
      accept: "img",
      over: function(event, ui){
        socket.emit('highlight', 'to', this.id, false);
      },
      out: function(event, ui){
        socket.emit('highlight', 'to', this.id, true)
      },
      drop: function(event, ui){
        //get piece id
        var draggableId = ui.draggable[0].id;
        //get id of square moved from
        var fromSquare = $("#" + draggableId).parent()[0].id;
        var destSquare = this.id;
        toSet = true;
        //disable ability to drag other pieces
        $.each(pieceIds, function(n){
          var pieceId = pieceIds[n];
          if(pieceId !== draggableId){
            $('#' + pieceId).draggable("disable");
          }
        });
        socket.emit('reposition on drop', fromSquare, destSquare);
      }
    });
  };
  function updateScroll(id){
    var element = document.getElementById(id);
    element.scrollTop = element.scrollHeight;
  }
  //message list in chat
  submitMove.click(function(){
    if(toSet){
      var from = $('.from').attr('id');
      var to = $('.to').attr('id');
      //submit move to server
      socket.emit('move', from, to);
    } else {
      appendToList('Chessboard: You need to move a piece first!', 'message-list');
    } 
  });
  
  chatInput.addEventListener('keypress', function(e){
    if(e.keyCode === 13) {
      //if enter is pressed submit message to server
      var message = chatInput.value;
      if(document.getElementById('to-opponent-only').checked) {
        socket.emit('messages', message, true);
      } else {
        socket.emit('messages', message, false);
      }
      chatInput.value = ''; 
    }
  });
  /////////////////////
  //Listeners Section//
  /////////////////////
  socket.on('connect', function(data){
      var nickname = prompt("What's your name?");
      //analytics
      _gs('event', 'Someone joined', {
        name: nickname
      });
      var analyticsId = Math.round(1000 * Math.random());
      var date = new Date();
      var day = date.getDate();
      var month = date.getMonth() + 1;
      var year = date.getFullYear();
      var time = date.getHours() + ':' + date.getMinutes();
      date = year + '-' + month + '-' + day;
      var timestamp = date + ' ' + time;
      _gs('identify', analyticsId, {
        name: nickname,
        email: analyticsId + '@dummyemail.com'
      });
      _gs('properties', analyticsId, {
        name: nickname,
        email: analyticsId + '@dummyemail.com',
        custom: {
          online: timestamp
        }
      });

      socket.emit('join', nickname);
  });
  ///////////
  //PLAYERS//
  ///////////
  //add a player to on screen list
  socket.on('online', function(name){
      appendToList('', 'online-list', name);
      var user = document.getElementById(name);
      user.innerHTML = '<button type="button" class="btn btn-primary btn-sm">' + name + '</button>';
      user.addEventListener('click', function(){
        var player2 = user.id;
        //ask the player you click on for a game
        socket.emit('request game', player2);
      });
  });
  socket.on('remove player', function(name){
      var listItem = document.getElementById(name);
      listItem.parentNode.removeChild(listItem); 
  });
  socket.on('messages', function(name, message){
    appendToList(name + ': ' + message, 'message-list');
    //analytics
    _gs('event', 'User chatting', {
        name: name
    });
    _gs('properties', analyticsId, {
        name: name,
        custom: {
          chat: message
        }
    });
    //
    updateScroll('message-cont');
  });
  //receive a request for a game
  socket.on('game requested', function(player1){
    var newGame = confirm("Do you want a game against " + player1 + "?");
    socket.emit('start game', newGame, player1);
  });
  ////////////
  //GAMEPLAY//
  ////////////
  socket.on('initialise board', function(playersPieces, clientsTurn, player1, player2){
    //put player buttons in respective colours
    var player1Button = $('#' + player1 + ' .btn');
    var player2Button = $('#' + player2 + ' .btn');
    player1Button.removeClass('btn-primary');
    player2Button.removeClass('btn-primary');
    player1Button.addClass('btn-black');
    player2Button.addClass('btn-white');
    var submitButton = $('.submit-move');
    submitMove.text('Submit Move ' + player1);
    //show chessboard to players
    var initialScreen = $('#initial');
    initialScreen.css('display', 'none');
    var gameScreen = $('#chessboard');
    gameScreen.css('display', 'inline-block');
    $('#to-opponent-only').prop('disabled', false);
    //fill array with only this player's piece
    $.each(playersPieces, function(i){
      var playersPiece = playersPieces[i];
      pieceIds.push(playersPiece);
    });
    //populate targets array with all squares
    sortElements(setTargets);
    //create a droppable target on each square
    for(i = 0; i < targets.length; i++){
      var target = targets[i];
      setDroppable(target);
    }
    //disable squares with client's pieces on
    sortElements(disableDroppables);
    setDraggables();
    //
    if(clientsTurn){
      enableDraggables("enable");
    } else {
      enableDraggables("disable");
    }
  });
  //move piece in real-time or back to where it came from
  socket.on('update position', function (data, revert, id) {
      if(revert){
        $("#" + id).css('top', 0);
        $("#" + id).css('left', 0);
      } else {
        var x = data.x * window.innerWidth;
        var y = data.y * window.innerHeight;
        $("#" + id).offset({top: y, left: x});
        $("#" + id).css('z-index', 200);
      }
  });
  //make sure piece for both players is centered in square
  socket.on('reposition on drop', function(fromId, toId){
    var posX = $('#' + toId).offset().left;
    var posY = $('#' + toId).offset().top;
    var pieceId = $("#" + fromId + ' > img').attr('id');
    $('#' + pieceId).css('z-index', 200);
    $('#' + pieceId).offset({top: posY, left: posX});
  });
  //highlight or unhighlight squares
  socket.on('highlight', function(classHighlight, id, remove) {
    if(!remove){
      $('#' + id).addClass(classHighlight);
    } else {
      $('#' + id).removeClass(classHighlight);
    }
  });
  //complete move if valid
  socket.on('move', function(fromId, toId, successfulMove, message, name, nextPlayer, clientsTurn){
    if(successfulMove){
      //flash submit button green if successful move
      $('.submit-move').removeClass('btn-default');
      $('.submit-move').addClass('btn-success');
      setTimeout(function() {
        $('.submit-move').removeClass('btn-success');
        $('.submit-move').addClass('btn-default');
        $('.submit-move').text('Submit Move ' + nextPlayer);
      }, 1000);
      var piece = $('.from');
      var pieceId = $("#" + fromId + ' > img').attr('id');
      $('#' + pieceId).css('top', 0);
      $('#' + pieceId).css('left', 0);
      $("#" + pieceId).css('z-index', 100);
      //move the piece's html
      $('.to').html(piece.html());
      $('.from').html('');
      //reset start and end point classes
      $('.from').removeClass('from');
      $('.to').removeClass('to');
      toSet = false;
      setDraggables();
      //enable the draggables if it is now this clients turn
      //otherwise disable them
      if(clientsTurn){
        enableDraggables("enable");
        //enable square if piece has just been taken
        $('#' + toId).droppable("option", "disabled", false);
      } else {
        enableDraggables("disable");
        $('#' + fromId).droppable("option", "disabled", false);
        $('#' + toId).droppable("option", "disabled", true);
      };
      
      if(message !== '') {
        appendToList('Chessboard: ' + message + ' by ' + name, 'message-list');
        updateScroll('message-cont');
      }
    } else {
      //flash submit button red if invalid move
      $('.submit-move').removeClass('btn-default');
      $('.submit-move').addClass('btn-danger');
      setTimeout(function() {
        $('.submit-move').removeClass('btn-danger');
        $('.submit-move').addClass('btn-default');
      }, 1000);
      appendToList('Chessboard: ' + message, 'message-list');
      updateScroll('message-cont');
    }
  });
  
});