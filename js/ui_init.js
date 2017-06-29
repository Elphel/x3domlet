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

var Data = {
    camera:{},
    markers:[],
};

var Scene;
var Map;

var SETTINGS = {
    'pointer':   false,
    'highlight': false,
    'markinfo':  true,
    'viewinfo':  true,
    'moreinfo':  true,
    'crosshair': false,
    'shiftspeed' : 0.01,
    'markersize' : 2,
    'markercolor': "#1f1",
    'slidingdrag': true,
    'basepath': "models",
    'path'   : "1487451413_967079",
    'version': "v1",
//     'kml'    : "scene.kml"
}

var MARKER_PREFIX = "my-sph-";

// no comments
function parseURL(){
    var parameters=location.href.replace(/\?/ig,"&").split("&");
    for (var i=0;i<parameters.length;i++) parameters[i]=parameters[i].split("=");
    for (var i=1;i<parameters.length;i++) {
        switch (parameters[i][0]) {
            case "pointer":      SETTINGS.pointer   = true; break;
            case "highlight":    SETTINGS.highlight = true; break;
            case "markinfo":     SETTINGS.markinfo  = true; break;
            case "viewinfo":     SETTINGS.viewinfo  = true; break;
            case "moreinfo":     SETTINGS.moreinfo  = true; break;
            case "crosshair":    SETTINGS.crosshair = true; break;
            case "slidingdrag":  SETTINGS.slidingdrag = true; break;
            case "shiftspeed":   SETTINGS.shiftspeed = parseFloat(parameters[i][1]); break;
            case "markersize":   SETTINGS.markersize = parseFloat(parameters[i][1]); break;
            case "path":         SETTINGS.path = parameters[i][1]; break;
            case "ver":          SETTINGS.version = parameters[i][1]; break;
//             case "kml":          SETTINGS.kml = parameters[i][1]; break;
        }
    }
}

$(function(){

    parseURL();

    title_init();
    help_init();
    menu_init();

    light_init();

});

function title_init(){

    var html = $("<div>").html("Demo");

    html.css({
        position:"absolute",
        top: "10px",
        left: "50%",
        color:"white",
        "font-size":"40px",
        "font-weight":"bold",
        "font-family": '"Helvetica Neue", Helvetica, Arial, sans-serif',
        "user-select": "none"
    });

    $("body").append(html);

}

function light_init(){

    var x3delement = $("#x3d_id").find("scene");

    var model_url = SETTINGS.basepath+"/"+SETTINGS.path+"/"+SETTINGS.version+"/"+SETTINGS.path+".x3d";
    var model_back_url = SETTINGS.basepath+"/"+SETTINGS.path+"/"+SETTINGS.version+"/"+SETTINGS.path+"-texture-bgnd-ext.jpeg";

    var model = $(`
        <group>
            <inline name='mymodel' namespacename='mymodel' url='`+model_url+`'></inline>
        </group>
        <group>
            <Background
                id="Background"
                class="Background"
                backUrl=  "js/images/background_side.jpeg"
                bottomUrl="js/images/background_floor.jpeg"
                frontUrl= "`+model_back_url+`"
                leftUrl=  "js/images/background_side.jpeg"
                rightUrl= "js/images/background_side.jpeg"
                topUrl=   "js/images/background_sky.jpeg">
            </Background>
        </group>
        `);

    x3delement.append(model);

    $.ajax({
        url: SETTINGS.basepath+"/"+SETTINGS.path+"/"+SETTINGS.path+".kml",
        success: function(response){

            var longitude = parseFloat($(response).find("Camera").find("longitude").text());
            var latitude  = parseFloat($(response).find("Camera").find("latitude").text());
            var altitude  = parseFloat($(response).find("Camera").find("altitude").text());

            var heading = parseFloat($(response).find("Camera").find("heading").text());
            var tilt    = parseFloat($(response).find("Camera").find("tilt").text());
            var roll    = parseFloat($(response).find("Camera").find("roll").text());

            var fov    = parseFloat($(response).find("Camera").find("fov").text());

            Data.camera = new X3L({
                x: 0,
                y: 0,
                z: 0,
                latitude: latitude || 0,
                longitude: longitude || 0,
                altitude: altitude || 0,
                heading: heading || 0,
                tilt: tilt || 0,
                roll: roll || 0,
                fov: fov || 0,
            });

            var element = document.getElementById('x3d_id');

            Scene = new X3DOMObject(element,Data,{});
            Scene.initResize();

            $.getScript("js/x3dom/x3dom-full.debug.js",function(){

                Map = new LeafletObject('leaflet_map',Data,{});
                //wait until it DOM is extended
                x3dom.runtime.ready = function(){

                    map_resize_init();
                    deep_init();
                    align_init();
                    x3d_initial_camera_placement();
                    x3d_events();
                    leaf_events();

                };
            });

        },
    });

}

