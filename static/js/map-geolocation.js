//geo location service
function geolocation(parentContext, parentMap, _callback){

	var me = this;

	me.map = parentMap;
	me.searchBox = '';
	me.browserSupportFlag=false;
	me.tile = new mapTiles();
	me.markers = [];
	me.options = {

		'locations':{
			'siberia':new google.maps.LatLng(60,105),
			'newyork': new google.maps.LatLng(40.69847032728747, -73.9514422416687)
		},
		'searchBox':undefined,
		'markers':[],
		'initialPosition':undefined,
		'currentPosition':undefined,
		'tempCurrentPosition':undefined,
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

	me.setCurrentPosition = function(){

		navigator.geolocation.getCurrentPosition(function(position){
			me.options.tempCurrentPosition  = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
		}, function(e){})
	};

	me.showSetLocation = function(txt){

		if(me.options.tempCurrentPosition == undefined)
			$('#currentLoc').hide();
		else{
			$('#currentLoc').show();
			$('.currentLoc-detail').text(txt);
		}
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

	me.gotoByGeoCode = function(g,zoom){

		if(!zoom)zoom = 9;
		me.map.panTo(g);
		me.map.setZoom(zoom);
		me.options.currentPosition = g;
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

	me.toRadian = function(x){

		  return x * Math.PI / 180;
	};
	
	me.makeSureLatLngObj = function(g){

		if(g instanceof google.maps.LatLng)
			return g;

		return new google.maps.LatLng(parseFloat(g.G), parseFloat(g.K));
	};

	me.distanceBetween = function(p1, p2){

		//TODO:covered at grab
		//p1 = me.makeSureLatLngObj(p1);
		//p2 = me.makeSureLatLngObj(p2);

		me.options.tempCurrentPosition instanceof google.maps.LatLng

		  var R = 6378137; // Earth’s mean radius in meter
		  var dLat = me.toRadian(p2.lat() - p1.lat());
		  var dLong = me.toRadian(p2.lng() - p1.lng());
		  var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
		    Math.cos(me.toRadian(p1.lat())) * Math.cos(me.toRadian(p2.lat())) *
		    Math.sin(dLong / 2) * Math.sin(dLong / 2);
		  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
		  var d = R * c;
		  return d; // returns the distance in meter
	};

	me.sanitizeDistance = function(val){

		var km = val/ 1000;

		//paint ui 
		if(km>100){

			myMaps.util.modalHandler.error('Warning', 'This location is far too away!');
			$('.jumbotron')[km>100?'addClass':'removeClass']('faraway');
		}


		if(km > 1)
			return (Math.round(km * 100) / 100) + 'km';
		else 
			return  (Math.round(val * 100) / 100) + 'm';
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

		me.gotoByGeoCode(places[0].geometry.location);
		me.searchNearByMe();

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

	me.lastSearchedResult = {};

	me.searchNearLatLng = function(g){


		//TODO: test code - remove it till return (include)
		//me.dataSource.invokeDummy();
		//return;//below code hits the limited google api, hence not used during dev

		var request = {location: g, radius:'500', types:me.dataSource.getGoogleQualifiedTypes()};
		
		var service = new google.maps.places.PlacesService(myMaps.map);

		me.markers=[];
		service.nearbySearch(request, function(results, status){ 
			
			me.tile.destroy();
			if(status == google.maps.places.PlacesServiceStatus.OK && results.length > 0){ 
			
				me.dataSource.createGoogleDSBasedMarkup(results);
			} 
			else{
				myMaps.util.modalHandler.error('Error', 'No places could be found near given location');
			}
		})
	};

	me.searchNearByMe = function(){
		me.searchNearLatLng(me.options.currentPosition);
	}

	function dataSource(){

		var obj = this;
		
		obj.supportedTypes = {
			'pet_store':{ 'friendlyname':'Pet Store'},
			'zoo':{'friendlyname':'Zoo'},
			'veterinary_care':{'friendlyname':'Veterinary Care'},
			'amusement_park':{'friendlyname':'Amusement Park'}
		};

		obj.getGoogleQualifiedTypes = function(){

			var arr=[];
			for(var o in obj.supportedTypes)arr.push(o);
			return arr;
		};

		obj.createGoogleDSBasedMarkup = function(results){

			me.lastSearchedResult = {};

			for(var i=0;i<results.length; i++){ 

				var res =results[i];

				res.geometry.location = me.makeSureLatLngObj(res.geometry.location);

				me.createMarker(res);
				
				var frame = me.tile.generate('image-frame');
				
				var content = $('.box-frame', frame);
				content.append($('<div>'+res.name +'</div>'));
				var img = $('<img></img')
				img.attr('src', res.icon);
				content.append(img);

				var id = frame.attr('id');
				me.lastSearchedResult[id] = {'id':id, r:res};

				me.tile.settings.elementsProvider.container.append(frame);

			}; 

			me.tile.init();
		};

		obj.getActiveData = function(){

			if(obj.activeWindow==undefined) return undefined;

			var key = obj.activeWindow.attr('id');
			if(key==undefined || key==null) return undefined;

			var d = me.lastSearchedResult[key];
			if(d!=undefined && d.r!=undefined)
				return d.r;
		};

		obj.invokeDummy = function(){

			me.tile.destroy();
			var results = obj.dummyGoogleData();
			obj.createGoogleDSBasedMarkup(results);
		}

		obj.dummyGoogleData = function(){

			myMaps.util.modalHandler.error('Please Note', 'Dummy Data Enabled');

			var d = {"__UlxY0GE__":{"id":"__UlxY0GE__","r":{"geometry":{"location":{"G":40.710592,"K":-74.01045899999997}},"icon":"https://maps.gstatic.com/mapfiles/place_api/icons/shopping-71.png","id":"795cdc8cb7d1ec3488da4d5e9dfa2bccd674e9c5","name":"J&R","opening_hours":{"open_now":true,"weekday_text":[]},"photos":[{"height":1920,"html_attributions":["<a href=\"https://maps.google.com/maps/contrib/116547562565388608173\">J&amp;R</a>"],"width":1280}],"place_id":"ChIJ91gmgBhawokRpGUCBTwHmRw","rating":4.2,"reference":"CmRWAAAAq7719IqSjVTt7V-MJdkAEGOspW2NpXETqzvPsYGwCSvBIGXvAi9wAXnsVNiGO6Trj3lVVA-G4H1jgM7ndmU0gxoNGTey5Ja4grS_9wAc7ZEFzcZmyRddocJONTzn5k8EEhD9joUfqFwIZsGQvrusIOQIGhRERVeNSZ_nb8vwGozYXqgdtttviA","scope":"GOOGLE","types":["home_goods_store","electronics_store","store","point_of_interest","establishment"],"vicinity":"22 Cortlandt Street, New York","html_attributions":[]}},"__Ylip82K__":{"id":"__Ylip82K__","r":{"geometry":{"location":{"G":40.708707,"K":-74.00532399999997}},"icon":"https://maps.gstatic.com/mapfiles/place_api/icons/shopping-71.png","id":"62d2705186d068b79a32e9d4349d8e235fd0a93a","name":"Midtown Comics Downtown","opening_hours":{"open_now":true,"weekday_text":[]},"photos":[{"height":375,"html_attributions":["<a href=\"https://maps.google.com/maps/contrib/112600870101860586832\">Midtown Comics Downtown</a>"],"width":500}],"place_id":"ChIJhb4pSz1awokRMqAUarOuIB8","rating":4.6,"reference":"CnRqAAAAgNfjPifwwJyDIAenm1TnPONcl8Cp7DHrAGt1WIIuZr9TXCbiGp5XLgHsE__253jqIiww6opYNeSaSt0bsUpeLc0VIO7fur7i-EEcgw0UuZ0u9i7QYGfc7cNsVdqwKCFBKfdJA7fKdU6pf0QnmIxR9xIQG3o4E5eLeeRndGFnuQl08xoUPBo27NfuC4WWMwfhpiCecY2oShM","scope":"GOOGLE","types":["book_store","store","point_of_interest","establishment"],"vicinity":"64 Fulton Street, New York","html_attributions":[]}},"__Wm5yY6U__":{"id":"__Wm5yY6U__","r":{"geometry":{"location":{"G":40.711741,"K":-74.00877500000001}},"icon":"https://maps.gstatic.com/mapfiles/place_api/icons/shopping-71.png","id":"b12a08acf23e68667289120da35dadef6937aeee","name":"Staples","opening_hours":{"open_now":true,"weekday_text":[]},"photos":[{"height":667,"html_attributions":["<a href=\"https://maps.google.com/maps/contrib/100386559549639116279\">Staples</a>"],"width":667}],"place_id":"ChIJJyUnVRhawokRr3YCjzxUE74","price_level":2,"rating":2.7,"reference":"CmRbAAAAdtHJUNgSg6N_jwdYTkpb0IIYNLdHcpACczUDrgCMu8qnq76B3FmXYS-jHYExJ1tlDYYT9iT1aiQtu5Kdice8RkTHwQ97SWxgAGWGBg2Kx_Uxlc7nnksQe2u5Gn1IJIlSEhDWZBwmSSM03b_IZwAg6WFXGhSrtOEm4PnWSV9FfrNzJRXVVOtgDw","scope":"GOOGLE","types":["furniture_store","electronics_store","general_contractor","home_goods_store","store","point_of_interest","establishment"],"vicinity":"217 Broadway, Vesey Street, New York","html_attributions":[]}},"__hcB7aVd__":{"id":"__hcB7aVd__","r":{"geometry":{"location":{"G":40.715531,"K":-74.01146900000003}},"icon":"https://maps.gstatic.com/mapfiles/place_api/icons/restaurant-71.png","id":"27f938a9b8e0d3d519e1144f1b51654259a2f49e","name":"Whole Foods Market","opening_hours":{"open_now":true,"weekday_text":[]},"photos":[{"height":1365,"html_attributions":["<a href=\"https://maps.google.com/maps/contrib/104111246635874032234\">ZAGAT</a>"],"width":2048}],"place_id":"ChIJl4BZ5opZwokRUR0n7MrTIEA","price_level":3,"rating":4.3,"reference":"CnRlAAAA3N5nEQq9oMJz9W0PSsU6obe6F5GSKV9P8jUBXt5beog8jxYOYYbGKUMX8Wip9aLjlgW8iYHn5EnRd0xYrZXdvUEz2qw4pCmFO_L1MTPCFQQLWQaOS8v0_ILNHojHci0rlC58bbNRA5vDoIPwP6LzvRIQBD64gOsvzM8uoyixH7azHhoU_pgrvJMxGJ2D2gNcFvQlTJN8TpE","scope":"GOOGLE","types":["grocery_or_supermarket","bakery","health","florist","store","food","point_of_interest","establishment"],"vicinity":"270 Greenwich Street, New York","html_attributions":[]}},"__8lomIfR__":{"id":"__8lomIfR__","r":{"geometry":{"location":{"G":40.715655,"K":-74.01168899999999}},"icon":"https://maps.gstatic.com/mapfiles/place_api/icons/shopping-71.png","id":"923e98e4be75bee668f8bfb30fd3afbf62533207","name":"Barnes & Noble","opening_hours":{"open_now":true,"weekday_text":[]},"place_id":"ChIJ82g3sR5awokRxn7MgUTAsaI","price_level":2,"rating":3.7,"reference":"CnRiAAAA45Dz-RESP3oHQ_kMlinqZXmFZ_5fpSy2hcaaXsyOxG6mzH-vvT-SxaInhRPgHL93DPG-2lgcox9g0WJ9QmvQkHoWSEpQPGou18xzasxVMth4rw2QzBP8MCYxnC6RQr06g6rf6-qOgA5Zxbf5DAZ7SBIQiI3MIVimy0RNKzt_i96vyhoUyDlJytvg75qMI5kWn5HbZ0zh2xQ","scope":"GOOGLE","types":["book_store","store","point_of_interest","establishment"],"vicinity":"97 Warren Street, New York","html_attributions":[]}},"__r4Q0mLS__":{"id":"__r4Q0mLS__","r":{"geometry":{"location":{"G":40.711706,"K":-74.00859700000001}},"icon":"https://maps.gstatic.com/mapfiles/place_api/icons/generic_business-71.png","id":"fcfc34d293237646b0ace0da1d7e7a0c0b2489b1","name":"AT&T","opening_hours":{"open_now":true,"weekday_text":[]},"photos":[{"height":450,"html_attributions":["<a href=\"https://maps.google.com/maps/contrib/103664646610029168300\">Wireless Shop Activations</a>"],"width":600}],"place_id":"ChIJueP3WBhawokRH6FPfc6_TMg","price_level":2,"rating":3.4,"reference":"CmRYAAAA2zKPbzuL18DFnkk3U7ReusCffnelx_JEmyNmuHLB-lVhiB8cx9UNF8EgjECwcXoJagwf4N33B4V6LsaFY0-o8shKqCJFZ4HERFPElUZnyHIGI5cGadwyqnEXOic9LD4REhBsIIjsZD9NO5Lv9V5kNXFWGhQg6HSIUquCkQl0g0IAxFDiDh5qUA","scope":"GOOGLE","types":["store","point_of_interest","establishment"],"vicinity":"217 Broadway Suite 101, New York","html_attributions":[]}},"__3pDsfIr__":{"id":"__3pDsfIr__","r":{"geometry":{"location":{"G":40.714987,"K":-74.00938300000001}},"icon":"https://maps.gstatic.com/mapfiles/place_api/icons/restaurant-71.png","id":"c2372255a41c96df5c737d5a4c8c6ed64903ae56","name":"Le Pain Quotidien","opening_hours":{"open_now":true,"weekday_text":[]},"photos":[{"height":648,"html_attributions":["<a href=\"https://maps.google.com/maps/contrib/115219385039889593496\">Walkertwentyfour NYC</a>"],"width":1152}],"place_id":"ChIJU0lt1x5awokRcd1w1u4Ju9Q","price_level":2,"rating":3.8,"reference":"CnRlAAAAirU7t1ja_TE169RUnEFTcXXl6On1EkqI3owTjGK9YqU89ruh0AMnFdvqU0Dscf4KBdQ9MP6yNlknD0BQXSEXqEaPqwP6ywPOu0B1UPv_aew5dKZsENDOqKXF62YX7uE7irwwdLpnwFW2nUxiCveZaRIQdU0qY2YVUQdTczNF4xF5fBoUXACqHOvyFKNC1atO96s-zaQXxLk","scope":"GOOGLE","types":["bakery","store","meal_takeaway","cafe","restaurant","food","point_of_interest","establishment"],"vicinity":"81 West Broadway, New York","html_attributions":[]}},"__2PGpO0R__":{"id":"__2PGpO0R__","r":{"geometry":{"location":{"G":40.708771,"K":-74.00790599999999}},"icon":"https://maps.gstatic.com/mapfiles/place_api/icons/bar-71.png","id":"6da67fabccadfada960005d2ed06aae10e48c182","name":"Zeytuna","opening_hours":{"open_now":true,"weekday_text":[]},"photos":[{"height":1296,"html_attributions":["<a href=\"https://maps.google.com/maps/contrib/110334598707620116265\">Yalle Ramey</a>"],"width":972}],"place_id":"ChIJ62-fkRdawokR3uOQWkYfRQc","price_level":2,"rating":3.6,"reference":"CmRaAAAAxx-IfKTxcFlNXXlHRsbxgUhiBBLEixSv70GtQcQ8f6hINmXE_uOhAhlbxcpcqr5BC5nOgTtE1jd1Y3wp8E0RSZ5wUogWUC3lQj-UcCKBlCoOexonQRf0yyKro64tlnH8EhAvswH5qBofdamPOSV1ciNOGhQuH7hN8KF1iL8RGgrJawvW8IXWfA","scope":"GOOGLE","types":["bar","restaurant","grocery_or_supermarket","store","food","point_of_interest","establishment"],"vicinity":"59 Maiden Lane, New York","html_attributions":[]}},"__dn6ljus__":{"id":"__dn6ljus__","r":{"geometry":{"location":{"G":40.715737,"K":-74.00591300000002}},"icon":"https://maps.gstatic.com/mapfiles/place_api/icons/generic_business-71.png","id":"7a9f71ab36ad5d8222a376da111dae2f35f4a7f1","name":"FedEx Office Print & Ship Center","opening_hours":{"open_now":true,"weekday_text":[]},"photos":[{"height":445,"html_attributions":["<a href=\"https://maps.google.com/maps/contrib/117279068143433891813\">FedEx Office Print &amp; Ship Center</a>"],"width":665}],"place_id":"ChIJXb6h2SFawokR_b6U3GtnUJU","price_level":2,"rating":1.9,"reference":"CoQBdAAAAH9Ru818F-Hx16A1uT1h1wSwi4T4ilNktpi6LDgpUDVmyQl2OsBWAlTKjVYXZCon0g0NXL6cFsr0VfmIL5M1Y2tDtkAO49Hj3fqaHRH6WoOLDgOs3KSEbEixL8Oa--K4Vj1EDaC05wI-OHTQexIGJOGP_DXfLBjwUCCv5q6u3Jm0EhDAIfesLBXd84feHzteTW0sGhSj_6RbYF8emMz3bL-qkwBkWhYpSw","scope":"GOOGLE","types":["store","point_of_interest","establishment"],"vicinity":"105 Duane St, New York","html_attributions":[]}},"__vktOK9d__":{"id":"__vktOK9d__","r":{"geometry":{"location":{"G":40.715616,"K":-74.00993399999999}},"icon":"https://maps.gstatic.com/mapfiles/place_api/icons/wine-71.png","id":"29f573307308b346265e9d1301fb0277f1eba7a6","name":"Chambers Street Wines","opening_hours":{"open_now":true,"weekday_text":[]},"place_id":"ChIJIS1Q5x5awokRvvv5r2FcmSM","price_level":3,"rating":4.4,"reference":"CnRoAAAAlNj4gj2GaFT6ZIbGwWlf-BfwR1jLRo12j1i0eRqtV3yVFalFfPNrAg4HQD1JE7W2aXFZjPuxczk3Y-TamKCHkO3MFE6Af9KFkLrq7pDXequxsQkEeRW9Rkd18AXMQrIh842cU9VgKN73XinHrk28-hIQSkDXPpD2Hx3aiW712HZjzRoUsGE-PD5lqVq7P796aSVguhzuHvU","scope":"GOOGLE","types":["liquor_store","food","store","bar","point_of_interest","establishment"],"vicinity":"148 Chambers Street, New York","html_attributions":[]}},"__6HFaoPN__":{"id":"__6HFaoPN__","r":{"geometry":{"location":{"G":40.709176,"K":-74.01009999999997}},"icon":"https://maps.gstatic.com/mapfiles/place_api/icons/generic_business-71.png","id":"222ee2834ed2fe4472b0767c6e3d365f11e3f433","name":"Sephora","opening_hours":{"open_now":true,"weekday_text":[]},"place_id":"ChIJg_sOYxdawokR1rjcdLYGUrk","price_level":3,"rating":4.4,"reference":"CmRbAAAApR48NO5oM4hhGdcDkZVBShAz_sjKPhpBJiAZp1Or4urQ0GTDyW5OOTCg85wGE_lSHlRprRbwGR-IOgRXrUWbtZLk6qSc4Amvrx_-0qqE1bGtGvOmKQRfU3wBvUJbx0sfEhCNf03FFtK3CkoLs2Vo_DwDGhRpmHXnyWA1kcPHzXtsudyfvfrcVw","scope":"GOOGLE","types":["store","point_of_interest","establishment"],"vicinity":"150 Broadway, New York","html_attributions":[]}},"__VAUbxRT__":{"id":"__VAUbxRT__","r":{"geometry":{"location":{"G":40.709744,"K":-74.01131800000002}},"icon":"https://maps.gstatic.com/mapfiles/place_api/icons/shopping-71.png","id":"6655ab507adf262cb6bd0c390a4bc0f911949c32","name":"Brooks Brothers","opening_hours":{"open_now":true,"weekday_text":[]},"photos":[{"height":1152,"html_attributions":["<a href=\"https://maps.google.com/maps/contrib/116949269003482072748\">Brooks Brothers</a>"],"width":2048}],"place_id":"ChIJW0JsWhdawokRyEOsXXN5XN4","price_level":3,"rating":3.9,"reference":"CnRjAAAAlmXp8ldbZyMYwoMecErNeWrD-f927GfCl-yUqCXDDOuE285H7DfRLL46aPB1c-l5HnZCdoyitK4ONqe7ceRwVfQ9MSbXhlTBIv60ifmkAX2tD4l-9SfQQLUdXc4Qgc3gDDDXRJjdv7YdBxzb33BktBIQT79arhvNd0vcptimhVLJFxoUlyW3XHRb2A-RrrqrD8eQ-5MYguA","scope":"GOOGLE","types":["clothing_store","shoe_store","store","point_of_interest","establishment"],"vicinity":"1 Liberty Street, New York","html_attributions":[]}},"__uWocPC7__":{"id":"__uWocPC7__","r":{"geometry":{"location":{"G":40.710454,"K":-74.007364}},"icon":"https://maps.gstatic.com/mapfiles/place_api/icons/shopping-71.png","id":"d8fc368e240ff3c4718007ea3a601daa4e2f6e81","name":"CVS Pharmacy - Photo","opening_hours":{"open_now":true,"weekday_text":[]},"place_id":"ChIJ9XQJEhhawokR-OUFlT4C5Jk","rating":3.2,"reference":"CnRoAAAAaYMwLSmYpcOKjCFTcI6s4cAhokzo4hvEo0hDAnizd7nBu5OFej3_eUkJpPp8RE2bStPig7rWZ-FOo55Pc7OFR6KSFnIqMinHhlA1woEc7UZI-NRuKUgbJMpMyjGURkyEUdM9sQKmHgtcB5KABYKs-hIQ1juSr3i0vAma-h-GpxiM2BoUF-xLdBw9ukyORWKYA7DfK5hRf_E","scope":"GOOGLE","types":["pharmacy","convenience_store","food","store","health","point_of_interest","establishment"],"vicinity":"129 Fulton Street, New York","html_attributions":[]}},"__RfJbkNm__":{"id":"__RfJbkNm__","r":{"geometry":{"location":{"G":40.714698,"K":-74.00941399999999}},"icon":"https://maps.gstatic.com/mapfiles/place_api/icons/shopping-71.png","id":"a05c23d2f9d704078c9a85c47a98f08b04e9a27c","name":"Korin","opening_hours":{"open_now":true,"weekday_text":[]},"photos":[{"height":147,"html_attributions":["<a href=\"https://maps.google.com/maps/contrib/117712279178224878474\">Korin</a>"],"width":220}],"place_id":"ChIJIVUn1h5awokR07P2NK_cufQ","rating":5,"reference":"CmRZAAAAmQH7ZhFRRQLsPVYNMKKsZcfsJ0qPqk3hMg1ePyPdE2najPp8KtW6Sj65lvtas-O1RbwhOuRfeXEvV0lbZXlNcODcaupWznQED1BuPIuaag9th9lj8aV0WRQmrPUNj2t4EhB6ezZ_qVnvttUGWV99eTUrGhRerE43pv8yDvyIwz2qC9RtgL4Y_w","scope":"GOOGLE","types":["home_goods_store","store","point_of_interest","establishment"],"vicinity":"57 Warren Street, New York","html_attributions":[]}},"__rVzqxUp__":{"id":"__rVzqxUp__","r":{"geometry":{"location":{"G":40.712914,"K":-74.00779299999999}},"icon":"https://maps.gstatic.com/mapfiles/place_api/icons/shopping-71.png","id":"2363039a737eb760d5ffc8c549120920fa7b3523","name":"Duane Reade","opening_hours":{"open_now":true,"weekday_text":[]},"place_id":"ChIJXe7yvRhawokRaHrG-4v3fgU","price_level":2,"rating":3.3,"reference":"CmReAAAArQxPEkQHrPcfriG993munHku9TZkYDCfHMhs_Tsc76zEecUsBEiHFdAvxXKFtPkI3pVheTISCLoJX-S50dsCt4HJBwQfTSZvasRMCBFRcESs4hY6WZ7weobD4gzdJvpUEhCmU3IMNVLKFzO4koJfoAQhGhSalFgH4-ooUnF73ThCZfRPSg3kZA","scope":"GOOGLE","types":["pharmacy","convenience_store","food","store","health","point_of_interest","establishment"],"vicinity":"250 Broadway, New York","html_attributions":[]}},"__Lslh0KS__":{"id":"__Lslh0KS__","r":{"geometry":{"location":{"G":40.713172,"K":-74.01021500000002}},"icon":"https://maps.gstatic.com/mapfiles/place_api/icons/restaurant-71.png","id":"be358ee2aa5239a209d2c8c8074b730c222b21b2","name":"Aroma Espresso Bar","opening_hours":{"open_now":true,"weekday_text":[]},"photos":[{"height":512,"html_attributions":["<a href=\"https://maps.google.com/maps/contrib/110474378875802554063\">Aroma Espresso Bar</a>"],"width":512}],"place_id":"ChIJaZTSHxlawokRTROCANZz8kY","price_level":1,"rating":3.9,"reference":"CnRlAAAAaWPrZnG5apSD-QZTrY9O69l17WVho1mAofyB-uAF_cBjusijRRTS-D3XAC-F3FSBg2j35luE2MN00MFzkEUsUWHOMl-WKRjx-52h_K61SMVO1Db7hOXFhAIbQ8DHpn5OFqkZQPOAHZxi7-1g1hvh4hIQswJB1q8dAtLUopqgTEGd2BoUH4UnZZwyRsToiZ-JPe9-6ZfZvYo","scope":"GOOGLE","types":["restaurant","store","meal_takeaway","cafe","food","point_of_interest","establishment"],"vicinity":"100 Church Street, New York","html_attributions":[]}},"__0LjD2pI__":{"id":"__0LjD2pI__","r":{"geometry":{"location":{"G":40.70984,"K":-74.00800800000002}},"icon":"https://maps.gstatic.com/mapfiles/place_api/icons/generic_business-71.png","id":"f38d2eed4815b25be9aec016f0877c8205d61484","name":"Newstand Nassau","photos":[{"height":648,"html_attributions":["<a href=\"https://maps.google.com/maps/contrib/101084177775161897744\">Walkerthirteen NYC</a>"],"width":1152}],"place_id":"ChIJizRiPRhawokRh5Znucw0osM","reference":"CnRjAAAA1FoI8FA_dj82kgwn6YCghMBEWj9HLNbQQhKykC3IG-r8PFGaWVLkqe3QD0hNSczG6vqtegIXA5NnwB7oTgPET-vlTk0day3SfrQ-yXsz45xwCtf3S_fpJVve61b-08dXdDS0bnBX112pdLQf1-cHiBIQj0rlx933WbyoCuukbrMNyBoU0m5efotrCrI3WjNz1ZmegyEw_RI","scope":"GOOGLE","types":["store","point_of_interest","establishment"],"vicinity":"80 Nassau Street, New York","html_attributions":[]}},"__XDiBsC2__":{"id":"__XDiBsC2__","r":{"geometry":{"location":{"G":40.714087,"K":-74.00725699999998}},"icon":"https://maps.gstatic.com/mapfiles/place_api/icons/generic_business-71.png","id":"0ab4edf80ca8c5cfca41e8b1472353907f273648","name":"Fountain Pen Hospital","opening_hours":{"open_now":false,"weekday_text":[]},"photos":[{"height":893,"html_attributions":["<a href=\"https://maps.google.com/maps/contrib/115860601137867407364\">Fountain Pen Hospital</a>"],"width":1024}],"place_id":"ChIJSaWkshhawokRVVXnjUKjNTo","rating":3.7,"reference":"CnRoAAAAWE7PMhHuC6HnjNKR12rajQ1oM78Jfh6WXyhaMsY3NLRl7gXsvBwlfkTtm0vuLT8gXpFg2hzfRNLCUnJMgMaI41snX3_1BhkHiy0Ziyn2sTfZz0H-cyrLVQuY3rrTTCgcRhpPkv-xf6fx9kaLQJbewRIQ20DCO8ofKgwBlUmD--X3oRoUufaBwfXlpYT7gyWEIM5Z7uZTblM","scope":"GOOGLE","types":["store","point_of_interest","establishment"],"vicinity":"10 Warren Street, New York","html_attributions":[]}},"__Tc0HqcU__":{"id":"__Tc0HqcU__","r":{"geometry":{"location":{"G":40.71403,"K":-74.010156}},"icon":"https://maps.gstatic.com/mapfiles/place_api/icons/restaurant-71.png","id":"a7ae2f7b47dfb9ee5414c9132f1c9741e6881ffc","name":"Amish Market Tribeca","opening_hours":{"open_now":true,"weekday_text":[]},"photos":[{"height":1367,"html_attributions":["<a href=\"https://maps.google.com/maps/contrib/116707993342200424883\">Mary Jones</a>"],"width":2048}],"place_id":"ChIJCw7QLxlawokRpsCejdH9yfQ","price_level":2,"rating":3.4,"reference":"CnRoAAAApOKfKoeIw3ehjg3ckwWuyXWfBIXfZAK81dCy_eayL-8asS-OGz24EgxrGwq7wnFb7CY_pw2-p39UewVnVPQ-Fx8tuh-s_Q0VDdZ9IY6gXo8BpOxWmy8HTpk0SFLTpBXtHFSTm4gt01YFNs0Ay-2MfxIQnTjFZGtN7fJGJcQuQiAsLxoUvHduqiFeXEtf9d4pFvKMuBeN6W4","scope":"GOOGLE","types":["grocery_or_supermarket","meal_takeaway","restaurant","store","meal_delivery","food","point_of_interest","establishment"],"vicinity":"53 Park Place, New York","html_attributions":[]}},"__4rCLz3a__":{"id":"__4rCLz3a__","r":{"geometry":{"location":{"G":40.715604,"K":-74.00981000000002}},"icon":"https://maps.gstatic.com/mapfiles/place_api/icons/restaurant-71.png","id":"fbf0e60572039b069b59a50a6d6b66a577152fda","name":"Zuckers Bagels & Smoked Fish","opening_hours":{"open_now":true,"weekday_text":[]},"photos":[{"height":1367,"html_attributions":["<a href=\"https://maps.google.com/maps/contrib/116707993342200424883\">Mary Jones</a>"],"width":2048}],"place_id":"ChIJHd-g4B5awokRBp91XWL8bZE","price_level":1,"rating":4.2,"reference":"CoQBcQAAALc3p5WqpKlACwbqcesjnvD43nZeeslS-mtDJPlbkG7m3E31T8LGWSszCLPJKe9IBrMB3DEcRV5oZPsSv2mg0TLyRhmIyXX4-C9LOdM0gDKrG7fbRG8fvNlWkaGV77nWk4ZQcoy4cLlaNOt-RmX7aWHmxPVVR7jjSvNA8PnSpPYpEhAqTgKlXPeHeCCVgA6-okGWGhRKrmlnCsB9_TnJD6QO68nsQfBTaQ","scope":"GOOGLE","types":["bakery","store","meal_takeaway","restaurant","meal_delivery","food","point_of_interest","establishment"],"vicinity":"146 Chambers Street, New York","html_attributions":[]}}};

			var arr =[];
			for(var o in d)arr.push(d[o].r)
			return arr;
		};

		//grab the frame events
		obj.activeWindow = undefined;

		//register click event of tile button
		$('body').on('click', '.box-frame .box-launch', function(e){

				var t = $(this).closest('.box-frame').parent();
				
				if(me.activeWindow!=undefined){//some window is already open

					if(t.attr('id') == me.activeWindow.attr('id'))return;
				};

				myMaps.util.overlay.remove();

				var o = myMaps.util.overlay.add('.map-container');
				//o.css({'top':'2px'});
				var h = $(me.tile.settings.selectors.wrapper).height();
				var oh = o.height();
				o.height(oh-h-10);
				var cl = $('<button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">X</span></button>');
				o.prepend(cl);
				cl.on('click', function(){o.remove();})

				obj.activeWindow = t;

			 	obj.grabContent(o, t.attr('id'));
		});

		obj.grabContent = function(target, id){

			if(me.options.tempCurrentPosition==undefined){
				me.setCurrentPosition();
			}

			$.when($.ajax({
				url:'/subscribe',
				type:'POST',
				data:{}
			})).done(function(d){

				var _s = me.lastSearchedResult[id];

				var htm = $(d);

				//covered at grab
				//_s.r.geometry.location = me.makeSureLatLngObj(_s.r.geometry.location);

				//header - info
				$('.head-text', htm).text(_s.r.name);
				$('.head-desc', htm).text(_s.r.vicinity);

				//type
				for (var i = 0; i < _s.r.types.length; i++) {
					
					var t = _s.r.types[i];
					var _qt = obj.supportedTypes[t];
					if(_qt!=undefined){
						$('.place-type', htm).text(_qt.friendlyname);
						break;
					}else{
						$('.place-type', htm).text('Store');
					}
				};

				//distance
				setTimeout(function(){
	
					var k = me.distanceBetween(_s.r.geometry.location, me.options.tempCurrentPosition);
					$('.place-distance', htm).text(me.sanitizeDistance(k));

				},2000);


				//services offered
				$('.head-controls button', htm).each(function(i,v){

					var m = $(v).data('mode');
					if(m)return;

					if(myMaps.util.random(0,50) > 30)
						$(v).addClass('btn-success');
					else{
						$(v).attr('disabled',true).addClass('btn-danger');
					}
				});

				//head controls
				$('.head-controls button', htm).on('click', function(){

						var $this = $(this);
						var msg = $this.data('msg');
						var mode = $this.data('mode');
						if(mode!=undefined){

							me.route.draw(me.options.tempCurrentPosition, _s.r.geometry.location);
							return;
						}

						var defaultmsg = 'This service is not available';
						if($this.hasClass('btn-success')){
							myMaps.util.modalHandler.info('Info', msg);
						}
						else{
							myMaps.util.modalHandler.error('Error', 'This service is not provided. Regret')
						}
				});

				//opening-details
				if(_s.r.opening_hours!=undefined){//make sure the info is available
					var oh = $('.opening-hours', htm);
					var _to = _s.r.opening_hours.open_now?'Open':'Closed';
					oh.append($('<p>'+_to+'</p>'))
				}

				//misc
				if(_s.r.price_level!=undefined){
					var misc= $('.misc', htm);
					misc.append('<p> Price Level :'+ _s.r.price_level +'</p>');
				}

				//rating
				var rate = $('.ratings', htm);
				var rvalue = _s.r.rating == undefined?0:_s.r.rating
				$('.rateit', rate).data('rateit-value', rvalue);
				
				setTimeout(function(){
					$('.rateit').rateit({ max: 5, step: 1});
				},700);


				//move map to selected location
				me.gotoByGeoCode(_s.r.geometry.location, 17);


				/*photo is no longer shown
				var img = $('<img></img>');
				var con = [
				            'https://maps.googleapis.com/maps/api/place/photo?maxwidth=400',
						    'reference=' + _s.r.reference, 
						    'key=AIzaSyBKrX5VBDJWqME9a0FTyiNLxMPJGhRxPok']

				img.attr('src', con.join('&'))				
				$('.photo-container',htm).append(img);	
				*/
				target.append(htm);

			}).fail(function(xhr,error){


			});
		};
	};

	me.dataSource = new dataSource();

	function routeService(options){

			var obj = this;

			obj.directionsDisplay ='';
			obj.directionsService = new google.maps.DirectionsService();
		    obj.map = options.map;//compulsion..must provide

		    obj.init = function(g, _callback){//g is google latlng object

		    	obj.directionsDisplay = new google.maps.DirectionsRenderer();
		        var mapOptions = {
		            zoom: options.zoom?options.zoom:7,
		            center: g
		        };
		        obj.directionsDisplay.setMap(obj.map);
		        if(typeof _callback == 'function')
		        	_callback();
		    };

		    obj.draw = function(start, end){

		    	obj.clear();
		    	obj.init(start, function(){ obj.calcRoute(start, end)});
		    };

		    obj.clear = function(){

		    	if(obj.directionsDisplay!=undefined &&
		    	   obj.directionsDisplay!=null &&
		    	   obj.directionsDisplay.set!=undefined)
		    		obj.directionsDisplay.set('directions',null)
		    }

		    obj.calcRoute = function(start, end){

		        var bounds = new google.maps.LatLngBounds();
		        bounds.extend(start);
		        bounds.extend(end);
		        obj.map.fitBounds(bounds);
		        var request = {
		            origin: start,
		            destination: end,
		            travelMode: google.maps.TravelMode.DRIVING
		        };
		        obj.directionsService.route(request, function (response, status) {
		            if (status == google.maps.DirectionsStatus.OK) {
		                obj.directionsDisplay.setDirections(response);
		                obj.directionsDisplay.setMap(obj.map);
		            } else {
							
						//var m = "Directions Request from " + start.toUrlValue(6) + " to " + end.toUrlValue(6) + " failed: " + status
						myMaps.util.modalHandler.error('Could not draw navigation','Service Failed. It appears there are no direct road routes between your location and this one!' )
		            }
		        });
		    };
	};
	
	me.route = new routeService({map:me.map,zoom:10});

	me.init(_callback);
};