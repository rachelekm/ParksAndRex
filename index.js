'strict mode';

/*Notes:
  //don't hide moreInfo page, display info for scrolling default is first entry, so map can be available. when new box is clicked CODED but need to try
  //change button box so that it displays park title, image from google, and fossil collection #. CODED but need to try
  //change listener so that google maps creates a circle around park to show it's reach and zooms in on the marker CODED
  //get parsed text for mediaWiki instead of framebox
  //create smaller fossil icons and more definitive park icons. maybe poppu window exlpaining icons?? what if!! I hide all fossils and include a toggle at the top of rsults "to show all fossil occurenes"
}*/

const geocoderURL = 'https://maps.googleapis.com/maps/api/geocode/json';
const googlePlacesAPIURL = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json';
const googleAPIKey = 'AIzaSyB1wyBz2adyJzK2rAh5LnREqIAwDCmy8Xs';
const paleoURL = 'https://paleobiodb.org/data1.2/colls/list.json';
const wikiAPIURL = 'https://en.wikipedia.org/w/api.php';

let map = '';
let userSearchAddress = '';
let userSearchCENTERCoords = '';
let userSearchRadius =''; //miles
let radiusMeters = '';
let geocoder = new google.maps.Geocoder();
let fossilDataArray = [];
let parkDataArray = [];
let topFiveParks = [];
let wikiData = [];
let parkMarkersArray = [];

function wikiExitButtonListener(){
  $('#results_moreInfo').on('click', '.wikiBoxExitButton', function(event){ 
    $('.wikiBox').remove();
  }); 
}

function displayWikiData(pageID){
  $('.wikiInfoDisplay').append(`<div class='wikiBox'><button type='button' role='button' value='exit' class='wikiBoxExitButton'>X</button><iframe src="https://en.wikipedia.org/wiki?curid=${pageID}" name="wikiSummary" allowTransparency="true" scrolling="yes" frameborder="0" >
    </iframe></div>`);
  wikiExitButtonListener();
}

function searchWikiData(event){
  let timePeriod = event.currentTarget.innerText.toString();
  for(let i=0; i < wikiData.length; i++){
    if(timePeriod == wikiData[i].title.toString()){
      displayWikiData(wikiData[i].pageid);
    }
  }
}

function displayWikiButtonInfo(index){
  let timePeriodsArray = topFiveParks[index].fossilData.map(object=>{
    if(object.oei.includes(' ')){
      return object.oei.split(' ')[1];
    }
    else{
      return object.oei;
    }
  });
  timePeriodsArray.forEach(item=>{
    for(let i=0; i<timePeriodsArray.length; i++){
      if(item == timePeriodsArray[i]){
        timePeriodsArray.splice(timePeriodsArray.indexOf(item), 1);
      }
    }
  });
  $('.wikiInfoDisplay').append(`<h2>Geologic Time Periods Represented: </h2>`);
  timePeriodsArray.forEach(item=>{
    $('.wikiInfoDisplay').append(`<button role='button' class='getWikiDataButton'>${item}</button>`);
  });
  $('#results_moreInfo').on('click', '.getWikiDataButton', searchWikiData);
}

function displayFossilInfo(index){
  topFiveParks[index].fossilData.forEach(item =>{
    let fossilLocation = '';
    if(item.aka){
      fossilLocation = item.aka+", "+item.nam;
    }
    else{
      fossilLocation = item.nam;
    }
  $('.fossilInfoDisplay').append(`<div class=fossilCollection><h3>Fossil Collection ${topFiveParks[index].fossilData.indexOf(item)+1}</h3><li class='fossilAttributes'>
    <ul>Found At or Near: ${fossilLocation}</ul>
    <ul>Geologic Time Interval: ${item.oei}</ul>
    <ul>Geologic Time Range: ${item.eag} - ${item.lag} millions years ago</ul></li></div>`);
});
}

function findParkObjectfromEventTarget(event){
  let parkName = event.currentTarget.childNodes[0].innerHTML.slice(3);
  let index = 0;
  topFiveParks.forEach(object=>{
    if(object.mapsData.name === parkName){
      index = topFiveParks.indexOf(object);
    }
  });
  return index;
}

function createCircleOnMap(object){
  let parkCenter = new google.maps.LatLng(object.mapsData.geometry.location.lat(), object.mapsData.geometry.location.lng());
  let parkCircle = new google.maps.Circle({
            strokeColor: '#F17D40',
            strokeOpacity: 0.6,
            strokeWeight: 2,
            fillColor: '#F17D40',
            fillOpacity: 0.5,
            center: parkCenter,
            radius: object.radiusMeters
          });
  object.parkCircle = parkCircle;
  parkCircle.setMap(map);
  map.setZoom(object.preferredZoom);
}

