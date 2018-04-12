
'strict mode';

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
let wikiData = [];

function toggleWikiInfoBox(event){
  let timePeriodEvent = event.currentTarget.innerHTML
  $(`.${timePeriodEvent}`).toggle();
}

function wikiBackupSearch(searchTerm){
    let searchQuery = {
    origin: '*',
    action: 'query',
    prop: 'extracts',
    format: 'json',
    exintro: 0,
    titles: searchTerm
  };
  $.getJSON(wikiAPIURL, searchQuery, displayWikiData)
  .fail(function(){
    errorPage();
  });
}

function refinePageTitle(title){
  if(title.includes(' ')){
    let strings = title.split(' ');
    if(strings[0] !== "Early"){
      return strings[0];
    }
    else{
      return strings[1];
    }
  }
  else{
    return title;
  }
}

function displayWikiBackup(searchTerm){
  $('.wikiInfoDisplay').append(`<button role='button' class='getWikiDataButton'>${searchTerm}</button><div class='wikiBox ${searchTerm}' hidden><div class='wikiBoxArrow'><img src="https://i.imgur.com/NDE1kFX.png?1" alt="Button image to exit the Wikipedia summary"></div><div class='wikiBoxText'><p>Whoops, this time period does not have a page.</p><a href='https://en.wikipedia.org/wiki/Geologic_time_scale' target='_blank'>Read more about the geologic time scale...</a></div></div>`);
}


function displayWikiData(data){
  let newObject= data.query.pages;
  let pageTitle = refinePageTitle(newObject[Object.keys(newObject)[0]].title);
  let wikiExtract = newObject[Object.keys(newObject)[0]].extract;
  if(wikiExtract == '' || newObject[-1]){
    displayWikiBackup(pageTitle);
  }
  else{
    if(wikiExtract.includes('may refer to:')){
      displayWikiBackup(pageTitle);
    }
    else if(wikiExtract.includes('geologic') || wikiExtract.includes('epoch') || wikiExtract.includes('geological')){
      let wikiLinkID = newObject[Object.keys(newObject)[0]].pageid;
      $('.wikiInfoDisplay').append(`<button role='button' class='getWikiDataButton'>${pageTitle}</button><div class='wikiBox ${pageTitle}' hidden><div class='wikiBoxArrow'><img src="https://i.imgur.com/NDE1kFX.png?1" alt="Button image to exit the Wikipedia summary"></div><div class='wikiBoxText'>${wikiExtract}<a href='https://en.wikipedia.org/wiki?curid=${wikiLinkID}' target='_blank'>Read more...</a></div></div>`);
    }
    else {
      displayWikiBackup(pageTitle);
    }
  }
}


function wikiExtractSearch(pageID){
  let searchQuery = {
    origin: '*',
    action: 'query',
    prop: 'extracts',
    format: 'json',
    exintro: 0,
    pageids: pageID
  };
  $.getJSON(wikiAPIURL, searchQuery, displayWikiData)
  .fail(function(){
    errorPage();
  });
}

function searchWikiData(timePeriod){
  let wikiCheck = '';
  for(let i=0; i < wikiData.length; i++){
    wikiCheck = 0;
    if(wikiData[i].title.includes(timePeriod)){
      wikiExtractSearch(wikiData[i].pageid);
      wikiCheck += 1;
      break;
    }
  }
  if(wikiCheck === 0){
    wikiBackupSearch(timePeriod);
  }
}

function displayWikiButtonInfo(index){
  let timePeriodsArray = parkDataArray[index].fossilData.map(object=>{
    if(object.oei.includes(' ')){
      return object.oei.split(' ')[1];
    }
    else{
      return object.oei;
    }
  });
  let finalArray = '';
  if(timePeriodsArray.length > 1){
    finalArray = timePeriodsArray.filter(function(item, pos, self) {
      return self.indexOf(item) == pos;
    });
  }
  else{
    finalArray = timePeriodsArray;
  }
  $('.wikiInfoDisplay').append(`<h1>Geologic Time Periods Represented</h1><p>How old are the fossils you'll find:</p>`);
  finalArray.forEach(item=>{
    searchWikiData(item);
  });
}

