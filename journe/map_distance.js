var map;
var geocoder;
var bounds = new google.maps.LatLngBounds();
var markersArray = [];

var url = window.location
var query = window.location.search.substring(1)
var string = JSON.stringify(query)
var stringArray = string.split("&")
valueArray = []
for (index in stringArray) {
  string = stringArray[index]
  var value = string.substring(string.indexOf("=") + 1)
  if (index == 2) {
    value = value.substring(0, value.length - 1)
  }
  valueArray[index] = value
}

var genre = JSON.stringify(valueArray[0])
var start = JSON.stringify(valueArray[1])
var dest = JSON.stringify(valueArray[2])

var globalPlaylistID;
var authorizationSpotify = 'BQBvkZBl0LwXg9EugRIDz4xxT4El3-CBAZ-aR-yvDNdoPT_k7vTmMFOAyiG4j0hnWY_-GIEsf_rzTFA1-0tth4xc0YyNsvYeZW7Es5RGOzWVAxAyaMQHJVjTZ7XPOzZtgOALY415TvlzUfG-BXd-NPlzg58nqwsWR9kqL2MCnoGSP99ufRKm9t7Zizkb_OUr1a2GssyV7bpiDDyUGICZz3A2JugFvMEgY9qn_0Y';

 create_playlist("new journey");

var embedURL = "https://embed.spotify.com/?uri=spotify%3Auser%3Ajourne-makebu%3Aplaylist%3A"; 

var tempArray = new Array(50);

var origin1 = start
var destinationA = dest

var destinationIcon = 'https://chart.googleapis.com/chart?chst=d_map_pin_letter&chld=D|FF0000|000000';
var originIcon = 'https://chart.googleapis.com/chart?chst=d_map_pin_letter&chld=O|FFFF00|000000';

function initialize() {
  var opts = {
    center: new google.maps.LatLng(71.05, 42.36),
    zoom: 2
  };
  map = new google.maps.Map(document.getElementById('map-canvas'), opts);
  geocoder = new google.maps.Geocoder();
}

function calculateDistances() {
  var service = new google.maps.DistanceMatrixService();
  service.getDistanceMatrix(
    {
      origins: [origin1],
      destinations: [destinationA],
      travelMode: google.maps.TravelMode.DRIVING,
      unitSystem: google.maps.UnitSystem.IMPERIAL,
      avoidHighways: false,
      avoidTolls: false
    }, callback);

}

function callback(response, status) {
  if (status != google.maps.DistanceMatrixStatus.OK) {
    //alert('Error was: ' + status);
  } else {
    var origins = response.originAddresses;
    var destinations = response.destinationAddresses;
    var outputDiv = document.getElementById('outputDiv');
    var timeDiv = document.getElementById('time-display');
    var hiddenDiv = document.getElementById('time');
    outputDiv.innerHTML = '';
    deleteOverlays();

    for (var i = 0; i < origins.length; i++) {
      var results = response.rows[i].elements;
      addMarker(origins[i], false);
      for (var j = 0; j < results.length; j++) {
        addMarker(destinations[j], true);
        outputDiv.innerHTML += origins[i] + ' to ' + destinations[j]
            + ': ' + results[j].distance.text + ' in '
            + results[j].duration.text + '<br>';
        timeDiv.innerHTML = 'Travel time: ' + results[j].duration.text
        hiddenDiv.value = convertToMS(results[j].duration.text)
        hiddenDiv.innerHTML = hiddenDiv.value;
      }
    }
        display_dictionary(genre);

  }
}

function addMarker(location, isDestination) {
  var icon;
  if (isDestination) {
    icon = destinationIcon;
  } else {
    icon = originIcon;
  }
  geocoder.geocode({'address': location}, function(results, status) {
    if (status == google.maps.GeocoderStatus.OK) {
      bounds.extend(results[0].geometry.location);
      map.fitBounds(bounds);
      var marker = new google.maps.Marker({
        map: map,
        position: results[0].geometry.location,
        icon: icon
      });
      markersArray.push(marker);
    } else {
      alert('Geocode was not successful for the following reason: '
        + status);
    }
  });
}

function convertToMS(timeString) {
  var stringArray = timeString.split(" ")
  var seconds = 0;
  var onHours = false
  if (stringArray.length == 4) {
    onHours = true;
  }
  for (index in stringArray) {
    var num = parseInt(stringArray[index])
    if (!isNaN(num) && onHours) {
      seconds = num * 3600;
      onHours = false;
    }
    else if (!isNaN(num)) {
      seconds = seconds + num * 60;
    }
  }
  return seconds * 1000;
}
function createPlaylist(username, name) {
  console.log('createPlaylist', username, name);
  var url = 'https://api.spotify.com/v1/users/' + username +
    '/playlists';
  $.ajax(url, {
    method: 'POST',
    data: JSON.stringify({
      'name': name,
      'public': false
    }),
    dataType: 'json',
    headers: {
      'Authorization': 'Bearer ' + authorizationSpotify,
      'Content-Type': 'application/json'
    },
    success: function(r) {
      console.log('create playlist response', r);
      globalPlaylistID = r.id;
      callback(r.id);
    },
    error: function(r) {
      callback(null);
    }
  });
}

