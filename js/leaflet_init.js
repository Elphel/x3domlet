/*

  Copyright (C) 2017 Elphel Inc.

  License: GPLv3

  https://www.elphel.com

*/
/**
 * @file -
 * @brief -
 *
 * @copyright Copyright (C) 2017 Elphel Inc.
 * @author Oleg Dzhimiev <oleg@elphel.com>
 *
 * @licstart  The following is the entire license notice for the
 * JavaScript code in this page.
 *
 *   The JavaScript code in this page is free software: you can
 *   redistribute it and/or modify it under the terms of the GNU
 *   General Public License (GNU GPL) as published by the Free Software
 *   Foundation, either version 3 of the License, or (at your option)
 *   any later version.  The code is distributed WITHOUT ANY WARRANTY;
 *   without even the implied warranty of MERCHANTABILITY or FITNESS
 *   FOR A PARTICULAR PURPOSE.  See the GNU GPL for more details.
 *
 *   As additional permission under GNU GPL version 3 section 7, you
 *   may distribute non-source (e.g., minimized or compacted) forms of
 *   that code without the copy of the GNU GPL normally required by
 *   section 4, provided you include this license notice and a URL
 *   through which recipients can access the Corresponding Source.
 *
 *  @licend  The above is the entire license notice
 *  for the JavaScript code in this page.
 */

// http://stackoverflow.com/questions/9394190/leaflet-map-api-with-google-satellite-layer

// http://leafletjs.com/examples/extending/extending-1-classes.html
// - extend or include

var mbxtoken = "";

var LeafletObject = function(id,data,options,callback){

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

    // quick fix, will reinit
    //this.initialize();

    var self = this;

    $.ajax({
      url: "mapbox_token.txt",
      success: function(token){
        mbxtoken = token;
        self.initialize();
        callback();
      },
      error: function(response){
        self.initialize();
        callback();
      }
    });

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
      attribution: 'Google imagery',
      subdomains:['mt0','mt1','mt2','mt3'],
    }
  );

  var OSMTiles = L.tileLayer('http://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
    {
      maxZoom: this._settings.maxzoom,
      attribution: 'Map data and images &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>'
    }
  );

  var mapboxattr = '<a href="https://www.mapbox.com/about/maps/" target="_blank">© Mapbox</a> <a href="https://openstreetmap.org/about/" target="_blank">© OpenStreetMap</a>';

  var mbxurl1   = "https://api.mapbox.com/v4/mapbox.satellite/{z}/{x}/{y}@2x.png?access_token="+mbxtoken;
  var mbxurl2   = "https://api.mapbox.com/v4/mapbox.pencil/{z}/{x}/{y}@2x.png?access_token="+mbxtoken;

  var MBXTiles1 = L.tileLayer(mbxurl1,
    {
      maxZoom: this._settings.maxzoom,
      attribution: mapboxattr
    }
  );

  var MBXTiles2 = L.tileLayer(mbxurl2,
    {
      maxZoom: this._settings.maxzoom,
      attribution: mapboxattr
    }
  );

  if (mbxtoken==""){
    selected_layer = googleSat;

    var baseMaps = {
      "Esri world imagery": Esri_WorldImagery,
      "Google": googleSat,
      "Open Street Map": OSMTiles
    };

  }else{
    selected_layer = MBXTiles1;

    var baseMaps = {
      "Mapbox 1": MBXTiles1,
      "Mapbox 2": MBXTiles2,
      "Esri world imagery": Esri_WorldImagery,
      "Google": googleSat,
      "Open Street Map": OSMTiles
    };

  }

  this._map = L.map(this._id,{
    layers:[selected_layer]
  }).setView(this.center, this._settings.zoom);

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
        l_control: true,
        id: "basecircle"
    }).addTo(this._map);

    // the id is buried in the leaflet plugin
    $("#location_control").addClass("edit");
    controls_showhide();

}

LeafletObject.prototype.highlightMarker = function(index){

    var style = {color:'#f88',fillColor:"#f30"};

    this.marker._measureMarkers[index].setStyle(style).bringToFront();
    this.marker._measureMarkers[index]._tooltip.bringToFront();
    this.marker._measureLines[index].setStyle(style).bringToFront();

    // see x3dom_deltas.js
    theLastMovedMarker = index;

}

LeafletObject.prototype.dehighlightMarker = function(index){

    // check if marker exists, it can be removed a moment before.
    if (Data.markers[index]!=undefined){

      color = Data.markers[index].color;

      var style = {color:color,fillColor:color};

      this.marker._measureMarkers[index].setStyle(style);
      this.marker._measureLines[index].setStyle(style);

    }

}

LeafletObject.prototype.dehighlightMarkers = function(){

    // check if marker exists, it can be removed a moment before.
    for(var i=0;i<Data.markers.length;i++){
      if (!this.marker._measureMarkers[i]._selected) this.dehighlightMarker(i);
    }

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
