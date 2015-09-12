//class to handle notification of different kinds
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

//class to handle utility
function utility(){

	var me = this;

	me.isObjectEmpty = function(val){

		if(val===undefined || val===null || val.length ===0)
			return true;

		return false;
	};

	me.randomString = function(len){

		if(me.isObjectEmpty(len))
			len = 5;
	    var text = "";
	    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

	    for( var i=0; i < len; i++ )
	        text += possible.charAt(Math.floor(Math.random() * possible.length));

	    return text;
	}

	me.ensureHash = function(id){

	 	return id.indexOf('#') > 0 ? id:'#'+id;
	};

	me.random = function(min, max){
		return Math.round(Math.random() * (max - min) + min);
	};

	function overlay(){

		var obj = this;

		obj.add = function(container){

			var overlay = obj.raw();
			overlay.show();
			$(container).append(overlay);
		};

		obj.remove = function(){

			var id = obj.activeQueue.pop();
			$('#'+id).remove();
		};

		obj.activeQueue = [];
		
		obj.raw = function(){

			var id = ['__', me.randomString(7), '__'].join('');
			var q = $("<div class='overlay'></div>");
			q.attr('id', id);
			obj.activeQueue.push(id);
			return q;
		};

	};
	me.overlay = new overlay();
	me.modalHandler = new modalHandler();
};

//class to handle exception
function exceptionHandler(){

	var me = this;

	me.error = function(msg){

		throw new Error(msg);
	};
};

//class to control modals
function modalHandler(){

	var me = this;

	me.open = function(id){

		$('#'+id).modal('show');
	};

	me.hide = function(id){
		$('#'+id).modal('hide');
	}
};

//class to control masonry
function masonry(options){

	var me = this;

	me.settings = {
		'selector':null,
		'itemSelector':'',
	}

	//merge
	me.settings = $.extend(me.settings, options);

	//user protected vars
	me.settings['elements']={

		'container': document.querySelector(me.settings.selector)
	};

	me._msnry ='';

	me.init = function(){

		me._msnry = new Masonry(me.settings.selector, {
						  itemSelector: me.settings.itemSelector
						});

		me._msnry.layout();
	};

	me.getItems = function(){

		return me._msnry('getItemElements');
	};

	me.append = function(elements){

		me.settings.elements.container.append(elements);
		me._msnry('appended',elements);
		me.layout();
	};

	me.prepend = function(elements){

		me.settings.elements.container.prepend(elements);
		me._msnry('prepended', elements);
		me.layout();
	};

	me.remove = function(elements){

		me._msnry('remove', elements);

	};

	me.layout = function(items, isStill){

		if(isStill==undefined || isStill ==null){
			isStill = true;
		}

		if(items!=undefined && items!=null && items.length>0){

			me._msnry.layoutItems(items, isStill)
		};
		me._msnry.layout();	
	};

	me.init();

};