function map_resize_init(){

    var html = $("<div>",{id:"map_resizer_handle"});

    $("#map_wrapper").append(html);

    html.on("mousedown",function(){

        $("body").on("mousemove",map_resize);
        $(Scene.element).find("canvas").on("mousemove",map_resize);

    });

    html.on("mouseup",function(){

        $("body").off("mousemove",map_resize);
        $(Scene.element).find("canvas").off("mousemove",map_resize);

    });

}

function map_resize(e){

    var xm = e.clientX;
    var ym = e.clientY;

    var xw = $(window).width();
    var yw = $(window).height();

    var xb = parseInt($("#map_wrapper").css("right"));
    var yb = parseInt($("#map_wrapper").css("bottom"));

    var w = xw - xm - xb;
    var h = yw - ym - yb;

    $("#map_wrapper").width(w);
    $("#map_wrapper").height(h);

    $("#leaflet_map").width(w);
    $("#leaflet_map").height(h);

    // from some forum, stackoverflow?
    setTimeout(function(){Map._map.invalidateSize();}, 100);

}

function deep_init(){

    //Scene.initResize();
    Scene.FoVEvents();
    Scene.KeyEvents();

    Scene.element.runtime.enterFrame = function(){

        // the only <strong> in the document
        var progress_element = $(Scene.element).find("strong");
        var progress_counter = $(progress_element).html();
        progress_counter = progress_counter.split(" ");
        cnt = parseInt(progress_counter[1]);

        if (!Scene._X3DOM_SCENE_INIT_DONE&&(cnt==0)){

            //Scene.initResize();

            // now then all shapes are parsed and accessible
            Scene.ShapeEvents();

            Scene._X3DOM_SCENE_INIT_DONE = true;

        }
    };

}

function x3d_initial_camera_placement(){

    var heading = Data.camera.heading*Math.PI/180;
    var tilt = (Data.camera.tilt-90)*Math.PI/180;
    var roll = Data.camera.roll*Math.PI/180;

    // Altitude is relative. Do not care.

    // Heading,Tilt,Roll
    var Mh = x3dom.fields.SFMatrix4f.rotationZ(heading);
    var Mt = x3dom.fields.SFMatrix4f.rotationY(tilt);
    var Mr = x3dom.fields.SFMatrix4f.rotationX(roll);

    // rw = real world with North
    // w = virtual world = x3dom frame reference

    // proper Euler rotation
    var R = Mh.mult(Mt).mult(Mr);
    // convert to proper Euler
    var T = x3dom_toYawPitchRoll();

    var R0 = T.inverse().mult(R).mult(T);

    // _rw - real world
    //  _w - virt world

    // exclude roll?
    //var RC0_rw = T.inverse().mult(Mh).mult(Mt).mult(T);

    // exclude tilt and roll
    var RC0_rw = T.inverse().mult(Mh).mult(T);

    var RC_w = R0.inverse().mult(RC0_rw);
    // store matrices
    Data.camera.Matrices = {
        R0 : R0,
        Up0: RC_w.e1(),
        RC_w: RC_w,
    };

    x3dom_setViewpoint(RC_w);

}

