'strict mode';

const geocoderURL = 'https://maps.googleapis.com/maps/api/geocode/json';

const googlePlacesAPIURL = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json';

const googleAPIKey = 'AIzaSyB1wyBz2adyJzK2rAh5LnREqIAwDCmy8Xs';

const paleoURL = 'https://paleobiodb.org/data1.2/colls/list.json';

let map = '';
let userSearchAddress = '';
let userSearchCENTERCoords = '';
let userSearchRadius =''; //miles
let radiusMeters = '';
let geocoder = new google.maps.Geocoder();
let fossilDataArray = [];
let parkDataArray = [];
let topFiveParks = [];

function displayMoreInfoParks(event){
  $('#results.moreInfo').remove();
  $(this).addClass('testingBox');
  $('#map_section').hide();
  $('#searchForm').hide();
  $('#results_moreInfo').append("<div class='moreInfoExitButton role='button' value='exit'>Take me back to the map!></button><h1>Let's see if this works!</p>");
}

function parksInfoWindowContent(object){
  return `<div class='markerContent'>
  <h1 class="fossilHeading">${object.mapsData.name}</h1>
  <h2>${object.mapsData.vicinity}</h2>
  <h2>Fossil Collections Found Near the Area:</h2>
  <p>Learn more...</p></div>`
}

function createParksMarkerListener(marker, object){
  let parksInfoWindow = new google.maps.InfoWindow({
    content: parksInfoWindowContent(object)
  });
  marker.addListener('click', function() {
      map.setZoom(8);
      map.setCenter(marker.getPosition());
    parksInfoWindow.open(map, marker);
  });
}

function createParkMarker(object){
  let newLocation = new google.maps.LatLng(object.mapsData.geometry.location.lat(), object.mapsData.geometry.location.lng());
  let marker = new google.maps.Marker({
    position: newLocation,
    title: `${object.mapsData.name}`,
    icon:'http://maps.google.com/mapfiles/ms/icons/green-dot.png'
  });
  marker.setMap(map);
  createParksMarkerListener(marker, object);
}

function displayRecommendedPark(){
  topFiveParks.forEach(object=>{
    createParkMarker(object);
  });
 if(topFiveParks[0].fossilData.length === 0){
    $('.recommendedPark').html("<p>Hmm, fossil collecting looks sparse in this area! Try increasing your search radius to find more fossil occurences, or see below for local parks.</p>");
  }
  else{
    $('#results').append("<div class='results_text'><p>Here are our recommended local parks for fossil collecting, click below or on the markers to learn more:</p></div>");
    $('#results').append(`<div class='recommendedPark'></div>`);
    topFiveParks.forEach(object=>{
      if(object.fossilData.length > 0){
        $('.recommendedPark').append(`<a href='javascript:displayMoreInfoParks(result_block${topFiveParks.indexOf(object)})' class='result_block result_block${topFiveParks.indexOf(object)}'><h1>${object.mapsData.name}</h1><h2>${object.mapsData.vicinity}</h2><h2>Fossil Collections Found Near the Area: ${object.fossilData.length}</h2><p>See more...</p></a>`);
      }
      else{
        $('.recommendedPark').append(`<a href='javascript:displayMoreInfoParks(result_block_noFossil${topFiveParks.indexOf(object)})'class='result_block_noFossil result_block_noFossil(${topFiveParks.indexOf(object)})'><h1>${object.mapsData.name}</h1><h2>${object.mapsData.vicinity}</h2></a>`);
      }
  });
  }
  createMoreInfoListener();
}

function findRecommendedParks(){
  console.log(parkDataArray);
  if(topFiveParks.length ===0){
  for(let i=0; i<5; i++){
    topFiveParks.push(parkDataArray[i]);
  }
  }
  for(let i=1; i < parkDataArray.length; i++){
    for(let a=0; a< 5; a++){
      if(parkDataArray[i].fossilData.length > topFiveParks[a].fossilData.length){
        topFiveParks.splice(a, 0, parkDataArray[i]);
        topFiveParks.splice(5, 1);
        break;
      }
    }
  }
  displayRecommendedPark();
}