function showMoreFossilInfo(event){ 
  let fossilIteration = event.currentTarget.childNodes[1].innerHTML.split(' ')[2];
  $('.fossilCollection').next(`.${fossilIteration}`).toggle();
}

function displayFossilInfo(index){
  $('.fossilInfoDisplay').append('<h1>Fossil Collections Found:</h1>');
  let fossilIteration = 0;
  parkDataArray[index].fossilData.forEach(item =>{
    fossilIteration += 1;
    let fossilLocation = '';
    if(item.aka){
      fossilLocation = item.aka+", "+item.nam;
    }
    else{
      fossilLocation = item.nam;
    }
    $('.fossilInfoDisplay').append(`<div class='fossilCollection ${fossilIteration}'><img class='fossilIcon' src='https://i.imgur.com/ftuGfNv.png?1' alt='Fossil collection image link icon'><h3>Fossil Collection ${fossilIteration}</h3></div><ul class='${fossilIteration}' hidden>
      <li>Found At or Near: ${fossilLocation}</li>
      <li>Geologic Time Interval: ${item.oei}</li>
      <li>Geologic Time Range: ${item.eag} - ${item.lag} millions years ago</li></ul>`);
  });
  $('.fossilInfoDisplay').on('click', '.fossilCollection', showMoreFossilInfo);
}

function displayParksMoreInfo(object){
  let parkCenter = new google.maps.LatLng(object.mapsData.geometry.location.lat(), object.mapsData.geometry.location.lng());
  let userCenter = new google.maps.LatLng(userSearchCENTERCoords);
  let distanceFromSearch = google.maps.geometry.spherical.computeDistanceBetween(userCenter, parkCenter);
  $('.summaryInfo').append(`<div class='parksMoreInfo'><h2>Distance From You: ${Math.round((distanceFromSearch/1609.34), 3)} miles</h2></div>`);
  if(object.mapsData.opening_hours){
    let openText = 'Currently Closed';
    if(object.mapsData.opening_hours.open_now){
    openText = 'Open Now for Public';
    }
    $('.summaryInfo').append(`<h3>${openText}</h3>`);
  }
  $('.summaryInfo').append(`<h3>Rating: ${object.mapsData.rating}</h3>`);
}

function findParkObjectfromEventTarget(event){
  if(event.currentTarget.childNodes.length == 3){
    return 0;
  }
  else{
    return parseInt(event.currentTarget.firstChild.innerHTML.split('.')[0])-1;
  }
}

function createCircleOnMap(object){
  if(object.radiusMeters){
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
    map.setCenter(parkCenter);
    map.setZoom(object.preferredZoom);
  }
  else {
    let parkCenter = new google.maps.LatLng(object.mapsData.geometry.location.lat(), object.mapsData.geometry.location.lng());
    map.setCenter(parkCenter);
    map.setZoom(15);
  }
}

function refreshMapView(parkObject){
  parkDataArray.forEach(object =>{
    if(object.parkCircle){
    object.parkCircle.setMap(null);
    }
  });
  createCircleOnMap(parkObject);
}

function resetSelectionBox(event){
  $('.recommendedPark').children('.result_block').removeClass('selectionBox');
  $('.recommendedPark').children('.result_block_noFossil').removeClass('selectionBox');
  $('.recommendedPark').children('.result_block_noFossil_All').removeClass('selectionBox');
}