function x3d_events(){

    var elem = Scene.element;

    elem.addEventListener('keydown',function(e){

        //console.log("scene keydown");

        if ((e.key=="Shift")||(SETTINGS.highlight&&!SETTINGS.pointer)){
            // select shape
            var sr = elem.runtime.shootRay(e.path[0].mouse_drag_x,e.path[0].mouse_drag_y);

            if (!$(sr.pickObject).hasClass("shapemarker")){
                X3DOMObject.Shape.highlight(sr.pickObject);
            }


        }

        if (e.key=="Control"){

            var x,y,z;
            var dist = 1000;

            var mouse = x3dom_getXYPosOr(e.path[0].mouse_drag_x,e.path[0].mouse_drag_y,false);

            if (mouse.d_xz != null){

                dist = parseFloat(mouse.d_xz);

                X3DOMObject.Marker.place(mouse.x,mouse.y,mouse.z,"sliding_sphere");
                $("#sliding_sphere").find("switch").attr("whichChoice",0);

            }

            Map.marker.placeSlidingMarker(mouse.a,dist);

        }

    },true);

    elem.addEventListener('keyup',function(e){

        if (e.key=="Shift"){
            // select shape
            var sr = elem.runtime.shootRay(e.path[0].mouse_drag_x,e.path[0].mouse_drag_y);
            X3DOMObject.Shape.dehighlight(sr.pickObject);
        }

        if (e.key=="Control"){

            X3DOMObject.Marker.place(0,0,0,"sliding_sphere");
            $("#sliding_sphere").find("switch").attr("whichChoice",-1);

            Map.marker.removeSlidingMarker();

        }

    },true);

    elem.addEventListener('mousedown',function(){
        elem.addEventListener('mousemove',x3d_mouseMove,true);
    });

    elem.addEventListener('mouseup',function(){
        elem.removeEventListener('mousemove',x3d_mouseMove,true);
    });

    elem.addEventListener('mouseover',function(e){

        // have to focus if want key events to work w/o extra click
        Scene.focusOnCanvas();

    });

    elem.addEventListener('mousemove',function(e){

        // have to focus if want key events to work w/o extra click
        Scene.focusOnCanvas();

        var camera = x3dom_getCameraPosOr(e.clientX,e.clientY,false);
        Map.marker.setAltitude(camera.y);
        Map.marker.setElevation(camera.e*Math.PI/180);

        X3DOMObject.displayInfo(e);
        X3DOMObject.displayViewInfo(e);

        if (SETTINGS.highlight&&!SETTINGS.pointer){

            var sr = elem.runtime.shootRay(e.path[0].mouse_drag_x,e.path[0].mouse_drag_y);
            X3DOMObject.Shape.highlight(sr.pickObject);

        }

        if ((Scene._ctrlKey)||(SETTINGS.pointer)){

            // show shadow marker
            var mouse = x3dom_getXYPosOr(e.clientX,e.clientY,false);
            var dist = parseFloat(mouse.d_xz) || 1000;

            Map.marker.placeSlidingMarker(mouse.a,dist);

        }else{

            // hide shadow marker
            Map.marker.removeSlidingMarker();

        }

        if (e.buttons==1){
            // upright view
            x3dom_setUpRight();
        }


        // what is this?
        //x3d_mouseMove();

    },true);

    elem.addEventListener('mouseout',function(e){

        // hide shadow marker
        Map.marker.removeSlidingMarker();
        ui_hideMessage("window-info");


    });

}