function findFossilsNearParks(){
  parkDataArray.forEach(object=>{
    object.fossilData = [];
    fossilDataArray.forEach(item =>{
        let fossilLocation = new google.maps.LatLng(item.lat, item.lng);
        let parklocation = new google.maps.LatLng(object.mapsData.geometry.location.lat(), object.mapsData.geometry.location.lng());
        if(radiusMeters < 32000){
          if(google.maps.geometry.spherical.computeDistanceBetween (fossilLocation, parklocation) <= 1600){
          object.fossilData.push(item);
        }
        }
        if(radiusMeters >= 32000){
          if(google.maps.geometry.spherical.computeDistanceBetween (fossilLocation, parklocation) <= 4000){
          object.fossilData.push(item);
        }
        }
        if(radiusMeters >= 80000){
          if(google.maps.geometry.spherical.computeDistanceBetween (fossilLocation, parklocation) <= 8500){
          object.fossilData.push(item);
        }
        }
       /* if(containsLocation(fossilLocation, object.polygonData)){
          makeFossilMarker_PUBLIC(fossilLocation);
          updateDataArray(object, item);
        }
        else{
          makeFossilMarker_PRIVATE(fossilLocation);
        }*/
    });
  });
  findRecommendedParks();
}

function defineParkResults(data){
  let iterationCheck = parkDataArray.length;
  data.forEach(object => {
      let newObject = {};
      newObject.mapsData = object;
      parkDataArray.push(newObject);
    });
  if(iterationCheck !== 0 && parkDataArray.length >= iterationCheck){
    findFossilsNearParks();
  }
}

function nearbySearchParks(searchQuery){
  let service = new google.maps.places.PlacesService(map);
  service.nearbySearch(searchQuery, defineParkResults);
}

function getParksData_best(object){
  let sw = new google.maps.LatLng({lat: object.BoxCoords[3].lat, lng: object.BoxCoords[3].lng});
  let ne = new google.maps.LatLng({lat: object.BoxCoords[1].lat, lng: object.BoxCoords[1].lng});
  let bounds = new google.maps.LatLngBounds(sw, ne);
  let searchQuery = {
    bounds: bounds,
    type: 'park',
    key: googleAPIKey
    };
  nearbySearchParks(searchQuery);
}

function findPublicParks(bestSearchArea, secondBestSearchArea){
getParksData_best(bestSearchArea)
getParksData_best(secondBestSearchArea);
}

function containsLocation(fossilLocation, polygon){
  return google.maps.geometry.poly.containsLocation(fossilLocation, polygon);
}

function findBestLandAreas(searchData){
  let maxCount = 0;
  let maxCountIndex = 0;
  let secondMaxCount = 0;
  let secondMaxCountIndex = 0;
  for(let i=0; i <searchData.length; i++){
    if(searchData[i].fossilCount >= maxCount){
        maxCount = searchData[i].fossilCount;
        maxCountIndex = i;
    }
    else if(searchData[i].fossilCount >= secondMaxCount){
      secondMaxCount = searchData[i].fossilCount;
      secondMaxCountIndex = i;
    }
  }
  findPublicParks(searchData[maxCountIndex], searchData[secondMaxCountIndex]);
}

function findFossilSaturation(searchData){
  searchData.forEach(object=>{
    object.fossilCount = 0;
    fossilDataArray.forEach(item =>{
        let fossilLocation = new google.maps.LatLng(item.lat, item.lng);
        if(containsLocation(fossilLocation, object.polygonData)){
          object.fossilCount += 1;
        }
      });
  });
  findBestLandAreas(searchData)
}

function updateLat(originalCenter, distance){
  let radiusEarch = 6371000.0;
  let new_latitude  = originalCenter.lat  + (distance / radiusEarch) * (180 / Math.PI);
  return new_latitude;
}

function updateLon(originalCenter, distance){
  let radiusEarch = 6371000.0;
  let new_longitude = originalCenter.lng + (distance / radiusEarch) * (180 / Math.PI) / Math.cos(originalCenter.lat * Math.PI/180);
  return new_longitude;
}