function addTracksToPlaylist(username, playlist, tracks) {
  console.log('addTracksToPlaylist', username, playlist, tracks);
  console.log('tracks.join gives me '+ tracks.join(',spotify%3Atrack%3A'));
  var url = 'https://api.spotify.com/v1/users/' + username + '/playlists/' + playlist +'/tracks?uris=spotify%3Atrack%3A' + tracks.join(',spotify%3Atrack%3A');
  $.ajax(url, {
    method: 'POST',
    data: JSON.stringify(tracks),
    dataType: 'json',
    headers: {
      'Authorization': 'Bearer ' + authorizationSpotify,
      'Content-Type': 'application/json'
    },
    success: function(r) {
      console.log('add track response', r);
      callback(r.id);
console.log('assigning embedURL to ' +globalPlaylistID);
    embedURL += globalPlaylistID;
    console.log('so the embedURL is '+ embedURL);
    document.getElementById("playlist").innerHTML='<iframe src="'+embedURL+'"style="width:490px; height:550px;" frameborder="0" allowtransparency="true"></iframe>';
    
    },
    error: function(r) {
      callback(null);
    }
  });
}
function create_playlist(playlistName){
  console.log('about to call ajax');
  $.ajax({
    url: 'https://api.spotify.com/v1/users/journe-makebu/playlists', 
    method: 'POST',
    data: JSON.stringify({
      'name': playlistName,
      'public': false
    }),
    dataType: 'json',
        contentType: "application/json; charset=utf-8",
    headers: {
      'Authorization': 'Bearer ' + authorizationSpotify,
      'Content-Type': 'application/json'
    },
    success: function(r) {
      console.log('create playlist response', r);
      console.log('this playlistID is ' + r.id + " for this r creation " + r);
      globalPlaylistID = r.id;
    },
    error: function(r) {
      console.log('we failed');
      console.log('for this r creation ' + r);
    }
  });console.log('we made the json call');
}

function add_track(playlistID, trackName){
  var trackID = trackName;
  console.log('trackID is ' + trackID);
  console.log('about to call ajax a second time');
  $.ajax({
    url: 'https://api.spotify.com/v1/users/journe-makebu/playlists/' + playlistID + '/tracks?uris=spotify%3Atrack%3A' + encodeURIComponent(trackID),
    method: 'POST',
    data: JSON.stringify(trackID),
    dataType: 'json',
    contentType: "application/json; charset=utf-8",
    headers: {
      'Authorization': 'Bearer ' + authorizationSpotify,
      'Content-Type': 'application/json'
    },
    statusCode: {
        500: function () {
            alert('Fail!');
        }
    },
    success: function(r) {
      console.log('create track response', r);
      console.log('for this r track success '+ r.id);
    },
    error: function(r) {
      console.log('we failed');
      console.log('for this r track ' + r.id);
    }
  });console.log('we added the track call');
}

function display_dictionary(genre){
    var myjson;
    var blah = genre;
    
    $.getJSON("https://api.spotify.com/v1/search?query=track%3A%22" + blah + "%22&offset=0&limit=50&type=track", function(json){
        myjson = json;
        console.log(myjson);

    counter = 0;
    songsAdded = 0;
    iteration = 0;
    tripLength = document.getElementById('time').innerText;
    for(i = 0; i < 100; i++){
        current = Math.floor(Math.random() * 49);
        console.log('current is ' + current);
        if(counter + myjson.tracks.items[current].duration_ms > tripLength){
            iteration = i;
        }
        else{
          console.log('adding track to playlistId, ' + globalPlaylistID);
          tempArray[i] = myjson.tracks.items[current].id;
          console.log('we just added to the tempArray this element: ' + tempArray[i]);
          console.log('current song is ' + myjson.tracks.items[current].id + ' with current being ' + current);
            counter += myjson.tracks.items[current].duration_ms;
            console.log('the counter is ' + counter + ' the duration of the song is ' + myjson.tracks.items[current].duration_ms);
            songsAdded++;
            iteration = i;
        }
    }
    var tracksArray = new Array(songsAdded-1);
    for(i = 0; i < songsAdded-1; i++){
      tracksArray[i] = tempArray[i];
      console.log('tracksarray is now ' + tracksArray);
    }
    addTracksToPlaylist('journe-makebu', globalPlaylistID, tracksArray);
    console.log("the total song times add up to " + counter + " having added " + songsAdded + " songs and having gone through " + iteration + " songs when the length of the trip is " + tripLength);
    });
}



function deleteOverlays() {
  for (var i = 0; i < markersArray.length; i++) {
    markersArray[i].setMap(null);
  }
  markersArray = [];
}

google.maps.event.addDomListener(window, 'load', initialize);