function displayMoreInfoParks(event){
  $('#results_moreInfo').show();
  $('#results_moreInfo').html("<button class='backToMapButton'></button><section class='moreInfoShow'></section>");
  let parkIndex = findParkObjectfromEventTarget(event);
  let parkObject = parkDataArray[parkIndex];
  updateParksSelectionDisplay(parkObject, parkIndex);
  if(event.currentTarget.className === 'result_block selectionBox'){
    if(event.currentTarget.childNodes.length === 3){
    $('.moreInfoShow').append(`<div class='summaryInfo'><h1>${event.currentTarget.childNodes[1].innerHTML.split('.')[1]}</h1><h2>${parkObject.mapsData.vicinity}</h2></div><div class=wikiInfoDisplay></div><div class=fossilInfoDisplay></div>`);
    }
    else {
    $('.moreInfoShow').append(`<div class='summaryInfo'><h1>${event.currentTarget.firstChild.innerHTML.split('.')[1]}</h1><h2>${parkObject.mapsData.vicinity}</h2></div><div class=wikiInfoDisplay></div><div class=fossilInfoDisplay></div>`);
    }
    displayWikiButtonInfo(parkIndex);
    displayFossilInfo(parkIndex);
   }
  else if(event.currentTarget.className === 'result_block_noFossil selectionBox' || event.currentTarget.className === 'result_block_noFossil_All selectionBox'){
    $('.moreInfoShow').append(`<div class='summaryInfo'><h1>${event.currentTarget.firstChild.innerHTML.split('.')[1]}</h1><h2>${parkObject.mapsData.vicinity}</h2></div><div class=ParkInfoDisplay></div>`);
    displayParksMoreInfo(parkObject);
  }
  refreshMapView(parkObject);
  $('html, body').animate({scrollTop: $('#results_moreInfo').offset().top
            }, 0);
}

