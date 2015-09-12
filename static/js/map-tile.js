function mapTiles(options){

	var me = this;

	//subscriptions
	me.util = new utility();
	//me.masonry = new masonry({selector:'.tileZone-inner',itemSelector:'.box'});

	me.settings ={
		'slidesCount':6,
		'selectors':{

			'slide':'.box',
			'wrapper':'.tileZone',
			'container':'.tileZone-inner'
		},
	}

	//merge
	me.settings = $.extend(me.settings, options);

	//these settings should not be reset outside
	me.settings['elementsProvider'] = {
	
			'slides' : function(){//it must be regenerated everytime it is used
						return $(me.settings.selectors.slide, me.settings.selectors.container);
					},

			'wrapper':$(me.settings.selectors.wrapper),
			'container':$(me.settings.selectors.container),
	};

	me.settings['nav'] = {
		'lm':0,
		'rm':me.settings.slidesCount,
		'total':function(){
			return me.settings.elementsProvider.slides().length;
		},
		'adjustedCount':me.settings.slidesCount,
		'constants':{
			'margin':10,
			'padding':10,
			'gutter':50
		}
	};


	me.tiles = [];

	me.init = function(){

		var slides = me.settings.elementsProvider.slides();

		if(slides.length>0){

			//dummy data
			var count=0;
			$('.box-frame', slides).each(function(i,v){

				$(v).text(++count);
			});

			var count = me.settings.slideSelector;
			count = count < slides.length ? slide.length : count;
			me.adjustContainer(count);
			me.process(slides);
		}
	}

	me.adjustContainer = function(len){

		var constants = me.settings.nav.constants;

		//calculate dimensions of one
		var _f = constants.margin + constants.padding //margin and padding 
		var w = $('.' + me.settings.slideSelector).width() + _f;
		var total = (w * len) + constants.gutter;

		me.settings.elementsProvider.container.width(total);
	}

	me.process = function(slides){//slides must be jQuery augmented object
 
 		slides.data('shown','false');
		slides.hide();

		var isRequired = me.isNavRequired();

		slides.slice(0, me.settings.nav.adjustedCount).data('shown', isRequired).show();

		//add nav -- only if required
		if(isRequired)
			me.addNavigation();
	};

	me.isNavRequired = function(){

		var onewidth = $(me.settings.selectors.slide).width() + me.settings.nav.constants.gutter + 20;
		var availableWidth = $(window).width();
		var nav = me.settings.nav;
		nav.rm = nav.adjustedCount = parseInt(availableWidth/(onewidth));

		return (me.settings.slidesCount > me.settings.nav.adjustedCount);
	};

	me.navHandles ={};

	//nav click events
	$('body').on('click', me.settings.selectors.container + ' ' + 'img.tile-nav', function(e){

		var $this = $(this);
		var direction = $this.data('direction');
		switch(direction){
			case "left":
				me.leftClick(e);
				break;
			case "right":
				me.rightClick(e);
				break;
		}

	});

	me.leftClick = function(e){

		var slides = me.settings.elementsProvider.slides();
		if(me.settings.nav.lm==0)return;

		me.settings.nav.lm -=1;
		slides.eq(me.settings.nav.lm).show();

		me.settings.nav.rm -=1;
		slides.eq(me.settings.nav.rm).hide();

	};

	me.rightClick = function(e){

		if(me.settings.nav.rm == me.settings.nav.total()){//slider is at the end
			return;
		}
		
		var slides = me.settings.elementsProvider.slides();

		slides.eq(me.settings.nav.rm).show();
		me.settings.nav.rm +=1;

		slides.eq(me.settings.nav.lm).hide();
		me.settings.nav.lm +=1;
	};

	me.addNavigation = function(){

		//left
		 me.getNavButton({data:'left', 'position':'prepend'});
		
		//right
		me.getNavButton({data:'right', 'position':'append'});
	}

	me.getNavButton = function(options){

		var l = me.generate('nav');
		l.addClass(options.data);
		l.data('direction', options.data);
		me.settings.elementsProvider.container[options.position](l);
		me.navHandles[options.data] = l;
	};

	me.generate = function(type){

		switch(type){

			case 'image-frame':
				
				var box = $('<div class="box"></div>');
				box.append($('<div class="box-frame" ></div>'))

				var id = ['__', myMaps.util.randomString(7), '__'].join('');
				box.attr('id', id);

				return box;

			case 'nav':
				var nav = $('<img class="tile-nav"></img>');
				return nav;

		}		

	}
};