function leaf_events(){

    var Camera = Map.marker;

    Camera._map.on('mouseover',function(e){
        //console.log("map mouseover");
        //$(this).focus();
        this._container.focus();
    });

    Camera._map.on('mousemove',function(e){
        //console.log("map mousemove");
        this._container.focus();
    });

    /*
    // this one works
    document.getElementById("leaflet_map").addEventListener('keydown',function(e){
        console.log("well2");
    });
    */

    Camera._map.on('click',function(e){

        if (e.originalEvent.ctrlKey){

            var Lm = Camera._measureMarkers[Data.markers.length];

            if (Lm!=undefined){

                var mark = new X3L({
                    latitude: Lm._latlng.lat,
                    longitude: Lm._latlng.lng,
                    color: SETTINGS.markercolor,
                    size: SETTINGS.markersize,
                });

                var p1_ll = Camera._latlng;
                var p2_ll = Lm._latlng;

                var distance = p1_ll.distanceTo(p2_ll);

                p_w = x3dom_delta_map2scene(p1_ll,p2_ll);

                mark.x = p_w.x;
                mark.y = p_w.y;
                mark.z = p_w.z;

                mark.d_map = distance;
                mark.d_x3d = "<font style='color:red;'>drag over 3D</font>";

                Data.markers.push(mark);

                X3DOMObject.displayMarkInfo(Data.markers.length-1);

                //new X3DOMObject.Marker(mark.x,mark.y,mark.z,true);
                new X3DOMObject.Marker(mark.x,mark.y,mark.z,false);

                //Scene.createMarker(mark.x,mark.y,mark.z);
                //x3d_markerEvents(Data.markers.length-1);

                X3DOMObject.MapMarker.registerEvents(Lm);

            }

        }

    });

    Camera._map.on('mousedown',function(e){

        if (!e.originalEvent.ctrlKey){

            Camera._map.on('mousemove',leaf_mousemove,Camera);
            Camera._map.on('mouseup',leaf_mouseup,Camera);

        }

    });

}

function leaf_mouseup(e){

    var Camera = Map.marker;
    Camera._map.off('mousemove',leaf_mousemove,Camera);
    Camera._map.off('mousemove',leaf_mouseup,Camera);

    Camera.draggedMarker._index = null;

}

function leaf_mousemove(e){

    // update Scene dragged marker position
    leaf_drag_marker();

    var hecs = Map.marker.getHCState();

    if (hecs){
        leaf_mousemove_hc(e)
    }else{
        leaf_mousemove_nohc(e);
    }

}

function leaf_mousemove_hc(){

    var Camera = Map.marker;

    var altitude = Camera._altitude;
    var elevation = Camera._elevation; //rads

    x3dom_altelev(altitude,elevation);

    X3DOMObject.displayViewInfo({});

}

function leaf_mousemove_nohc(e){

    var Camera = Map.marker;

    var p0 = new L.LatLng(Data.camera.latitude,Data.camera.longitude);
    var p1 = new L.LatLng(Camera._latlng.lat,Camera._latlng.lng);

    var dh = Camera._heading - Math.PI/180*Data.camera.heading;

    Data.camera.heading   = Camera._heading*180/Math.PI;
    Data.camera.latitude  = Camera._latlng.lat;
    Data.camera.longitude = Camera._latlng.lng;

    if ((p0.lat!=p1.lat)||(p0.lng!=p1.lng)){
        leaf_translation_v1(p0,p1);
    }else{
        x3dom_rotation(dh);
    }

    X3DOMObject.displayViewInfo({});

}

function leaf_drag_marker(){

    var Camera = Map.marker;

    // update Scene marker position

    if (Camera.draggedMarker._index != null){

        //console.log(Camera.draggedMarker._latlng);

        var index = Camera.draggedMarker._index;

        var p1_ll = Camera._latlng;
        var p2_ll = Camera.draggedMarker._latlng;

        var mark = Data.markers[index];

        mark.latitude = p2_ll.lat;
        mark.longitude = p2_ll.lng;

        var distance = p1_ll.distanceTo(p2_ll);

        var dp_w = x3dom_delta_map2scene(p1_ll,p2_ll);

        mark.x = dp_w.x;
        mark.z = dp_w.z;

        mark.d_map = distance;

        X3DOMObject.displayMarkInfo(index);

        X3DOMObject.Marker.place(mark.x,mark.y,mark.z,"my-sph-"+index);

    }

}

function leaf_translation_v1(p0,p1){

    var dp_w = x3dom_delta_map2scene(p0,p1);

    x3dom_translation(dp_w.x,dp_w.y,dp_w.z);

    // if not updated then moving in 3D scene will make it jump
    Scene.old_view_translation = x3dom_getViewTranslation(Scene.element);

}

function x3d_mouseMove(){

    x3dom_update_map();

}
