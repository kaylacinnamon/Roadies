var tripAdvisorAPI = angular.module('tripAdvisorAPI',[]);

tripAdvisorAPI.controller('firstController', function($scope, $window, $http) {
  var origin_place_id = null;
  var destination_place_id = null;
  var travel_mode = 'DRIVING';

  $window.map = new google.maps.Map(document.getElementById('map'), {
    zoom: 13,
    center: {lat: 42.7284, lng: -73.6918},
    mapTypeControl: false
  });
  var directionsService = new google.maps.DirectionsService;
  var directionsDisplay = new google.maps.DirectionsRenderer;
  var routeboxer = new RouteBoxer();
  var distance = 10; //km
  directionsDisplay.setMap(map);

  var origin_input = document.getElementById('origin-input');
  var destination_input = document.getElementById('destination-input');

  map.controls[google.maps.ControlPosition.TOP_LEFT].push(origin_input);
  map.controls[google.maps.ControlPosition.TOP_LEFT].push(destination_input);

  var origin_autocomplete = new google.maps.places.Autocomplete(origin_input);
  origin_autocomplete.bindTo('bounds', map);
  var destination_autocomplete = new google.maps.places.Autocomplete(destination_input);
  destination_autocomplete.bindTo('bounds', map);

  function expandViewportToFitPlace(map, place) {
    if (place.geometry.viewport) {
      map.fitBounds(place.geometry.viewport);
    } else {
      map.setCenter(place.geometry.location);
      map.setZoom(17);
    }
  }

  origin_autocomplete.addListener('place_changed', function() {
    var place = origin_autocomplete.getPlace();
    if (!place.geometry) {
      $window.alert("Autocomplete's returned place contains no geometry");
      return;
    }
    expandViewportToFitPlace(map, place);

    origin_place_id = place.place_id;
    route(origin_place_id, destination_place_id, directionsService, directionsDisplay);
  });

  destination_autocomplete.addListener('place_changed', function() {
    var place = destination_autocomplete.getPlace();
    if (!place.geometry) {
      $window.alert("Autocomplete's returned place contains no geometry");
      return;
    }
    expandViewportToFitPlace(map, place);

    destination_place_id = place.place_id;
    route(origin_place_id, destination_place_id, directionsService, directionsDisplay);
  });

  function route(origin_place_id, destination_place_id, directionsService, directionsDisplay) {
    if (!origin_place_id || !destination_place_id) {
      return;
    }
    directionsService.route({
      origin: {'placeId': origin_place_id},
      destination: {'placeId': destination_place_id},
      travelMode: 'DRIVING'
    }, function(result, status) {
      if (status === 'OK') {
        directionsDisplay.setDirections(result);
        var path = result.routes[0].overview_path;
        var bounds = routeboxer.box(path, distance);
        for (var i = 0; i < bounds.length; ++i) {
          myTrip(bounds[i]);
        }
      }
      else {
        $window.alert('Directions request failed due to ' + status);
      }
    });

  }

  function myTrip(coord) {
    coord = String(coord).replace(/\(|\)/g,'');
    var myArray = coord.split(", ");
    for(var i=0; i<myArray.length; i++) { myArray[i] = +myArray[i]; }
    var lat = myArray[0];
    var lng = myArray[1];
    $http.get("http://api.tripadvisor.com/api/partner/2.0/map/" + lat + "," + lng + "/hotels?key=ce734f13-edb0-4b74-89da-1b52f403ace0").then(function(response) {
      $scope.hotels = response.data.data;
      var markers = [];
      var contents = [];
      var infowindows = [];
      var max = 1;
      if ($scope.hotels.length < 1) {
        max = $scope.hotels.length;
      }
      for (var i = 0; i < max; ++i) {
        var pos = new google.maps.LatLng(parseFloat($scope.hotels[i].latitude), parseFloat($scope.hotels[i].longitude));
        console.log(parseFloat($scope.hotels[i].latitude));
        markers[i] = new Marker({
          position: pos,
          map: map,
          id: i,
          icon: {
            path: SQUARE_PIN,
            fillColor: '#1998F7',
            fillOpacity: 1,
            strokeColor: '',
            strokeWeight: 0
          },
          map_icon_label: '<span class="map-icon map-icon-lodging"</span>'
        });
        markers[i].index = i;
        var rating;
        if ($scope.hotels[i].rating_image_url != null) {
          if ($scope.hotels[i].price_level != null) {
            contents[i] = '<div id="content">'+
              '<div id="siteNotice">'+
              '</div>'+
              '<h4 id="firstHeading" class="firstHeading">' + $scope.hotels[i].name +
              '</h4><div id="bodyContent">'+
              '<p><img src="' + $scope.hotels[i].rating_image_url + '" alt="' + $scope.hotels[i].rating + '"></p>'+
              '<p>Distance from Route: ' + $scope.hotels[i].distance + ' miles</p>' +
              '<p>Price Level: ' + $scope.hotels[i].price_level + '</p>' +
              '<p>URL: <a href="' + $scope.hotels[i].web_url + '">'+ $scope.hotels[i].web_url + '</a> ' + '</p>'+
              '</div>'+
              '</div>';
          }
          else {
            contents[i] = '<div id="content">'+
              '<div id="siteNotice">'+
              '</div>'+
              '<h4 id="firstHeading" class="firstHeading">' + $scope.hotels[i].name +
              '</h4><div id="bodyContent">'+
              '<p><img src="' + $scope.hotels[i].rating_image_url + '" alt="' + $scope.hotels[i].rating + '"></p>'+
              '<p>Distance from Route: ' + $scope.hotels[i].distance + ' miles</p>' +
              '<p>URL: <a href="' + $scope.hotels[i].web_url + '">'+ $scope.hotels[i].web_url + '</a> '+ '</p>'+
              '</div>'+
              '</div>';
          }
          console.log($scope.hotels[i].rating_image_url);
        }
        else if ($scope.hotels[i].rating != null) {
          if ($scope.hotels[i].price_level != null) {
            contents[i] = '<div id="content">'+
              '<div id="siteNotice">'+
              '</div>'+
              '<h4 id="firstHeading" class="firstHeading">' + $scope.hotels[i].name +
              '</h4><div id="bodyContent">'+
              '<p>Rating: ' + $scope.hotels[i].rating + '</p>'+
              '<p>Distance from Route: ' + $scope.hotels[i].distance + ' miles</p>' +
              '<p>Price Level: ' + $scope.hotels[i].price_level + '</p>' +
              '<p>URL: <a href="' + $scope.hotels[i].web_url + '">'+ $scope.hotels[i].web_url + '</a> '+
              '</p>'+
              '</div>'+
              '</div>';
              console.log($scope.hotels[i].rating);
          }
          else {
            contents[i] = '<div id="content">'+
              '<div id="siteNotice">'+
              '</div>'+
              '<h4 id="firstHeading" class="firstHeading">' + $scope.hotels[i].name +
              '</h4><div id="bodyContent">'+
              '<p>Rating: ' + $scope.hotels[i].rating + '</p>'+
              '<p>Distance from Route: ' + $scope.hotels[i].distance + ' miles</p>' +
              '<p>URL: <a href="' + $scope.hotels[i].web_url + '">'+ $scope.hotels[i].web_url + '</a> '+
              '</p>'+
              '</div>'+
              '</div>';
          }
        }
        else {
          if ($scope.hotels[i].price_level != null) {
            contents[i] = '<div id="content">'+
              '<div id="siteNotice">'+
              '</div>'+
              '<h4 id="firstHeading" class="firstHeading">' + $scope.hotels[i].name +
              '</h4><div id="bodyContent">'+
              '<p>Distance from Route: ' + $scope.hotels[i].distance + ' miles</p>' +
              '<p>Price Level: ' + $scope.hotels[i].price_level + '</p>' +
              '<p>URL: <a href="' + $scope.hotels[i].web_url + '">'+ $scope.hotels[i].web_url + '</a> '+
              '</p>'+
              '</div>'+
              '</div>';
          }
          else {
            contents[i] = '<div id="content">'+
              '<div id="siteNotice">'+
              '</div>'+
              '<h4 id="firstHeading" class="firstHeading">' + $scope.hotels[i].name +
              '</h4><div id="bodyContent">'+
              '<p>Distance from Route: ' + $scope.hotels[i].distance + ' miles</p>' +
              '<p>URL: <a href="' + $scope.hotels[i].web_url + '">'+ $scope.hotels[i].web_url + '</a> '+
              '</p>'+
              '</div>'+
              '</div>';
          }
        }
        

        infowindows[i] = new google.maps.InfoWindow({
          content: contents[i]
        });

        google.maps.event.addListener(markers[i], 'click', function() {
          console.log(this.index);
          console.log(i);
          infowindows[this.index].open(map, markers[this.index]);
          map.panTo(markers[this.index].getPosition());
        });
      }
      
      console.log($scope.hotels[0]);
    });

    $http.get("http://api.tripadvisor.com/api/partner/2.0/map/" + lat + "," + lng + "/restaurants?key=ce734f13-edb0-4b74-89da-1b52f403ace0").then(function(response) {
      $scope.restaurants = response.data.data;
      var markers = [];
      var contents = [];
      var infowindows = [];
      var max = 1;
      if ($scope.restaurants.length < 1) {
        max = $scope.restaurants.length;
      }
      for (var i = 0; i < max; ++i) {
        var pos = new google.maps.LatLng(parseFloat($scope.restaurants[i].latitude), parseFloat($scope.restaurants[i].longitude));
        console.log(parseFloat($scope.restaurants[i].latitude));
        markers[i] = new Marker({
          position: pos,
          map: map,
          id: i,
          icon: {
            path: SQUARE_PIN,
            fillColor: '#00CCBB',
            fillOpacity: 1,
            strokeColor: '',
            strokeWeight: 0
          },
          map_icon_label: '<span class="map-icon map-icon-restaurant"</span>'
        });
        markers[i].index = i;
        var rating;
        if ($scope.restaurants[i].rating_image_url != null) {
          if ($scope.restaurants[i].price_level != null) {
            contents[i] = '<div id="content">'+
              '<div id="siteNotice">'+
              '</div>'+
              '<h4 id="firstHeading" class="firstHeading">' + $scope.restaurants[i].name +
              '</h4><div id="bodyContent">'+
              '<p><img src="' + $scope.restaurants[i].rating_image_url + '" alt="' + $scope.restaurants[i].rating + '"></p>'+
              '<p>Distance from Destination: ' + $scope.restaurants[i].distance + ' miles</p>' +
              '<p>Price Level: ' + $scope.restaurants[i].price_level + '</p>' +
              '<p>URL: <a href="' + $scope.restaurants[i].web_url + '">'+ $scope.restaurants[i].web_url + '</a> ' + '</p>'+
              '</div>'+
              '</div>';
          }
          else {
            contents[i] = '<div id="content">'+
              '<div id="siteNotice">'+
              '</div>'+
              '<h4 id="firstHeading" class="firstHeading">' + $scope.restaurants[i].name +
              '</h4><div id="bodyContent">'+
              '<p><img src="' + $scope.restaurants[i].rating_image_url + '" alt="' + $scope.restaurants[i].rating + '"></p>'+
              '<p>Distance from Destination: ' + $scope.restaurants[i].distance + ' miles</p>' +
              '<p>URL: <a href="' + $scope.restaurants[i].web_url + '">'+ $scope.restaurants[i].web_url + '</a> '+ '</p>'+
              '</div>'+
              '</div>';
          }
          console.log($scope.restaurants[i].rating_image_url);
        }
        else if ($scope.restaurants[i].rating != null) {
          if ($scope.restaurants[i].price_level != null) {
            contents[i] = '<div id="content">'+
              '<div id="siteNotice">'+
              '</div>'+
              '<h4 id="firstHeading" class="firstHeading">' + $scope.restaurants[i].name +
              '</h4><div id="bodyContent">'+
              '<p>Rating: ' + $scope.restaurants[i].rating + '</p>'+
              '<p>Distance from Destination: ' + $scope.restaurants[i].distance + ' miles</p>' +
              '<p>Price Level: ' + $scope.restaurants[i].price_level + '</p>' +
              '<p>URL: <a href="' + $scope.restaurants[i].web_url + '">'+ $scope.restaurants[i].web_url + '</a> '+
              '</p>'+
              '</div>'+
              '</div>';
              console.log($scope.restaurants[i].rating);
          }
          else {
            contents[i] = '<div id="content">'+
              '<div id="siteNotice">'+
              '</div>'+
              '<h4 id="firstHeading" class="firstHeading">' + $scope.restaurants[i].name +
              '</h4><div id="bodyContent">'+
              '<p>Rating: ' + $scope.restaurants[i].rating + '</p>'+
              '<p>Distance from Destination: ' + $scope.restaurants[i].distance + ' miles</p>' +
              '<p>URL: <a href="' + $scope.restaurants[i].web_url + '">'+ $scope.restaurants[i].web_url + '</a> '+
              '</p>'+
              '</div>'+
              '</div>';
          }
        }
        else {
          if ($scope.restaurants[i].price_level != null) {
            contents[i] = '<div id="content">'+
              '<div id="siteNotice">'+
              '</div>'+
              '<h4 id="firstHeading" class="firstHeading">' + $scope.restaurants[i].name +
              '</h4><div id="bodyContent">'+
              '<p>Distance from Destination: ' + $scope.restaurants[i].distance + ' miles</p>' +
              '<p>Price Level: ' + $scope.restaurants[i].price_level + '</p>' +
              '<p>URL: <a href="' + $scope.restaurants[i].web_url + '">'+ $scope.restaurants[i].web_url + '</a> '+
              '</p>'+
              '</div>'+
              '</div>';
          }
          else {
            contents[i] = '<div id="content">'+
              '<div id="siteNotice">'+
              '</div>'+
              '<h4 id="firstHeading" class="firstHeading">' + $scope.restaurants[i].name +
              '</h4><div id="bodyContent">'+
              '<p>Distance from Destination: ' + $scope.restaurants[i].distance + ' miles</p>' +
              '<p>URL: <a href="' + $scope.restaurants[i].web_url + '">'+ $scope.restaurants[i].web_url + '</a> '+
              '</p>'+
              '</div>'+
              '</div>';
          }
        }
        

        infowindows[i] = new google.maps.InfoWindow({
          content: contents[i]
        });

        google.maps.event.addListener(markers[i], 'click', function() {
          console.log(this.index);
          console.log(i);
          infowindows[this.index].open(map, markers[this.index]);
          map.panTo(markers[this.index].getPosition());
        });
      }
      console.log($scope.restaurants[0]);
    });
    $http.get("http://api.tripadvisor.com/api/partner/2.0/map/" + lat + "," + lng + "/attractions?key=ce734f13-edb0-4b74-89da-1b52f403ace0").then(function(response) {
      $scope.attractions = response.data.data;
      var markers = [];
      var contents = [];
      var infowindows = [];
      var max = 1;
      if ($scope.attractions.length < 1) {
        max = $scope.attractions.length;
      }
      for (var i = 0; i < max; ++i) {
        var pos = new google.maps.LatLng(parseFloat($scope.attractions[i].latitude), parseFloat($scope.attractions[i].longitude));
        console.log(parseFloat($scope.attractions[i].latitude));
        markers[i] = new Marker({
          position: pos,
          map: map,
          id: i,
          icon: {
            path: SQUARE_PIN,
            fillColor: '#6331AE',
            fillOpacity: 1,
            strokeColor: '',
            strokeWeight: 0
          },
          map_icon_label: '<span class="map-icon map-icon-point-of-interest"</span>'
        });
        markers[i].index = i;
        var rating;
        if ($scope.attractions[i].rating_image_url != null) {
          if ($scope.attractions[i].price_level != null) {
            contents[i] = '<div id="content">'+
              '<div id="siteNotice">'+
              '</div>'+
              '<h4 id="firstHeading" class="firstHeading">' + $scope.attractions[i].name +
              '</h4><div id="bodyContent">'+
              '<p><img src="' + $scope.attractions[i].rating_image_url + '" alt="' + $scope.attractions[i].rating + '"></p>'+
              '<p>Distance from Destination: ' + $scope.attractions[i].distance + ' miles</p>' +
              '<p>Price Level: ' + $scope.attractions[i].price_level + '</p>' +
              '<p>URL: <a href="' + $scope.attractions[i].web_url + '">'+ $scope.attractions[i].web_url + '</a> ' + '</p>'+
              '</div>'+
              '</div>';
          }
          else {
            contents[i] = '<div id="content">'+
              '<div id="siteNotice">'+
              '</div>'+
              '<h4 id="firstHeading" class="firstHeading">' + $scope.attractions[i].name +
              '</h4><div id="bodyContent">'+
              '<p><img src="' + $scope.attractions[i].rating_image_url + '" alt="' + $scope.attractions[i].rating + '"></p>'+
              '<p>Distance from Destination: ' + $scope.attractions[i].distance + ' miles</p>' +
              '<p>URL: <a href="' + $scope.attractions[i].web_url + '">'+ $scope.attractions[i].web_url + '</a> '+ '</p>'+
              '</div>'+
              '</div>';
          }
          console.log($scope.attractions[i].rating_image_url);
        }
        else if ($scope.attractions[i].rating != null) {
          if ($scope.attractions[i].price_level != null) {
            contents[i] = '<div id="content">'+
              '<div id="siteNotice">'+
              '</div>'+
              '<h4 id="firstHeading" class="firstHeading">' + $scope.attractions[i].name +
              '</h4><div id="bodyContent">'+
              '<p>Rating: ' + $scope.attractions[i].rating + '</p>'+
              '<p>Distance from Destination: ' + $scope.attractions[i].distance + ' miles</p>' +
              '<p>Price Level: ' + $scope.attractions[i].price_level + '</p>' +
              '<p>URL: <a href="' + $scope.attractions[i].web_url + '">'+ $scope.attractions[i].web_url + '</a> '+
              '</p>'+
              '</div>'+
              '</div>';
              console.log($scope.attractions[i].rating);
          }
          else {
            contents[i] = '<div id="content">'+
              '<div id="siteNotice">'+
              '</div>'+
              '<h4 id="firstHeading" class="firstHeading">' + $scope.attractions[i].name +
              '</h4><div id="bodyContent">'+
              '<p>Rating: ' + $scope.attractions[i].rating + '</p>'+
              '<p>Distance from Destination: ' + $scope.attractions[i].distance + ' miles</p>' +
              '<p>URL: <a href="' + $scope.attractions[i].web_url + '">'+ $scope.attractions[i].web_url + '</a> '+
              '</p>'+
              '</div>'+
              '</div>';
          }
        }
        else {
          if ($scope.attractions[i].price_level != null) {
            contents[i] = '<div id="content">'+
              '<div id="siteNotice">'+
              '</div>'+
              '<h4 id="firstHeading" class="firstHeading">' + $scope.attractions[i].name +
              '</h4><div id="bodyContent">'+
              '<p>Distance from Destination: ' + $scope.attractions[i].distance + ' miles</p>' +
              '<p>Price Level: ' + $scope.attractions[i].price_level + '</p>' +
              '<p>URL: <a href="' + $scope.attractions[i].web_url + '">'+ $scope.attractions[i].web_url + '</a> '+
              '</p>'+
              '</div>'+
              '</div>';
          }
          else {
            contents[i] = '<div id="content">'+
              '<div id="siteNotice">'+
              '</div>'+
              '<h4 id="firstHeading" class="firstHeading">' + $scope.attractions[i].name +
              '</h4><div id="bodyContent">'+
              '<p>Distance from Destination: ' + $scope.attractions[i].distance + ' miles</p>' +
              '<p>URL: <a href="' + $scope.attractions[i].web_url + '">'+ $scope.attractions[i].web_url + '</a> '+
              '</p>'+
              '</div>'+
              '</div>';
          }
        }
        

        infowindows[i] = new google.maps.InfoWindow({
          content: contents[i]
        });

        google.maps.event.addListener(markers[i], 'click', function() {
          console.log(this.index);
          console.log(i);
          infowindows[this.index].open(map, markers[this.index]);
          map.panTo(markers[this.index].getPosition());
        });
      }
      console.log($scope.attractions[0]);
    });
  }
});