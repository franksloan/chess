document.addEventListener('DOMContentLoaded', function(){
	var button = document.querySelector("button");
	var squares = document.querySelectorAll("div .square");
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
				doClass('from', squares, removeClass);
				fromSet = false;
			} else {
				if(!fromSet) {
					if(this.className.search('to') == -1){
						this.className += ' from';
						fromSet = true;
					} else {
						doClass('to', squares, removeClass);
						toSet = false;
					}
				} else {
					if(this.className.search('to') >= 0) {
						doClass('to', squares, removeClass);
						toSet = false;
					} else {
						if(!toSet) {
							this.className += ' to';
							toSet = true;
						}
					}
					
				}
			}
		});
	}
	button.addEventListener('click', function(){
		if(fromSet && toSet){
			var fromX = parseInt(document.querySelector('.from').dataset.position[1]);
			var fromY = parseInt(document.querySelector('.from').dataset.position[3]);
			var toX = parseInt(document.querySelector('.to').dataset.position[1]);
			var toY = parseInt(document.querySelector('.to').dataset.position[3]);
			var from = [fromX, fromY];
			var to = [toX, toY];
			match.turn(from, to);
			if(match.complete){
				var piece = document.querySelector('.from').innerHTML;
				document.querySelector('.from').innerHTML = null;
				doClass('from', squares, removeClass);
				fromSet = false;
				document.querySelector('.to').innerHTML = piece;
				doClass('to', squares, removeClass);
				toSet = false;
			}
		} else {
			console.log('Need a start (blue) and end (green) destination')
		}	
	});
})