function createNewSearchBoxes(centerCoords, radius, searchBounds){
  let newBoxes = [];
  let middleLngCoordW = updateLon(centerCoords, -radius);
  let middleLngCoordE = updateLon(centerCoords, radius);
  for(let i = 0; i <=7; i++){
    if(i===0){ //NWOutside SearchBox
      newBoxes.push({BoxCoords: [
        {lat: searchBounds.maxLat, lng: searchBounds.minLng},
        {lat: searchBounds.maxLat, lng: middleLngCoordW},
        {lat: centerCoords.lat, lng: middleLngCoordW},
        {lat: centerCoords.lat, lng: searchBounds.minLng}
        ]});
    }
    else if(i===1){ //NWInside SearchBox
      newBoxes.push({BoxCoords: [
        {lat: searchBounds.maxLat, lng: middleLngCoordW},
        {lat: searchBounds.maxLat, lng: centerCoords.lng},
        {lat: centerCoords.lat, lng: centerCoords.lng},
        {lat: centerCoords.lat, lng: middleLngCoordW}
        ]});
    }
    else if(i===2){ //NEInside SearchBox
      newBoxes.push({BoxCoords: [
        {lat: searchBounds.maxLat, lng: centerCoords.lng},
        {lat: searchBounds.maxLat, lng: middleLngCoordE},
        {lat: centerCoords.lat, lng: middleLngCoordE},
        {lat: centerCoords.lat, lng: centerCoords.lng}
        ]});
    }
    else if(i===3){ //NEOutside SearchBox
      newBoxes.push({BoxCoords: [
        {lat: searchBounds.maxLat, lng: middleLngCoordE},
        {lat: searchBounds.maxLat, lng: searchBounds.maxLng},
        {lat: centerCoords.lat, lng: searchBounds.maxLng},
        {lat: centerCoords.lat, lng: middleLngCoordE}
        ]});
    }
    else if(i===4){ //SEOutside SearchBox
      newBoxes.push({BoxCoords: [
        {lat: centerCoords.lat, lng: middleLngCoordE},
        {lat: centerCoords.lat, lng: searchBounds.maxLng},
        {lat: searchBounds.minLat, lng: searchBounds.maxLng},
        {lat: searchBounds.minLat, lng: middleLngCoordE}
        ]});
    }
    else if(i===5){ //SEInside SearchBox
      newBoxes.push({BoxCoords: [
        {lat: centerCoords.lat, lng: centerCoords.lng},
        {lat: centerCoords.lat, lng: middleLngCoordE},
        {lat: searchBounds.minLat, lng: middleLngCoordE},
        {lat: searchBounds.minLat, lng: centerCoords.lng}
        ]});
    }
    else if(i===6){ //SWInside SearchBox
      newBoxes.push({BoxCoords: [
        {lat: centerCoords.lat, lng: middleLngCoordW},
        {lat: centerCoords.lat, lng: centerCoords.lng},
        {lat: searchBounds.minLat, lng: centerCoords.lng},
        {lat: searchBounds.minLat, lng: middleLngCoordW}
        ]});
    }
    else if(i===7){ //SWOutside SearchBox
      newBoxes.push({BoxCoords: [
        {lat: centerCoords.lat, lng: searchBounds.minLng},
        {lat: centerCoords.lat, lng: middleLngCoordW},
        {lat: searchBounds.minLat, lng: middleLngCoordW},
        {lat: searchBounds.minLat, lng: searchBounds.minLng}
        ]});
    }
  }
  return newBoxes;
}

function splitMapSearch(){
  let halfRadius = radiusMeters/2;
  let searchBox = getBoundingBox(userSearchCENTERCoords, radiusMeters);
 /* let northernMostLat = searchBox.maxLat;
  let southernMostLat = serachBox.minLat;
  let westernMostLng = searchBox.minLng;*/
  let newSearchBoxes = createNewSearchBoxes(userSearchCENTERCoords, halfRadius, searchBox);
  findFossilSaturation(testBoxShape(newSearchBoxes));
  //findPublicParks(newCenterPointsSearch, halfRadius);
}

function getBoundingBox(center, distance){
  let boundingBox = {};
  boundingBox.minLat = updateLat(center, -distance);
  boundingBox.maxLat = updateLat(center, distance);
  boundingBox.minLng = updateLon(center, -distance);
  boundingBox.maxLng = updateLon(center, distance);
  return boundingBox;
}

