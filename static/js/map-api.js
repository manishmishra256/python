function googleMaps(options, _callback){

 	var self = this;

 	self.map;

 	self.settings = {

 		container:'',
 		center:{lat:-34.397, lng:150.644},
 		scrollwheel:false,
 		zoom:8,
 		autoStart :true
 	}

 	//merge
 	self.settings = $.extend(self.settings, options);

 	//load libraries
 	self.util = new utility();
 	self.notification = new notification({'id':'messageContainer'});
 	self.exception = new exceptionHandler();

 	//ensure defaults -- supposed to be called from within create
 	self.ensureDefaults = function(){

 		if(self.util.isObjectEmpty(self.settings.center))
 			self.settings.center = {lat:-34.397, lng:150.644};

 		if(self.util.isObjectEmpty(self.settings.zoom))
 			self.settings.zoom = 8;
 	};

 	self.create = function(){

 		self.ensureDefaults();

 		var maps = new google.maps.Map(document.getElementById(self.settings.container), {
 			center:self.settings.center,
 			scrollwheel:true,
 			zoom:8,
 			mapTypeId:google.maps.MapTypeId.ROADMAP
 		});
 		return maps;
 	};

 	self.init = function(_callback){

 		self.map = self.create();

 		//subscribe to services
 		self.gl = new geolocation(self, self.map, _callback);
 		self.tile = new mapTiles();
 	};

 	//auto-initialize
 	if(self.settings.autoStart==true)
 		self.init(_callback);
};
