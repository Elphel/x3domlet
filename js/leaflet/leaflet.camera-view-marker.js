/*
  Leaflet.CameraViewMarker - specific markerwith interactions like rotate and drag

  Copyright (C) 2017 Elphel Inc.

  License: GPLv3

  http://leafletjs.com
  https://www.elphel.com

*/
/**
 * @file leaflet.camera-view-marker.js
 * @brief A Leaflet plugin that adds camera view marker:
 *        Displays:
 *          * Some marker with basic interactions for position and orientation
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

// Reference links:
// * https://github.com/lvoogdt/Leaflet.awesome-markers
// * (ref) https://github.com/ppete2/Leaflet.PolylineMeasure
// * https://github.com/ewoken/Leaflet.MovingMarker/blob/master/MovingMarker.js
// * (not used) https://blog.webkid.io/rarely-used-leaflet-features/

(function (window, document, undefined) {
    "use strict";

    /*
     * Leaflet.CameraViewMarker assumes that you have already included the Leaflet library.
     */

    //CircleMarker has everything one need
    L.CameraViewMarker = L.CircleMarker.extend({

        options:{
            heading:0,
//             altitude:10,
//             elevation:-40,
            altitude:0,
            elevation:0,
            fov:0, // if 0 then do not draw
            units:"deg",
            draw_xz: true,
            draw_fov: true,
            h_control: false,
            l_control: false,

            basepoint:{
                url: ""
            }
        },

        setHeading: function(param){

            var hecs = this.getHCState();
            var angle = param;

            if (param.target){
                param = param.latlng;
            }

            if (param instanceof L.LatLng) {

                var p0 = this._map.latLngToLayerPoint(this._latlng);
                var p1 = this._map.latLngToLayerPoint(param);

                var dx = p1.x - p0.x;
                var dy = p0.y - p1.y;

                angle = (180/Math.PI*Math.atan2(dx,dy)+360)%360;

                if (hecs){

                    var l = this._axis_length;
                    var l_h = l*2.5/2;
                    var p_base_ll = this._latlng;
                    var p_base = this._map.latLngToLayerPoint(p_base_ll);

                    var p1 = new L.Point(p_base.x+l_h*Math.sin(this._heading),p_base.y-l_h*Math.cos(this._heading));
                    var p2 = this._map.latLngToLayerPoint(param);

                    var dy = (p1.y - p2.y) - this._altitude*10;

                    this._elevation = Math.atan2(dy,l_h);

                    angle = (this._heading)*180/Math.PI;
                }

            }

            if (this._units=="deg"){
                this._heading = angle*(Math.PI/180);
            }else{
                this._heading = angle;
            }

            this._updateCameraViewMarker();

        },

        setBasePoint: function(param){

            var latlng = param;
            var hecs = this.getHCState();

            if (param.target){

                latlng = param.latlng;

                if (hecs){

                    var p1_ll = this._latlng;
                    var p2_ll = latlng;

                    var p1 = this._map.latLngToLayerPoint(p1_ll);
                    var p2 = this._map.latLngToLayerPoint(p2_ll);

                    // vertical only movement
                    p2.x = p1.x;

                    this._altitude = (p1.y - p2.y)/10;

                    latlng = this._latlng;
                }
            }

            this._latlng = latlng;
            this._measureBase = latlng;
            this._updateCameraViewMarker();

        },

        setAltitude: function(param){

            this._altitude = param;
            this._updateCameraViewMarker();

        },

        setElevation: function(param){

            this._elevation = param;
            this._updateCameraViewMarker();

        },

        setFoV: function(param){

            this._fov = param;
            this._updateCameraViewMarker();

        },

        //initialize is most likely performed by L.CircleMarker

        //this is some default function rewritten
        onAdd: function(){

            this._initCameraViewMarker();

        },

        _initCameraViewMarker: function(){

            //constants
            this._axis_length = 100;
            this._radius = 10;

            this._heading = this.options.heading;
            this._units = this.options.units;

            this._fov = this.options.fov;

            this._draw_xz = this.options.draw_xz;
            this._draw_fov = this.options.draw_fov;

            this._READY = false;

            if(!this._layerPaint){
                this._layerPaint = L.layerGroup().addTo(this._map);
            }

            // height/elevation control
            this._controls = {
                hc:{
                    getState: function(){return false;}
                },
                lc:{
                    getState: function(){return false;}
                }
            };

            this.h_control = false;

            if (typeof L.control.cameraViewMarkerControls == 'function'){
                this.h_control = this.options.h_control;
            }

            if (this.h_control){
                this._altitude = this.options.altitude;
                this._elevation = this.options.elevation*Math.PI/180;
                this._initHControl();
            }else{
                this._altitude = 0;
                this._elevation = 0;
            }

            this.setHeading(this._heading);
            this._registerEvents();

            this.l_control = false;

            // location control
            if (typeof L.control.cameraViewMarkerControlsLocation == 'function'){
                this.l_control = this.options.l_control;
            }

            if (this.l_control){
                this._initLControl();
            }

        },

        _updateCameraViewMarker: function(){

            // this.h_control & this._altitude

            if (this.h_control){
                this._updateCameraViewMarker_hc();
            }else{
                this._updateCameraViewMarker_nohc();
            }

        },

        _updateCameraViewMarker_hc: function(){

            this._updateCameraViewMarker_nohc();

        },

        _updateCameraViewMarker_nohc: function(){

            var hecs = this.getHCState();

            var l = this._axis_length;
            var l_h = l*2.5/2;

            var p_base_ll = this._latlng;
            var p_base = this._map.latLngToLayerPoint(p_base_ll);

            var p_head = new L.Point(p_base.x+l_h*Math.sin(this._heading),p_base.y-l_h*Math.cos(this._heading));
            var p_x    = new L.Point(p_base.x+l*Math.cos(this._heading),p_base.y+l*Math.sin(this._heading));
            var p_z    = new L.Point(p_base.x-l*Math.sin(this._heading),p_base.y+l*Math.cos(this._heading));

            var p_fov_l = new L.Point(p_base.x+l*Math.sin(this._heading-this._fov/2),p_base.y-l*Math.cos(this._heading-this._fov/2));
            var p_fov_r = new L.Point(p_base.x+l*Math.sin(this._heading+this._fov/2),p_base.y-l*Math.cos(this._heading+this._fov/2));

            var p_head_ll = this._map.layerPointToLatLng(p_head);
            var p_x_ll    = this._map.layerPointToLatLng(p_x);
            // y axis adds to right handed coordinate system
            var p_z_ll    = this._map.layerPointToLatLng(p_z);

            var p_fov_l_ll = this._map.layerPointToLatLng(p_fov_l);
            var p_fov_r_ll = this._map.layerPointToLatLng(p_fov_r);

            var l_head = Array(p_base_ll,p_head_ll);
            var l_x    = Array(p_base_ll,p_x_ll);
            var l_z    = Array(p_base_ll,p_z_ll);

            var l_fov_l = Array(p_base_ll,p_fov_l_ll);
            var l_fov_r = Array(p_base_ll,p_fov_r_ll);

            // BEGIN HECS

            //base
            var p_base_cap = new L.Point(p_base.x,p_base.y-10*this._altitude);
            var p_base_cap_ll = this._map.layerPointToLatLng(p_base_cap);

            var p_base_cap_t = new L.Point(p_base.x,p_base.y-100);
            var p_base_cap_t_ll = this._map.layerPointToLatLng(p_base_cap_t);

            var p_base_cap_b = new L.Point(p_base.x,p_base.y+100);
            var p_base_cap_b_ll = this._map.layerPointToLatLng(p_base_cap_b);

            var p_base_cap_l = new L.Point(p_base.x-50/2,p_base.y);
            var p_base_cap_l_ll = this._map.layerPointToLatLng(p_base_cap_l);

            var p_base_cap_r = new L.Point(p_base.x+50/2,p_base.y);
            var p_base_cap_r_ll = this._map.layerPointToLatLng(p_base_cap_r);

            var l_base_cap_tb = Array(p_base_cap_t_ll,p_base_cap_b_ll);
            var l_base_cap_lr = Array(p_base_cap_l_ll,p_base_cap_r_ll);

            //head
            var p_head_cap = new L.Point(p_head.x,p_head.y-10*this._altitude-l_h*Math.tan(this._elevation));
            var p_head_cap_ll = this._map.layerPointToLatLng(p_head_cap);

            var p_head_cap_t = new L.Point(p_head.x,p_head.y-100);
            var p_head_cap_t_ll = this._map.layerPointToLatLng(p_head_cap_t);

            var p_head_cap_b = new L.Point(p_head.x,p_head.y+100);
            var p_head_cap_b_ll = this._map.layerPointToLatLng(p_head_cap_b);

            var p_head_cap_l = new L.Point(p_head.x-50/2,p_head.y);
            var p_head_cap_l_ll = this._map.layerPointToLatLng(p_head_cap_l);

            var p_head_cap_r = new L.Point(p_head.x+50/2,p_head.y);
            var p_head_cap_r_ll = this._map.layerPointToLatLng(p_head_cap_r);

            var l_head_cap_tb = Array(p_head_cap_t_ll,p_head_cap_b_ll);
            var l_head_cap_lr = Array(p_head_cap_l_ll,p_head_cap_r_ll);

            // END

            if (!this._READY){

                var cBIcon = L.icon({
                    iconUrl: 'js/images/base.png',
                    iconSize: [32, 46],
                    //iconSize: [40, 57],
                    //iconSize: [64, 92],
                    className: 'basePointIcon'
                });

                this._basePoint = new L.marker(p_base_ll,{
                    icon: cBIcon
                });

                this._basePoint = new L.CircleMarker(p_base_ll,{
                    color: '#191',
                    fillColor: '#0f3',
                    fillOpacity: 0.5,
                    radius: this._radius
                });

                //this._basePoint._icon.style[L.DomUtil.TRANSFORM_ORIGIN] = "50% 50%";
                //this._basePoint._icon.style[L.DomUtil.TRANSFORM] += 'rotate(' + (this._heading*180/Math.PI) + 'deg)';

                this._headLine = L.polyline(l_head, {color: 'white', weight:2, dashArray:"5,10"}).addTo(this._layerPaint);

                if (this._draw_xz){
                    this._xAxis = L.polyline(l_x, {color: 'red', weight:2 }).addTo(this._layerPaint);
                    this._zAxis = L.polyline(l_z, {color: 'blue', weight:2 }).addTo(this._layerPaint);
                }

                if (this._draw_fov){
                    this._lFov = L.polyline(l_fov_l, {color: '#0f3', weight:2 }).addTo(this._layerPaint);
                    this._rFov = L.polyline(l_fov_r, {color: '#0f3', weight:2 }).addTo(this._layerPaint);
                }

                //draw fov lines here

                this._basePoint.addTo(this._layerPaint).bringToFront();

                var cHIcon = L.icon({
                    iconUrl: 'js/leaflet/images/crosshair.png',
                    iconSize: [32, 32]
                });

                this._headPoint = new L.marker(p_head_ll,{
                    icon: cHIcon
                });

                /*
                this._headPoint = new L.CircleMarker(p_head_ll,{
                    color: 'white',
                    fillColor: 'white',
                    fillOpacity: 0.1,
                    radius: this._radius
                });
                */

                this._headPoint.addTo(this._layerPaint);

                this._READY = true;

            }else{

                this._headLine.setLatLngs(l_head);

                if (this._draw_xz){
                    this._xAxis.setLatLngs(l_x);
                    this._zAxis.setLatLngs(l_z);
                }

                if (this._draw_fov){

                    if (this._lFov){
                        this._lFov.setLatLngs(l_fov_l);
                        this._rFov.setLatLngs(l_fov_r);
                    }else{
                        this._lFov = L.polyline(l_fov_l, {color: '#0f3', weight:2 }).addTo(this._layerPaint);
                        this._rFov = L.polyline(l_fov_r, {color: '#0f3', weight:2 }).addTo(this._layerPaint);
                    }
                }

                this._basePoint.setLatLng(p_base_ll);
                this._headPoint.setLatLng(p_head_ll);

                if (this._baseCapLineV){
                    this._layerPaint.removeLayer(this._baseCapLineV);
                    this._layerPaint.removeLayer(this._headCapLineV);
                    this._baseCapLineV = false;
                    this._headCapLineV = false;
                    this._layerPaint.removeLayer(this._baseCapLineH);
                    this._layerPaint.removeLayer(this._headCapLineH);
                    this._baseCapLineH = false;
                    this._headCapLineH = false;
                    this._basePoint.unbindTooltip();
                    this._headPoint.unbindTooltip();
                }

                if (hecs){

                    this._basePoint.bindTooltip("H= "+this._altitude+" m",{
                        direction:"right",
                        permanent:"true",
                        className: "measurementtooltip",
                        offset:[5,5],
                    }).openTooltip();

                    this._headPoint.bindTooltip("&alpha;= "+((180/Math.PI*this._elevation).toFixed(1))+" &deg;",{
                        direction:"right",
                        permanent:"true",
                        className: "measurementtooltip",
                        offset:[5,5],
                    }).openTooltip();

                    this._layerPaint.removeLayer(this._lFov);
                    this._layerPaint.removeLayer(this._rFov);
                    this._lFov = false;
                    this._rFov = false;

                    this._basePoint.setLatLng(p_base_cap_ll);
                    this._headPoint.setLatLng(p_head_cap_ll);

                    this._baseCapLineV = L.polyline(l_base_cap_tb, {color: '#0f3', weight:2, dashArray:"1,3"}).addTo(this._layerPaint).bringToBack();
                    this._headCapLineV = L.polyline(l_head_cap_tb, {color: '#0f3', weight:2, dashArray:"1,3"}).addTo(this._layerPaint).bringToBack();
                    this._baseCapLineH = L.polyline(l_base_cap_lr, {color: '#0f3', weight:2, dashArray:"1,3"}).addTo(this._layerPaint).bringToBack();
                    this._headCapLineH = L.polyline(l_head_cap_lr, {color: '#0f3', weight:2, dashArray:"1,3"}).addTo(this._layerPaint).bringToBack();
                }

                //this._basePoint._icon.style[L.DomUtil.TRANSFORM] += 'rotate(' + (this._heading*180/Math.PI) + 'deg)';

            }

        },

        _registerEvents: function(){

            this._map.on('zoomend',this._onZoomEnd,this);

            this._basePoint.on('mousedown',this._dragCameraViewMarker,this);
            this._headPoint.on('mousedown',this._rotateCameraViewMarker,this);

        },

        _mouseMove: function(e){

            // from some plugin - didn't test if it's true
            // original text: "necassary for _dragCircle. If switched on already within _dragCircle an unwanted click is fired at the end of the drag."
            this._map.on('click',this._mouseClick,this);

        },

        _mouseClick: function(e){

            this._headPoint.on('mousedown',this._rotateCameraViewMarker,this);

        },

        _rotateCameraViewMarker: function(e){

            this._map.dragging.disable();

            this._map.off('mousemove',this._mouseMove,this);
            this._map.off('click',this._mouseClick,this);

            this._map.on('mousemove',this.setHeading,this);
            this._map.on('mouseup',this._mouseUp,this);

            // prevent image getting grabbed by browser
            e.originalEvent.preventDefault();

        },

        _mouseUp: function(e){

            this._map.dragging.enable();

            this._map.off('mousemove',this.setHeading,this);
            this._map.off('mousemove',this.setBasePoint,this);

            this._map.on ('mousemove',this._mouseMove,this);

            this._map.off('mouseup',this._mouseUp,this);

        },

        _dragCameraViewMarker: function(e){

            this._map.dragging.disable();

            this._map.off('mousemove',this._mouseMove,this);
            this._map.off('click',this._mouseClick,this);

            this._map.on('mousemove',this.setBasePoint,this);

            this._map.on('mouseup',this._mouseUp,this);

            // prevent image getting grabbed by browser
            e.originalEvent.preventDefault();

        },

        _onZoomEnd: function(e){
            this._updateCameraViewMarker();
        },

        // height controls
        _initHControl: function(){

            var self = this;

            this._controls.hc = L.control.cameraViewMarkerControls({position:'topleft'}).addTo(this._map);

            var btn = this._controls.hc._button;

            L.DomEvent.on(btn, 'click', function(){
                self._updateCameraViewMarker();
            },btn);

        },

        getHCState: function(){

            return this._controls.hc.getState() || this.hcontrol;

        },

        // location controls
        _initLControl: function(){

            var self = this;

            this._controls.lc = L.control.cameraViewMarkerControlsLocation({position:'topleft'}).addTo(this._map);

            var btn = this._controls.lc._button;

            L.DomEvent.on(btn, 'click', function(){
                self._updateCameraViewMarker();
            },btn);

        },

        getLCState: function(){

            return this._controls.lc.getState() || this.lcontrol;

        }

    });

    L.cameraViewMarker = function (latlng,options) {
        return new L.CameraViewMarker(latlng,options);
    };

}(this,document));