function refreshPageDesign(event){
  let parkIndex = findParkObjectfromEventTarget(event);
  map.setZoom(14);
  parkMarkersArray.forEach(object =>{
    if(object.title === topFiveParks[parkIndex].mapsData.name){
      if(object.parkCircle){
        topFiveParks.forEach(object=>{
        object.parkCircle.setMap(null);
        });
      }
      map.setCenter(object.getPosition());
      createCircleOnMap(topFiveParks[parkIndex]);
    }
  });
}

function resetSelectionBox(event){
  $('.recommendedPark').children('.result_block').removeClass('selectionBox');
  $('.recommendedPark').children('.result_block_noFossil').removeClass('selectionBox');
}

function displayMoreInfoParks(event){
  console.log(event);
  resetSelectionBox(event);
  $(this).addClass('selectionBox');
  $('#results.moreInfo').empty().show();
  $('#results_moreInfo').html("<section class='moreInfoShow'></section>");
  if(event.currentTarget.className === 'result_block selectionBox'){
    $('.moreInfoShow').append("<div class='summaryInfo'>"+event.currentTarget.innerHTML+"</div><div class=wikiInfoDisplay></div><div class=fossilInfoDisplay></div>");
    let parkIndex = findParkObjectfromEventTarget(event);
    displayWikiButtonInfo(parkIndex);
    displayFossilInfo(parkIndex);
   }
  else if(event.currentTarget.className === 'result_block_noFossil selectionBox'){
    $('.moreInfoShow').append("<div class='summaryInfo'>"+event.currentTarget.innerHTML+"</div><div class=ParkInfoDisplay></div>");
    //displayParksWikiInfo(event);
  }
  refreshPageDesign(event);
}


function defaultParkSelection(object){
  $('.recommendedPark button:first').addClass('selectionBox');
  $('#results_moreInfo').html("<section class='moreInfoShow'></section>");
  if(object.fossilData.length > 0){
    $('.moreInfoShow').append(`<div class='summaryInfo'><h1 class='ParkHeading'>${topFiveParks.indexOf(object)+1}. ${object.mapsData.name}</h1>
    <h2>${object.mapsData.vicinity}</h2>
    <h2>Fossil Collections Found Near the Area: ${object.fossilData.length}</h2></div><div class=wikiInfoDisplay></div><div class=fossilInfoDisplay></div>`);
    displayWikiButtonInfo(0);
    displayFossilInfo(0);
   }
  else {
  $('.moreInfoShow').append(`<div class='summaryInfo'><h1 class='ParkHeading'>${topFiveParks.indexOf(object)+1}. ${object.mapsData.name}</h1>
    <h2>${object.mapsData.vicinity}</h2></div><div class=ParkInfoDisplay></div>`);
  //displayParksWikiInfo(event);
  }
}

function showFossilMarkers(event){
  console.log(event);
  if(event.currentTarget.attributes[2].value === 'false'){
    $(this).attr('aria-checked', 'true');
    fossilDataArray.forEach(item =>{
    item.fossilMarker.setMap(map);
  });
  }
  else {
    $(this).attr('aria-checked', 'false');
    fossilDataArray.forEach(item =>{
    item.fossilMarker.setMap(null);
  });
  }

}

function parksInfoWindowContent(object){
  return `<div class='markerContent'>
  <h1 class="fossilHeading">${topFiveParks.indexOf(object)+1}. ${object.mapsData.name}</h1>
  <h2>${object.mapsData.vicinity}</h2>
  <h2>Fossil Collections Found Near the Area: ${object.fossilData.length}</h2></div>`
}

function createParksMarkerListener(marker, object){
  let parksInfoWindow = new google.maps.InfoWindow({
    content: parksInfoWindowContent(object)
  });
  marker.addListener('click', function(event) {
      map.setZoom(12);
      map.setCenter(marker.getPosition());
    parksInfoWindow.open(map, marker);
  });
  $(parksInfoWindow).on();
}

function createParkMarker(object){
  let newLocation = new google.maps.LatLng(object.mapsData.geometry.location.lat(), object.mapsData.geometry.location.lng());
  let iconImage = {
    url: 'https://i.imgur.com/t8OR4pz.png?1',
    scaledSize: new google.maps.Size(50, 50),
    origin: new google.maps.Point(0,0), // origin
    //anchor: new google.maps.Point(0, 0) // anchor
  };
  let marker = new google.maps.Marker({
    position: newLocation,
    title: `${object.mapsData.name}`,
    icon: iconImage,
    customInfo: `${object.mapsData.name}`
  });
  marker.setMap(map);
  parkMarkersArray.push(marker);
  createParksMarkerListener(marker, object);
}