function testBoxShape(boxArray){
  boxArray.forEach(object => {
    let newParkPolygon = new google.maps.Polygon({
          paths: object.BoxCoords,
          map: map,
          fillOpacity: 0,
          strokeOpacity: 0
        });
    object.polygonData = newParkPolygon;
    });
  return boxArray;
}

function fossilInfoWindowContent(fossilData){
  console.log(fossilData);
  return `<div class='fossilMarkerContent'><h1 class="fossilHeading">${fossilData.oid}</h1>
  <h2>${fossilData.oei}</h2>
  <li class='fossilMarkerContentList'>
  <ul>Geologic Time Range: ${fossilData.eag}-${fossilData.lag} Ma</ul>
  <ul>Number of Fossils Collected: ${fossilData.noc}</ul>
  <ul>Found in formation: ${fossilData.sfm}</ul></li>
  </div>`
}

function createFossilMarkerListener(marker, object){
  let fossilInfoWindow = new google.maps.InfoWindow({
    content: fossilInfoWindowContent(object)
  });
  marker.addListener('click', function() {
      map.setZoom(13);
      map.setCenter(marker.getPosition());
    fossilInfoWindow.open(map, marker);
  });
}

function makeFossilMarker(item, lat, lng){
  let loc = new google.maps.LatLng(lat, lng)
  let marker = new google.maps.Marker({
    position: loc,
    title: `Fossil Occurence
    Geologic Time Range: ${item.oei}`,
  });
  marker.setMap(map);
  createFossilMarkerListener(marker, item);
}

function refineFossilData(data){
    data.records.forEach(item => {
      fossilDataArray.push(item);
      makeFossilMarker(item, item.lat, item.lng);
  });
  splitMapSearch();
  //findPublicParks();
}

function findFossilData(searchCenter, searchRadius){
  let searchBox = getBoundingBox(searchCenter, searchRadius);
  let query = {
    lngmin: searchBox.minLng,
    lngmax: searchBox.maxLng,
    latmin: searchBox.minLat,
    latmax: searchBox.maxLat,
    show: 'coords,class'
  };
  $.getJSON(paleoURL, query, refineFossilData);
}

function initializeMap(userLocation){
  let zoomLevel = '';
  if(userSearchRadius <= 5){
    zoomLevel = 11;
  }
  else if(userSearchRadius <= 10 ){
    zoomLevel = 10;
  }
  else if(userSearchRadius <= 25){
    zoomLevel = 9;
  }
  else if(userSearchRadius <= 50){
    zoomLevel = 8;
  }
  else if(userSearchRadius <= 75){
    zoomLevel = 7;
  }
  let mapOptions = {
      center: userLocation,
      zoom: zoomLevel
  };
  map = new google.maps.Map(document.getElementById('mapDisplay'), mapOptions);
}

function warningMessage(searchTerm){
  alert('You put in an incorrect address!');
}

function refineUserSearch(data){
  if(data.status === "ZERO_RESULTS"){
    warningMessage(userSearchAddress);
  }
  else {
  userSearchCENTERCoords = data.results[0].geometry.location;
  radiusMeters = userSearchRadius*1609.34;
  initializeMap(userSearchCENTERCoords);
  findFossilData(userSearchCENTERCoords, radiusMeters);
  }
}

function addresstoCoordinates(textAddress){
  let query = {
    address: textAddress,
    key: googleAPIKey
  };
  $.getJSON(geocoderURL, query, refineUserSearch);
}

function stylingChangesandPageReset(){
  $('fieldset').addClass('searchFormFieldset');
  $("button[type='submit']").addClass('submitButton');
  $('.introduction_firstPage').hide();
  $('.recommendedPark').empty();
  $('input[name="searchInputRadius"]').val('');
}

function searchFormSubmitListener(){
  $('.userAddressSearch').submit(event => {
    event.preventDefault();
    fossilDataArray = [];
    parkDataArray = [];
    topFiveParks = [];
    userSearchAddress = $('input[name="searchInput"]').val();
    userSearchRadius = $('input[name="searchInputRadius"]').val().split(" ")[0];
    addresstoCoordinates(userSearchAddress);
    stylingChangesandPageReset();
  });
}

$(searchFormSubmitListener);