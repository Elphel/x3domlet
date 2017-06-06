// http://stackoverflow.com/questions/9394190/leaflet-map-api-with-google-satellite-layer

// http://leafletjs.com/examples/extending/extending-1-classes.html
// - extend or include

var LeafletObject = function(id,data,options){

    var defaults = {
        debug: true,
        highlight: true,
        maxzoom: 21,
        zoom: 17,
        fov: 30*Math.PI/180,//deg
    };

    this._settings = $.extend(defaults,options);
        
    this._id = id;
    //[40.7233861, -111.9328843];
    this.center = [data.camera.latitude,data.camera.longitude];
    
    this.heading = data.camera.heading;
    //this.heading = 0;//data.camera.heading;

    this.fov = data.camera.fov;
    
    this.initialize();
    
};

LeafletObject.prototype.initialize = function(){

  // https: also suppported.
  var Esri_WorldImagery = L.tileLayer(
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', 
    {
      maxZoom: this._settings.maxzoom,
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
    }
  );

  var googleSat = L.tileLayer(
    'https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
    {
      maxZoom: this._settings.maxzoom,
      attribution: 'Thanks to comrade Google for our happy childhood',
      subdomains:['mt0','mt1','mt2','mt3'],
    }
  );
  
  var OSMTiles = L.tileLayer('http://a.tile.openstreetmap.org/{z}/{x}/{y}.png', 
    {
      maxZoom: this._settings.maxzoom,
      attribution: 'Map data and images &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>'
    }
  );
  
  this._map = L.map(this._id,{
    layers:[googleSat]
  }).setView(this.center, this._settings.zoom);

  var baseMaps = {
    "Esri world imagery": Esri_WorldImagery,
    "Google": googleSat,
    "Open Street Map": OSMTiles
  };

  L.control.layers(baseMaps).addTo(this._map);
 
  this.drawCamera();
    
}

LeafletObject.prototype.drawCamera = function(){
    
    this.marker = L.cameraViewMarker(this.center, {
        color: '#191',
        fillColor: '#0f3',
        fillOpacity: 0.5,
        radius: 10,
        heading: this.heading,
        fov: this.fov,
        draw_xz: false,
        h_control: true,
        id: "basecircle"
    }).addTo(this._map);
    
}

LeafletObject.prototype.highlightMarker = function(index){

    var style = {color:'#f88',fillColor:"#f30"};

    this.marker._measureMarkers[index].setStyle(style).bringToFront();
    this.marker._measureMarkers[index]._tooltip.bringToFront();
    this.marker._measureLines[index].setStyle(style).bringToFront();
    
}

LeafletObject.prototype.dehighlightMarker = function(index){

    var style = {color:'#1f1',fillColor:"#0f3"};

    this.marker._measureMarkers[index].setStyle(style);
    this.marker._measureLines[index].setStyle(style);

}

LeafletObject.prototype.toggleMarker = function(index){

    //console.log("Toggling "+index);
    
    if (!this.marker._measureMarkers[index]._selected){
        this.marker._measureMarkers[index]._selected = true;
    }else{
        this.marker._measureMarkers[index]._selected = false;
    }
    
    //console.log(this.marker._measureMarkers[index]._selected);
    
}

LeafletObject.prototype.deleteMarker = function(index){

    this.marker.removeMeasureMarker(index);

}