function showFossilMarkers(event){
  if(event.currentTarget.attributes[3].value === 'false'){
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

function updateParksSelectionDisplay(object, index){
  resetSelectionBox();
  refreshMapView(object);
  if($('#results').find("input[name='showMoreFossilsToggle']").attr('aria-checked')==='false'){
    $('#results').find("input[name='showMoreFossilsToggle']").click();
  }
  $(`.recommendedPark button:nth-child(${index+1}`).addClass('selectionBox').focus();
}

function createParksMarkerListener(marker, object){
  marker.addListener('click', function(event) {
      map.setZoom(object.preferredZoom);
      map.setCenter(marker.getPosition());
      parkDataArray.forEach((parkObject, index) => {
        if(parkObject === object){
          updateParksSelectionDisplay(object, index);
        }
      });
  });
}

function createParkMarker(object){
  let newLocation = new google.maps.LatLng(object.mapsData.geometry.location.lat(), object.mapsData.geometry.location.lng());
  let iconImage = {
    url: 'https://i.imgur.com/t8OR4pz.png?1',
    scaledSize: new google.maps.Size(50, 50),
    origin: new google.maps.Point(0,0)
  };
  let marker = new google.maps.Marker({
    position: newLocation,
    title: `${object.mapsData.name}`,
    icon: iconImage,
    customInfo: `${object.mapsData.name}`
  });
  marker.setMap(map);
  object.mapMarker = marker;
  createParksMarkerListener(marker, object);
}

function displayRecommendedPark(){
  parkDataArray.forEach(object=>{
    createParkMarker(object);
  });
 if(parkDataArray[0].fossilData.length === 0){
    $('#results').html("<h2 class='noresultsText'>Hmm, fossil collecting looks sparse in this area! Increase your search radius to find more fossil occurences or see popular parks below:</h2><div class='recommendedPark'></div>");
    parkDataArray.forEach(object=>{
        $('.recommendedPark').append(`<button role='button' class='result_block_noFossil_All'><h1>${parkDataArray.indexOf(object)+1}. ${object.mapsData.name}</h1></button>`);
      });
  }
  else{
    $('#results').html("<div class='results_text'><legend>VIEW FOSSIL DISCOVERY SITES:   <label class='slider_background'><input type='checkbox' name='showMoreFossilsToggle' aria-label='moreFossilsToggle' aria-checked='false'><span class='slider'></span></label></legend></div><div class='clickMoreInstructions'>Click below to see more info:</div><div class='recommendedPark'></div>");
    parkDataArray.forEach(object=>{
      if(object.fossilData.length > 0){
        if(parkDataArray.indexOf(object)===0){
          $('.recommendedPark').append(`<button role='button' class='result_block'><img src='https://i.imgur.com/uFz2Zya.png?1' class='FirstParkResultLogo' alt='Logo image symbol for best match park'><h1>${parkDataArray.indexOf(object)+1}. ${object.mapsData.name}</h1><h2>Fossil Collections Found Near the Area: ${object.fossilData.length}</h2></button>`);
        }
        else {
          $('.recommendedPark').append(`<button role='button' class='result_block'><h1>${parkDataArray.indexOf(object)+1}. ${object.mapsData.name}</h1><h2>Fossil Collections Found Near the Area: ${object.fossilData.length}</h2></button>`);
        }
      }
      else{
        $('.recommendedPark').append(`<button role='button' class='result_block_noFossil'><h1>${parkDataArray.indexOf(object)+1}. ${object.mapsData.name}</h1><h2>Fossil Collections Found Near the Area: 0</br>Recommended based on local prominence</h2></button>`);
      }
  });
  }
  $('.recommendedPark button:first').focus();
}

//Sorting by fossil saturation, top 10 parks are displayed
function sortRecommendedParks(){
  parkDataArray.sort(function(a,b){
    return b.fossilData.length - a.fossilData.length;
  });
  parkDataArray.splice(10);
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
  sortRecommendedParks();
}

function defineParkResultsSecond(data, status){
  if(parkDataArray.length === 0 && status === 'ZERO_RESULTS'){
    errorPageNoParks();
  }
  else {
    data.forEach(object => {
      let newObject = {};
      newObject.mapsData = object;
      parkDataArray.push(newObject);
    });
    findFossilsNearParks();
  }
}

function defineParkResults(data){
  data.forEach(object => {
      let newObject = {};
      newObject.mapsData = object;
      parkDataArray.push(newObject);
  });
}

function nearbySearchParks(searchQuery, iteration){
  let service = new google.maps.places.PlacesService(map);
  if(iteration === 1){
    service.nearbySearch(searchQuery, defineParkResults);
  }
  else{
    service.nearbySearch(searchQuery, defineParkResultsSecond);
  }
}

function getParksData_best(object, iteration){
  let sw = new google.maps.LatLng({lat: object.BoxCoords[3].lat, lng: object.BoxCoords[3].lng});
  let ne = new google.maps.LatLng({lat: object.BoxCoords[1].lat, lng: object.BoxCoords[1].lng});
  let bounds = new google.maps.LatLngBounds(sw, ne);
  let searchQuery = {
    bounds: bounds,
    type: 'park',
    key: googleAPIKey
    };
  nearbySearchParks(searchQuery, iteration);
}

//Only searching for public parks in search boxes that yield highest fossil saturation
function findPublicParks(bestSearchArea, secondBestSearchArea){
getParksData_best(bestSearchArea, 1)
getParksData_best(secondBestSearchArea, 2);
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
  findBestLandAreas(searchData);
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

//To better diversify park results, split initial search into 8 smaller search sections
function splitMapSearch(){
  let halfRadius = radiusMeters/2;
  let searchBox = getBoundingBox(userSearchCENTERCoords, radiusMeters);
  let newSearchBoxes = createNewSearchBoxes(userSearchCENTERCoords, halfRadius, searchBox);
  findFossilSaturation(testBoxShape(newSearchBoxes));
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
  <ul class='fossilMarkerContentList'>
  <li>Geologic Time Range: ${fossilData.eag} - ${fossilData.lag} Ma</li>
  <li>Number of Fossils Collected: ${fossilData.noc}</li>
  <li>Found in formation: ${fossilData.sfm}</li></ul>
  </div>`
}

function createFossilMarkerListener(marker, object){
  let fossilInfoWindow = new google.maps.InfoWindow({
    content: fossilInfoWindowContent(object),
    maxWidth: 275,
  });
  object.infoWindow = fossilInfoWindow;
  marker.addListener('click', function() {
    fossilDataArray.forEach(item =>{
      item.infoWindow.close();
    });
      map.setCenter(marker.getPosition());
    fossilInfoWindow.open(map, marker);
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
    if(fossilDataArray.length == data.records.length){
      splitMapSearch();
    }
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
  $.getJSON(paleoURL, query, refineFossilData)
  .fail(function(){
    errorPage();
  });
}

//Used to define correct page ids for later display
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
  $.getJSON(wikiAPIURL, searchQuery, storeWikiData)
  .fail(function(){
    errorPage();
  });
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
      mapTypeControl: false,
      zoom: zoomLevel
  };
  map = new google.maps.Map(document.getElementById('mapDisplay'), mapOptions);
}

function errorPageNoParks(){
  if(fossilDataArray.length > 0){
    $('#results').html("<div class='results_text'><legend>VIEW FOSSIL DISCOVERY SITES:   <label class='slider_background'><input type='checkbox' name='showMoreFossilsToggle' aria-label='moreFossilsToggle' aria-checked='false'><span class='slider'></span></label></legend></div><h2 class='noresultsText'>Oh no! We could not find parks in this area. Explore fossil sites above or please try a new search for public parks.</h2>");
  }
  else{
    $('#results').html("<h2 class='noresultsText'>Oh no! We could not find parks in this area. Please try a new search.</h2>");
  }
}

function warningMessage(searchTerm){
  $('.searchForm').show();
  alert('You put in an incorrect address!');
}

function errorPage(){
    $('#map_section').hide();
    $('.introduction_firstPage').show();
    $('.errorPage').show().html('<h2>Oh no, looks like something went wrong on our end. Please try your search again.</h2>');
    $('#results').empty().hide();
    $('#results_moreInfo').empty().hide();
    $('.searchForm').removeClass('searchFormWindow');
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
  $.getJSON(geocoderURL, query, refineUserSearch)
  .fail(function(){
    errorPage();
  });
}

function stylingChangesandPageReset(){
  $('body').css('background-color', '#31523F');
  $('input[name="searchInputRadius"]').attr('placeholder', $('input[name="searchInputRadius"]').val());
  $('#map_section').show().children('iframe').attr('aria-label', 'Google Maps Display');
  $('.introduction_firstPage').hide();
  $('#results').empty().show();
  $('#results_moreInfo').empty().hide();
  $('input[name="searchInputRadius"]').val('');
  $('.searchForm').addClass('searchFormWindow');
}

function mainPageToggleListeners(){
  $('#results').on('click', "input[name='showMoreFossilsToggle']", showFossilMarkers);
  $('#results').on('click', '.result_block_noFossil', displayMoreInfoParks);
  $('#results').on('click', '.result_block_noFossil_All', displayMoreInfoParks);
  $('#results').on('click', '.result_block', displayMoreInfoParks);
  $('#results_moreInfo').on('click', '.getWikiDataButton', function(event){ 
    toggleWikiInfoBox(event);
  });
  $('#results_moreInfo').on('click', '.backToMapButton', function(event){
    $('#results_moreInfo').slideToggle("slow");
  });
}

function submitSearch(event){
  event.preventDefault();
  setTimeout(function(){
  if(event.type === 'submit'){
    $('.userAddressSearch').children('button').hide();
  }
  $('#loadingIconPage').toggle();
  setTimeout(loadingIconTimeout, 1500);
  fossilDataArray = [];
  parkDataArray = [];
  userSearchAddress = $('input[name="searchInput"]').val();
  userSearchRadius = $('select[name="searchInputRadius"]').val().split(" ")[0];
  addresstoCoordinates(userSearchAddress);
  stylingChangesandPageReset();
  }, 950);
}

function loadingIconTimeout(){
    $("#loadingIconPage").fadeOut("slow");
}

function searchFormSubmitListener(){
  $('.userAddressSearch').submit(event => {
    $('.ParksandRexLogoButton').attr('src', 'https://i.imgur.com/I8Qf8iP.gif');
    submitSearch(event);
    $('.userAddressSearch').on('change', 'select[name="searchInputRadius"]', submitSearch);
    $('.userAddressSearch').on('change', 'input[name="searchInput"]', submitSearch);
  });
  getWikiData();
  mainPageToggleListeners();
}

$(searchFormSubmitListener);
