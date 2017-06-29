/*
 * TODO:
 *    *
 *
 */

// http://stackoverflow.com/questions/9394190/leaflet-map-api-with-google-satellite-layer

// http://leafletjs.com/examples/extending/extending-1-classes.html
// - extend or include

$(function(){
  light_init();
});

function light_init(){

  $.ajax({
    url: "kml/test.kml",
    success: function(data){

      var marker = [
        parseFloat($(data).find("Camera").find("latitude").text()),
        parseFloat($(data).find("Camera").find("longitude").text())
      ];

      var heading = parseFloat($(data).find("Camera").find("longitude").text());

      init_maps(marker);

    },
  });


}

var map;
var markers = Array();

function init_maps(center){

  var elphelinc = center;//[40.7233861, -111.9328843];

  // https: also suppported.
  var Esri_WorldImagery = L.tileLayer(
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    {
      maxZoom: 21,
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
    }
  );

  var googleSat = L.tileLayer(
    'https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
    {
      maxZoom: 21,
      attribution: 'Many thanks to Google for our happy childhood',
      subdomains:['mt0','mt1','mt2','mt3'],
    }
  );

  var OSMTiles = L.tileLayer('http://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
    {
      maxZoom: 21,
      attribution: 'Map data and images &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>'
    }
  );

  map = L.map('leaflet_map',{
    layers:[googleSat]
  }).setView(elphelinc, 17);

  var baseMaps = {
    "Esri world imagery": Esri_WorldImagery,
    "Google": googleSat,
    "Open Street Map": OSMTiles
  };

  //Esri_WorldImagery.addTo(map);
  //googleSat.addTo(map);

  //custom control:
  //http://www.coffeegnome.net/control-button-leaflet/

  L.control.layers(baseMaps).addTo(map);

  drawCamera(elphelinc);

}

function drawCamera(basepoint){

  var circle = L.cameraViewMarker(basepoint, {
      color: '#191',
      fillColor: '#0f3',
      fillOpacity: 0.5,
      radius: 10,
      heading: 45,
      h_control: true,
      fov: 45*Math.PI/180,
      id: "basecircle"
  }).addTo(map);

}