function displayRecommendedPark(){
  topFiveParks.forEach(object=>{
    createParkMarker(object);
  });
 if(topFiveParks[0].fossilData.length === 0){
    $('#results').html("<p>Hmm, fossil collecting looks sparse in this area! Try increasing your search radius to find more fossil occurences.</p>div class='recommendedPark'></div>");
    topFiveParks.forEach(object=>{
        $('.recommendedPark').append(`<button role='button' class='result_block_noFossil'><h1>${topFiveParks.indexOf(object)+1}. ${object.mapsData.name}</h1></button>`);
        //<img src='${object.mapsData.img[0]}' alt='Image of ${object.mapsData.name}>
      });
  }
  else{
    $('#results').html("<div class='results_text'><legend>VIEW FOSSIL DISCOVERY SITES:   <span class='slider_background'><input type='checkbox' name='showMoreFossilsToggle' aria-checked='false'><span class='slider'></span></span></legend></div><div class='recommendedPark'></div>");
    topFiveParks.forEach(object=>{
      console.log(object);
      if(object.fossilData.length > 0){
        if(topFiveParks.indexOf(object)===0){
          $('.recommendedPark').append(`<button role='button' class='result_block'><img src='https://i.imgur.com/MDdBxCE.png?1' class='FirstParkResultLogo' alt='Website logo image for the first result'><h1>${topFiveParks.indexOf(object)+1}. ${object.mapsData.name}</h1><h2>Fossil Collections Found Near the Area: ${object.fossilData.length}</h2></button>`);
          defaultParkSelection(object);
          $('#results').on('click', '.result_block', displayMoreInfoParks);
        }
        else {
          $('.recommendedPark').append(`<button role='button' class='result_block'><h1>${topFiveParks.indexOf(object)+1}. ${object.mapsData.name}</h1><h2>Fossil Collections Found Near the Area: ${object.fossilData.length}</h2></button>`);
        }
      }
      else{
        $('.recommendedPark').append(`<button role='button' class='result_block_noFossil'><h1>${topFiveParks.indexOf(object)+1}. ${object.mapsData.name}</h1></button>`);
        if(topFiveParks.indexOf(object)===0){
          defaultParkSelection(object);
          $('#results').on('click', '.result_block_noFossil', displayMoreInfoParks);
        }
      }
  });
  }
  $('#results').on('click', "input[name='showMoreFossilsToggle']", showFossilMarkers);
}

function findRecommendedParks(){
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
          if(google.maps.geometry.spherical.computeDistanceBetween (fossilLocation, parklocation) <= 600){
            object.radiusMeters = 600;
            object.preferredZoom = 15;
            object.fossilData.push(item);
        }
        }
        if(radiusMeters >= 32000){
          if(google.maps.geometry.spherical.computeDistanceBetween (fossilLocation, parklocation) <= 2500){
            object.radiusMeters = 2500;
            object.preferredZoom = 13;
            object.fossilData.push(item);
        }
        }
        if(radiusMeters >= 80000){
          if(google.maps.geometry.spherical.computeDistanceBetween (fossilLocation, parklocation) <= 5000){
            object.radiusMeters = 5000;
            object.preferredZoom = 12;
            object.fossilData.push(item);
        }
        }
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
  return `<div class='fossilMarkerContent'><h1 class="fossilHeading">Fossil Collection</h1>
  <h2>Geologic Time Period: ${fossilData.oei}</h2>
  <li class='fossilMarkerContentList'>
  <ul>Geologic Time Range: ${fossilData.eag} - ${fossilData.lag} Ma</ul>
  <ul>Number of Fossils Collected: ${fossilData.noc}</ul>
  <ul>Found in formation: ${fossilData.sfm}</ul></li>
  </div>`
}

function createFossilMarkerListener(marker, object){
  let fossilInfoWindow = new google.maps.InfoWindow({
    content: fossilInfoWindowContent(object),
    maxWidth: 200,
  });
  marker.addListener('click', function() {
      map.setZoom(14);
      map.setCenter(marker.getPosition());
    fossilInfoWindow.open(map, marker);
  });
  map.addListener(map, "click", function(event) {
    fossilInfoWindow.close();
});
}

function makeFossilMarker(item, lat, lng){
  let iconImage = {
    url: 'https://i.imgur.com/Fl7JnPW.png?1',
    scaledSize: new google.maps.Size(25, 35),
    origin: new google.maps.Point(0,0),
    anchor: new google.maps.Point(0, 0),
    opacity: 0.8
  };
  let loc = new google.maps.LatLng(lat, lng)
  let marker = new google.maps.Marker({
    position: loc,
    title: `Fossil Occurence
    Geologic Time Range: ${item.oei}`,
    icon: iconImage
  });
  item.fossilMarker = marker;
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

function storeWikiData(data){
  data.query.categorymembers.forEach(object=>{
    wikiData.push(object);
  });
}

function getWikiData(){
    let searchQuery = {
    origin: '*',
    action: 'query',
    list: 'categorymembers',
    cmtitle: `category:Geological ages`,
    cmlimit: 78,
    format: 'json'
  };
  $.getJSON(wikiAPIURL, searchQuery, storeWikiData);
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
  getWikiData();
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
  $('#map_section').show();
  $('body').removeClass('firstpageBackground');
  $('.introduction_firstPage').hide();
  $('#results').empty();
  $('#results_moreInfo').empty();
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