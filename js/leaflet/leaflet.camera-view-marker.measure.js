/*
  Leaflet.CameraViewMarker - specific marker with interactions like rotate and drag

  Copyright (C) 2017 Elphel Inc.

  License: GPLv3

  http://leafletjs.com
  https://www.elphel.com

*/
/** 
 * @file leaflet.camera-view-marker.measure.js
 * @brief extends Leaflet.CameraViewMarker with distance measuring tool
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

// Reference plugins:
// * https://github.com/lvoogdt/Leaflet.awesome-markers
// * https://github.com/ppete2/Leaflet.PolylineMeasure

// * https://github.com/ewoken/Leaflet.MovingMarker/blob/master/MovingMarker.js
// * (not used) https://blog.webkid.io/rarely-used-leaflet-features/

(function (window, document, undefined) {
    "use strict";

    L.CameraViewMarker.include({

        createMeasureMarker: function(param,distance){
            
            var latlng = param;
            
            // param is event
            if(param.target){
                latlng = param.latlng;
            }
            
            var p1_ll = this._latlng;

            // param was angle then need distance
            if (!(latlng instanceof L.LatLng)){
                latlng = p1_ll.CoordinatesOf(param,distance);
            }
            
            var p2_ll = latlng;
            var l_d = Array(p1_ll,p2_ll);
            
            var pll = L.polyline(l_d, {
                    color: '#1f1', 
                    weight:1, 
                    dashArray:"5,5"
                }).addTo(this._layerPaint).bringToBack();
                
            //circle
            var tmp_point = new L.CircleMarker(latlng,{
                color: '#1f1',
                fillColor: '#0f3',
                weight: 2,
                fillOpacity: 0.5,
                radius: 5,
            }).addTo(this._layerPaint);
        
            var distance = latlng.distanceTo(this._latlng).toFixed(1);
        
            tmp_point.bindTooltip(distance+' m',{
                permanent:"true",
                direction:"right",
                className: "measurementtooltip",
                offset:[0,0],
            }).openTooltip();
        
            tmp_point.on('click',this._measureMarkerClick,this);
            tmp_point.on('mousedown',this._dragMeasureMarker,this);
            tmp_point._index = this._measureMarkers.length;
        
            this._measureMarkers.push(tmp_point);
            this._measureLines.push(pll);
            
            return tmp_point._index;

        },
        
        moveMeasureMarker: function(param,index){
            
            var latlng = param;
            
            if (param.target){
                index = this.draggedMarker._index;
                latlng = param.latlng;
            }
            
            var p1_ll = this._latlng;
            var p2_ll = latlng;
            var l_d = Array(p1_ll,p2_ll);
            
            this._measureMarkers[index].setLatLng(latlng);
            this._measureLines[index].setLatLngs(l_d);
                        
            var distance = p2_ll.distanceTo(p1_ll).toFixed(1);
            this._measureMarkers[index]._tooltip.setContent(distance+' m');
            
            this.draggedMarker = {
                _index: index,
                _latlng: latlng
            };
            
            this._syncMeasureMarkersToBasePoint();
            
        },
      
        removeMeasureMarker: function(param){
            
            var index = param;
            
            if(param.target){
                index = param.target._index;
                L.DomEvent.stopPropagation(param);
            }
            
            this._layerPaint.removeLayer(this._measureMarkers[index]);
            this._layerPaint.removeLayer(this._measureLines[index]);
            
            this._measureMarkers.splice(index,1);
            this._measureLines.splice(index,1);
            
            this._updateMeasureMarkersIndices();
            
        },

        placeSlidingMarker: function(angle,distance){
          
            var p1_ll = this._measureBase;
            var p2_ll = p1_ll.CoordinatesOf(angle,distance);
            
            var l_d = Array(p1_ll,p2_ll);

            if (this._slidingMarker == undefined){
                this._slidingMarker = new L.CircleMarker(p2_ll,{
                    color: '#1b1',
                    fillColor: '#0f3',
                    weight: 2,
                    fillOpacity: 0.5,
                    radius: 5,
                }).addTo(this._layerPaint);
                
                this._slidingLine = L.polyline(l_d, {
                    color: '#1f1', 
                    weight:1, 
                    dashArray:"5,5"
                }).addTo(this._layerPaint).bringToBack();
                
                this._slidingMarker.bindTooltip(distance.toFixed(1)+' m',{
                    permanent:"true",
                    direction:"right",
                    className: "measurementtooltip",
                    offset:[0,0],
                }).openTooltip();
                
            }else{
                
                this._slidingMarker.setLatLng(p2_ll);
                this._slidingLine.setLatLngs(l_d);
                this._slidingMarker._tooltip.setContent(distance.toFixed(1)+' m');

            }
            
        },
        
        removeSlidingMarker: function(){
            
            if (this._slidingMarker != undefined){
            
                this._layerPaint.removeLayer(this._slidingMarker);
                this._layerPaint.removeLayer(this._slidingLine);
                delete this._slidingMarker;
                delete this._slidingLine;
            
            }
            
        },
        
        onAdd: function(){

            this._initCameraViewMarker();
            this._initCVM_M();

        },

        _initCVM_M: function(){
            
            this._measuring = false;
            
            this._measureMarkers = Array();
            this._measureLines = Array();
            
            this._map.doubleClickZoom.disable();
            
            this._registerEvents_M();
            
            this._measureBase = this._latlng;
            
            this.draggedMarker = {
                _index: null,
                _latlng: null
            };
            //turn on measure mode
            //this._toggleMeasureMode();
        },

        _registerEvents_M: function(){

            this._map.on('mousemove',this._mouseMove_M,this);
            this._map.on('click', this._toggleMeasureMode, this);
            this._map.on('mousemove',this._syncMeasureMarkersToBasePoint, this);
            
        },

        _mouseMove_M: function(e){

            if (e.originalEvent.ctrlKey){
                this._map._container.style.cursor = "pointer";
            }else{
                this._map._container.style.cursor = "default";
            }

        },
        
        _toggleMeasureMode: function(e){
        
            if (e.originalEvent.ctrlKey){
                this.createMeasureMarker(e);
            }
        
            /*
            self._measuring = !self._measuring;
            
            if(self._measuring){
            self._basePoint.off('mousedown',self._dragCamera, self);
            self._map._container.style.cursor = "crosshair";
            
            self._map.on('click', self._placeMeasurePoint, self);
            
            }else{
            self._basePoint.on('mousedown',self._dragCamera, self);
            self._map._container.style.cursor = "default";
            self._map.off('click', self._placeMeasurePoint, self);
            }
            */
        },
      
        _measureMarkerClick:function(e){

            if (e.originalEvent.ctrlKey){
                this.removeMeasureMarker(e);
            }

        },
              
        _syncMeasureMarkersToBasePoint: function(){

            if (this._measureMarkers.length!=0){
                if (this._measureBase!=this._latlng){
                    
                    var self = this;
                    
                    this._measureMarkers.forEach(function(c,i){
                        
                        var p1_ll = self._latlng;
                        var p2_ll = c.getLatLng();
                        var l_d = Array(p1_ll,p2_ll);
                    
                        self._measureLines[i].setLatLngs(l_d);
                    
                        var distance = p2_ll.distanceTo(p1_ll).toFixed(1);
                        c._tooltip.setContent(distance+' m');
                    });

                    this._measureBase=this._latlng;
                }
            }
            
        },
      
        _dragMeasureMarker: function(e){

            if (!e.originalEvent.ctrlKey){
            
                this.draggedMarker = {
                    _index: e.target._index,
                    _latlng: e.target._latlng
                };
                
                this._map.dragging.disable();

                this._map.off('mousemove',this._mouseMove,this);
                this._map.off('click',this._mouseClick,this);
                
                this._map.on('mousemove',this.moveMeasureMarker,this);
                
                this._map.on ('mouseup',this._mouseUp_M,this);
            }
            
        },
      
        _mouseUp_M: function(){
            
            this._map.off('mousemove',this.moveMeasureMarker,this);
            
            this._map.dragging.enable();
            
            this._map.on ('mousemove',this._mouseMove,this);
            
            this._map.off ('mouseup',this._mouseUp_M,this);
            
            this.draggedMarker._index = null;
            
        },
      
        _updateMeasureMarkersIndices:function(){
            
            var self = this;
            
            this._measureMarkers.forEach(function(c,i){
                self._measureMarkers[i]._index = i;
            });

        },
      
    });
    
}(this,document));
