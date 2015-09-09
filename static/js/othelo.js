function othelo(options){

	var self = this;
	
	//pre-requisite
	self.id = options.id;
	self.utility = new utility();
	self.exception = new exception();
	self.isBUSY = false;

	//check whether container exists or not
	var elem = document.getElementById(self.id);

	if(self.utility.isObjectEmpty(elem)){
		self.exception.error('Could not find container');
	}

	self.grid = {};
	self.move = 0;
	self.container = $(self.utility.ensureHash(self.id));
	self.dampContainer ="";

	self.createGrid = function(rows, cols){

		var tbl = $('<table></table>');

			for(var row = 0; row < rows; row++){

				//create row
				var tr = $('<tr></tr>');
				tr.attr('id', 'row'+row);

				for(var col = 0; col < cols; col++){

					//create col
					var td = $('<td class="col-sm-1 cell"><h5><small>'+ row + col +'</small></h5></td>');
					td.attr('id', 'col'+row.toString() + col.toString());
					tr.append(td);
				}
				tbl.append(tr);
			}
			return tbl;	
	};


	self.init = function(){

		self.container.html('');
		var grid = self.createGrid(10,10);
		grid.addClass('table table-bordered');
		self.container.append(grid);

		//add a damp
		var damp = $('<span><span>');
		var _rand = self.utility.random(100, 999);
		damp.attr('id',['__damp__', _rand].join(''));
		self.container.append(damp);

		self.dampContainer = damp;
	};

	self.standardMarks = function(){

		var stdArr = [45, 44, 54, 55];
		while(stdArr.length > 0){

			var item = stdArr.pop();
			var i = parseInt(item/10);
			var j = parseInt(item%10);
		    var id = "#col"+i+j;
		    self.mark($(id), true);	
		}
	};

	self.randomMarks = function(){

		var count=0;
		while(count++<8){

			var _rand = self.utility.random(0, 99);
			var i = parseInt(_rand/10);
			var j = parseInt(_rand%10);
		    var id = "#col"+i+j;
		    self.mark($(id), true);	
		}
	};

	self.cpu = new cpu(options);
	function cpu(options){

		var me = this;

		me.isEnabled = false;

		me.settings = {
			enabled:false,
		}

		//merge
		me.settings = $.extend(me.settings, options);

		me.isMarkable = function(row, col, id){

			var isGood = false;
			var val = self.grid[id];
			if(val === self.move || val === 1- self.move) return isGood;
			if($('#' + id).length == 0) return isGood;

			var resultSet = self.movesResultSet(row, col, id);
			for(var o in resultSet){

				var _s = resultSet[o];
				if(_s.isGood){
					isGood = true;
					break;
				}
			}

			return isGood;
		};
		//lookout for the locations where  user cells are present
		me.makeMove = function(lastCell){

			for(var o in self.grid){

				if(self.move!==self.grid[o]){//target those locations where oponent moves are present

					//scout all the corners
					var val = o.toString().replace('col','');
					var i = parseInt(val / 10);
					var j = parseInt(val % 10);
					var isGood = false;

					//scout left 
					var row = i;
					var col = j - 1;
					var id = 'col' + row + col;
					isGood = me.isMarkable(row, col, id);
					if(isGood){
						self.mark($('#' + id));
						break;
					}

					//scout right
					row = i;
					col = j + 1;
					id = 'col' + row + col;
					isGood = me.isMarkable(row, col, id);
					if(isGood){
						self.mark($('#' + id));
						break;
					}

					//scout up
					row = i - 1;
					col = j;
					id='col' + row + col;
					isGood = me.isMarkable(row, col, id);
					if(isGood){
						self.mark($('#' + id));
						break;
					}

					//scout down
					row == i + 1;
					col = j;
					id= 'col' + row + col;
					isGood = me.isMarkable(row, col, id);
					if(isGood){
						self.mark($('#' + id));
						break;
					}

					//scout north east
					row == i - 1;
					col = j + 1;
					id= 'col' + row + col;
					isGood = me.isMarkable(row, col, id);
					if(isGood){
						self.mark($('#' + id));
						break;
					}

					//scout north west
					row == i - 1;
					col = j - 1;
					id= 'col' + row + col;
					isGood = me.isMarkable(row, col, id);
					if(isGood){
						self.mark($('#' + id));
						break;
					}

					//scout south east
					row == i + 1;
					col = j + 1;
					id= 'col' + row + col;
					isGood = me.isMarkable(row, col, id);
					if(isGood){
						self.mark($('#' + id));
						break;
					}

					//scout south west
					row == i + 1;
					col = j - 1;
					id= 'col' + row + col;
					isGood = me.isMarkable(row, col, id);
					if(isGood){
						self.mark($('#' + id));
						break;
					}
				}	
			};
		};

	};

	//register cell clicks
	self.container.on('click','table tr td', function(e){

		console.log(self.isBUSY);
		if(self.isBUSY===true) return;

		self.isBUSY = true;

		var me = this;
		var isGood = self.mark($(me));
		if(isGood){

			var _ms = 7000;
			self.notification.info(self.messages.cpuThinking, _ms);
			self.delayExecute(_ms, self.cpu.makeMove);
		}
	});

	self.delayExecute = function(milliseconds, code){//code should be a function

		self.dampContainer.hide(milliseconds, function(){

			code();
			self.dampContainer.show();
			self.isBUSY = false;
		});
	}
	self.mark = function(cell, doNotValidate){

		var id = cell.attr('id');
		var stamp = id.replace('col','');
		var row = parseInt(stamp / 10);
		var col = parseInt(stamp % 10);

		//already claimed
		var cc  = self.grid[id];
		if(cc==0 || cc==1){
			return false;
		}

		var isGood = false;
		if(!doNotValidate){
			var resultSet = self.movesResultSet(row, col, id);
			
			$.each(resultSet, function(idx, elem){

				if(elem.isGood){

					if(!isGood) isGood = true;
					self.validity.paint(elem.cells);
					self.notification.flyers.add(cell, elem.cells.length);
					
					if(elem.cells.length > 9){
						self.notification.success(self.messages.success)
					}
				}
			});
		}

		if(isGood || doNotValidate){

			self.grid[id] = self.move;
			self.applyGraphics(cell, self.move);
			self.move = 1 - self.move;
			self.updatePlayerStats();
		}else{

			self.isBUSY = false;
			self.notification.warning(self.messages.invalidMove)
		}
		return isGood;
	};

	self.imageSwatch = function(move){

		return move==0?'cell-black':'cell-white';
	};

	self.colorSwatch = function(move){

		return move==0?'red':'green';
	};

	self.movesResultSet = function(row, col, id){

		var resultSet = {};
		//check horizontal forward
		resultSet['c1'] = self.validity.horizontalForward(row, col, id);

		//check horizontal backward
		resultSet['c2'] = self.validity.horizontalBackward(row, col, id);

		//check vertical forward
		resultSet['c3'] = self.validity.verticalForward(row, col, id);

		//check vertical backward
		resultSet['c4'] = self.validity.verticalBackward(row, col, id);

		//check north east
		resultSet['c5'] = self.validity.diagNorthEast(row, col, id);

		//check north west 
		resultSet['c6'] = self.validity.diagNorthWest(row, col, id);

		//check south east
		resultSet['c7'] = self.validity.diagSouthEast(row, col, id);

		//check south west
		resultSet['c8'] = self.validity.diagSouthWest(row, col, id);

		return resultSet;
	};

	self.updatePlayerStats = function(){

		var tbl = $('#playerStats table');

		//whose move?
		self.applyGraphics($('tr:eq(0) td:eq(1)', tbl), self.move)

		var p1 =0, p2 = 0;
		for(var o in self.grid){

			var val = self.grid[o];

			if(val == 0) p1++;
			
			else if(val == 1) p2++;
		}

		//player 1
		$('tr:eq(1) td:eq(0)', tbl).css('backgroundColor', self.colorSwatch(0));
		$('tr:eq(1) td:eq(1)', tbl).text(p1);

		//player 2
		$('tr:eq(2) td:eq(0)', tbl).css('backgroundColor', self.colorSwatch(1));
		$('tr:eq(2) td:eq(1)', tbl).text(p2);
	};

	self.applyGraphics = function(cell, move){

		cell.removeClass('cell-black cell-white').addClass(self.imageSwatch(move));
	};

	function validity(){

		var me = this;
		
		me.paint = function(cells){

			if(self.utility.isObjectEmpty(cells))return;

			$.each(cells, function(idx, elem){

				self.grid[elem.id] = self.move;
				self.applyGraphics(elem.cell, self.move);
			});
		};

		me.horizontalForward = function(i, j, id){
			
			var currentSymbol = self.move;
			var counter = 0;
			var doPaint = false;
			var trackedCells = [];
			while(i < 10 && j < 10){

				var newId = 'col' + i + ++j;
				
				var _sym = self.grid[newId];

				if(_sym!=currentSymbol && _sym!==undefined){

					trackedCells.push({'cell':$('#'+newId), 'id':newId});
				}
				else if(counter==0)
					break;

				if(_sym == currentSymbol && _sym!==undefined && counter != 0){  
					doPaint = true;
					break;
				} 
				counter++;
			};

			//if(doPaint && !self.utility.isObjectEmpty(trackedCells))
			//	me.paint(trackedCells);

			return {'isGood':doPaint, cells:trackedCells};
		};

		me.horizontalBackward = function(i, j, id){
			
			var currentSymbol = self.move;
			var counter = 0;
			var doPaint = false;
			var trackedCells = [];

			while(j > 0){

				var newId = 'col' + i + --j;
				
				var _sym = self.grid[newId];
				if(_sym!=currentSymbol && _sym!==undefined){

					trackedCells.push({'cell':$('#'+newId), 'id':newId});
				}
				else if(counter==0)
					break;

				if(_sym==currentSymbol && _sym!==undefined && counter!=0) {
					doPaint = true;
					break;
				}   
				counter++;
			};

			//if(doPaint && !self.utility.isObjectEmpty(trackedCells))
			//	me.paint(trackedCells);
			
			return {'isGood':doPaint, cells:trackedCells};
		};

		me.verticalForward = function(i, j, id){
			
			var currentSymbol = self.move;
			var counter = 0;
			var doPaint = false;
			var trackedCells = [];

			while(i < 10){

				var newId = 'col' + ++i + j;
				
				var _sym = self.grid[newId];
				if(_sym!=currentSymbol && _sym!==undefined){

					trackedCells.push({'cell':$('#'+newId), 'id':newId});
				}
				else if(counter==0)
					break;

				if(_sym==currentSymbol && _sym!==undefined && counter!=0){
					doPaint = true;
					break;
				}
				counter++;
			};

			//if(doPaint && !self.utility.isObjectEmpty(trackedCells))
			//	me.paint(trackedCells);
			
			return {'isGood':doPaint, cells:trackedCells};
		};

		me.verticalBackward = function(i, j, id){
			
			var currentSymbol = self.move;
			var counter = 0;
			var doPaint = false;
			var trackedCells = [];

			while(i > 0){

				var newId = 'col' + --i + j;
				
				var _sym = self.grid[newId];
				if(_sym!=currentSymbol && _sym!==undefined){

					trackedCells.push({'cell':$('#'+newId), 'id':newId});
				}
				else if(counter==0)
					break;

				if(_sym==currentSymbol && _sym!==undefined && counter!=0){ 
					doPaint = true;
					break;
				}
				counter++;
			};

			//if(doPaint && !self.utility.isObjectEmpty(trackedCells))
			//	me.paint(trackedCells);
			
			return {'isGood':doPaint, cells:trackedCells};
		};

		me.diagNorthEast = function(i, j, id){
			
			var currentSymbol = self.move;
			var counter = 0;
			var doPaint = false;
			var trackedCells = [];

			while(i > 0 && j<10){

				var newId = 'col' + --i + ++j;
				
				var _sym = self.grid[newId];
				if(_sym!=currentSymbol && _sym!==undefined){

					trackedCells.push({'cell':$('#'+newId), 'id':newId});
				}
				else if(counter==0)
					break;

				if(_sym==currentSymbol  && _sym!==undefined && counter!=0){
					doPaint = true;
					break;
				}
				counter++;
			};

			//if(doPaint && !self.utility.isObjectEmpty(trackedCells))
			//	me.paint(trackedCells);
			
			return {'isGood':doPaint, cells:trackedCells};
		};

		me.diagNorthWest = function(i, j, id){
			
			var currentSymbol = self.move;
			var counter = 0;
			var doPaint = false;
			var trackedCells = [];

			while(i > 0 && j > 0){

				var newId = 'col' + --i + --j;
				
				var _sym = self.grid[newId];
				if(_sym!=currentSymbol && _sym!==undefined){

					trackedCells.push({'cell':$('#'+newId), 'id':newId});
				}
				else if(counter==0)
					break;

				if(_sym==currentSymbol && _sym!==undefined && counter!=0){
					doPaint = true;
					break;
				}
				counter++;
			};
			
			//if(doPaint && !self.utility.isObjectEmpty(trackedCells))
			//	me.paint(trackedCells);
			
			return {'isGood':doPaint, cells:trackedCells};
		};

		me.diagSouthEast = function(i, j, id){
			
			var currentSymbol = self.move;
			var counter = 0;
			var doPaint = false;
			var trackedCells = [];

			while(i < 10 && j<10){

				var newId = 'col' + ++i + ++j;
				
				var _sym = self.grid[newId];
				if(_sym!=currentSymbol && _sym!==undefined){

					trackedCells.push({'cell':$('#'+newId), 'id':newId});
				}
				else if(counter==0)
					break;

				if(_sym==currentSymbol && _sym!==undefined && counter!=0){
					doPaint = true;
					break;
				}
				counter++;

			};
			
			//if(doPaint && !self.utility.isObjectEmpty(trackedCells))
			//	me.paint(trackedCells);
			
			return {'isGood':doPaint, cells:trackedCells};
		};

		me.diagSouthWest = function(i, j, id){
				
			var currentSymbol = self.move;
			var counter = 0;
			var doPaint = false;
			var trackedCells = [];

			while(i < 10 && j > 0){

				var newId = 'col' + ++i + --j;
				
				var _sym = self.grid[newId];
				if(_sym!=currentSymbol && _sym!==undefined){

					trackedCells.push({'cell':$('#'+newId), 'id':newId});
				}
				else if(counter==0)
					break;

				if(_sym==currentSymbol && _sym!==undefined && counter!=0){
					doPaint = true;
					break;
				}

				counter++;
			};
			
			//if(doPaint && !self.utility.isObjectEmpty(trackedCells))
			//	me.paint(trackedCells);
			
			return {'isGood':doPaint, cells:trackedCells};
		};	    	  			
	};

	self.validity = new validity();
	self.notification = new notification({'id':options.notificationContainer})
	self.messages = new messages();
};

