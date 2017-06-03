(function (window, document, undefined) {
    "use strict";

    //from here: https://github.com/bbecquet/Leaflet.PolylineDecorator/blob/master/src/L.RotatedMarker.js
    L.DomUtil.TRANSFORM_ORIGIN = L.DomUtil.testProp(['transformOrigin', 'WebkitTransformOrigin', 'OTransformOrigin', 'MozTransformOrigin', 'msTransformOrigin']);
    
    L.LatLng.prototype.CoordinatesOf = function(angle,distance){
    
        var d = distance;
        var a = angle*Math.PI/180;
        
        var lat1 = this.lat*Math.PI/180;
        var lng1 = this.lng*Math.PI/180;
        
        var R = L.CRS.Earth.R;
        
        var lat2 = Math.asin(Math.sin(lat1)*Math.cos(d/R) + Math.cos(lat1)*Math.sin(d/R)*Math.cos(a));
        
        var y = Math.sin(a)*Math.sin(d/R)*Math.cos(lat1);
        var x = Math.cos(d/R)-Math.sin(lat1)*Math.sin(lat2);
        
        var lng2 = lng1 + Math.atan2(y,x);
        
        lat2 = lat2*180/Math.PI;
        lng2 = lng2*180/Math.PI;
        
        return new L.LatLng(lat2,lng2);

    }

}(this,document));
