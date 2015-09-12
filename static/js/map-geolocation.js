//geo location service
function geolocation(parentContext, parentMap, _callback){

	var me = this;

	me.map = parentMap;
	me.searchBox = '';
	me.browserSupportFlag=false;
	me.options = {

		'locations':{
			'siberia':new google.maps.LatLng(60,105),
			'newyork': new google.maps.LatLng(40.69847032728747, -73.9514422416687)
		},
		'searchBox':undefined,
		'markers':[],
		'initialPosition':undefined,
		'currentPosition':undefined,
		'bounds':new google.maps.LatLngBounds()
	}

	me.init = function(_callback){

		if(!navigator.geolocation){//browser doesn't support geolocation
			me.browserSupportFlag = false;
			me.error();
			return; //must return
		}

		//if you reached so far, it means browser supports geolocation
		me.browserSupportFlag = true;

		navigator.geolocation.getCurrentPosition(me.currentPositionAcquired, me.couldNotAcquireCurrentPosition);
	};

	//raised when current position is successfully acquired
	me.currentPositionAcquired = function(position){

		me.options.currentPosition = new google.maps.LatLng(position.coords.latitude, position.coords.longitude)
		me.addSearchBox('txtLocationSearch');
		if(typeof _callback=='function')
			_callback();
	};

	//raised when current position could not be acquired
	me.couldNotAcquireCurrentPosition = function(e){
		me.error();
	};

	me.error = function(){

		var msg, strC;
		if(!me.browserSupportFlag){
			msg = "Your browser doesn't support geolocation. We've placed you in siberia";
			strC = "siberia";
		}else{
		
			msg ="Geolocation service failed!";
			strC = 'newyork';
		}
		
		//TODO:instead of this, raise notification
		alert(msg);
		me.initialPosition = me.settings.locations[strC];
		me.map.setCenter(me.initialPosition);
	};

	me.gotoByLoc = function(loc, zoom){

		if(!zoom)zoom = 9;
		
		if(!me.browserSupportFlag){
			me.error();
			return
		}

		me.map.panTo(loc);
		me.map.setZoom(zoom);
	};

	me.gotoMyLocation = function(zoom){

		me.gotoByLoc(me.options.currentPosition, zoom);
	}
	
	me.addSearchBox = function(id){

		var elem = document.getElementById(id);
		
		me.options.searchBox = new google.maps.places.SearchBox(elem);
		
		me.map.controls[google.maps.ControlPosition.TOP_LEFT].push(elem);

		//add evenlistner
		me.map.addListener('bounds_changed', function(){

			me.options.searchBox.setBounds(me.map.getBounds())
		});

		// For each place, get the icon, name and location.
		me.options.searchBox.addListener('places_changed', function(){

			var places = me.options.searchBox.getPlaces();
			if(places.length == 0)return;

			places.forEach(function(place){

				var icon = {
					        url: place.icon,
					        size: new google.maps.Size(71, 71),
					        origin: new google.maps.Point(0, 0),
					        anchor: new google.maps.Point(17, 34),
					        scaledSize: new google.maps.Size(25, 25)
					    };

		      // Create a marker for each place.
		     me.options.markers.push(new google.maps.Marker({
		        map: me.map,
		        icon: icon,
		        title: place.name,
		        position: place.geometry.location
		     }));

		    if (place.geometry.viewport) {
		        // Only geocodes have viewport.
		        me.options.bounds.union(place.geometry.viewport);
		      } else {
		        me.options.bounds.extend(place.geometry.location);
		      }
		});
		me.map.fitBounds(me.options.bounds);

		});
	};

	me.createMarker = function(place){

		var icon = {
			        url: place.icon,
			        size: new google.maps.Size(71, 71),
			        origin: new google.maps.Point(0, 0),
			        anchor: new google.maps.Point(17, 34),
			        scaledSize: new google.maps.Size(25, 25)
			    };

     // Create a marker for each place.
     me.markers.push(new google.maps.Marker({
        map: me.map,
        icon: icon,
        title: place.name,
        position: place.geometry.location
     }));
	};

	me.searchNearByMe = function(){

		var request = {location: me.options.currentPosition, radius:'500', types:['store']};
		
		var service = new google.maps.places.PlacesService(myMaps.map);

		service.nearbySearch(request, function(results, status){ 
			
			if(status == google.maps.places.PlacesServiceStatus.OK){ 
				
				for(var i=0;i<results.length; i++){ 
					me.createMarker(results[i]);
				} 
			} 
		})
	}

	me.init(_callback);
};