function utility(){

	var me = this;

	me.isObjectEmpty = function(val){

		if(val===undefined || val===null || val.length ===0)
			return true;

		return false;
	};

	me.ensureHash = function(id){

	 	return id.indexOf('#') > 0 ? id:'#'+id;
	};

	me.random = function(min, max){
		return Math.round(Math.random() * (max - min) + min);
	};

	function delayRoutines(){

		var that = this;

		

	};
};

function exception(){

	this.error = function(msg){

		throw new Error(msg);
	};
};

function notification(options){

	var me = this;

	function flyers(){

		var that = this;

		that.raw = function(cell, score){

			var offset = cell.offset();

			var margin = cell.width()/2;
			var html  = $('<span></span>');
			html.text(score);
			html.css({top:offset.top, left:offset.left + margin, position:'absolute'});
			html.addClass('score-flyer');
			return html;
		};

		that.add = function(cell, score){

			var html = that.raw(cell, score);

			$('body').append(html);

			html.animate({top:'0px'},1000, function(){
				html.remove();
			});
		};
	}

	me.settings ={

		closeAfter : 4000
	};

	me.utility = new utility();

	//merge
	me.settings = $.extend(me.settings, me.options);

	me.container = $('#' + options.id);

	me.flyers = new flyers();

	me.raw = function(msg, type, cssClass){

		var div = $('<div></div>');
		var closeBtn = $('<button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button>');

		var msgContainer = $('<span>' + msg +'</span>');

		div.append(closeBtn);
		div.append(msgContainer);
		div.addClass(cssClass + ' alert-dismissible');
		return div;
	}

	me.error = function(msg, _closeAfter){

		if(!_closeAfter)
			_closeAfter = me.settings.closeAfter;

		me.generate(msg, 'Error', 'alert alert-danger', _closeAfter);
	};

	me.success = function(msg, _closeAfter){

		if(!_closeAfter)
			_closeAfter = me.settings.closeAfter;

		me.generate(msg, 'Success', 'alert alert-success', _closeAfter);
	};

	me.warning = function(msg, _closeAfter){

		if(!_closeAfter)
			_closeAfter = me.settings.closeAfter;

		me.generate(msg, 'Warning', 'alert alert-warning', _closeAfter);
	};

	me.info = function(msg, _closeAfter){

		if(!_closeAfter)
			_closeAfter = me.settings.closeAfter;

		me.generate(msg, 'Info', 'alert alert-info', _closeAfter);
	};

	me.activeQueue = [];

	me.generate = function(msg, type, cssClass, _closeAfter){

		var html = me.raw(msg, type, cssClass, _closeAfter);

		var uniqueId = '___notification___' + me.utility.random(10,999);

		html.attr('id', uniqueId);

		me.container.append(html);

		//me.activeQueue.push(uniqueId);

		setTimeout(function(){

			$('#' + uniqueId).fadeOut('slow');

		}, _closeAfter);
	};
};

function messages(){

	var me = this;

	me.invalidMove = '<strong>Warning!</strong> You need to be more wise than that! Click a cell which might yield atleast a score of plus one!';

	me.success = '<strong>Yuhuuu!</strong> You nicked a jackpot there! Great move.';

	me.gameOver = '<strong>K.O.! No more valid moves left. </strong>';

	me.cpuThinking = 'Computer is thinking..';
};

