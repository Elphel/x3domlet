
var Data = {
    camera:{},
    markers:[],
};

var Scene;
var Map;

var INIT_HEADING = 0;

var SETTINGS = {
    'pointer':   false,
    'highlight': false,
    'viewinfo':  true,
    'moreinfo':  true,
    'crosshair': false,
    'shiftspeed': 0.01
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
  
    $.ajax({
        url: "kml/test.kml",
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
            
            INIT_HEADING = heading;
            
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
                    //x3d_initial_camera_placement();
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

            x3d_events();
            leaf_events();
        }
    };
    
}

// inactive
function x3d_initial_camera_placement(){
    
    // Roll compensation
    var heading = Data.camera.heading*Math.PI/180;
    var tilt = (Data.camera.tilt-90)*Math.PI/180;
    var roll = Data.camera.roll*Math.PI/180;
    
    // Altitude is relative. Do not care.

    // Roll
    var z = new x3dom.fields.SFVec3f(0,0,1);
    var qr = x3dom.fields.Quaternion.axisAngle(z,-roll);
    var M_roll = qr.toMatrix();

    // Tilt
    var x = new x3dom.fields.SFVec3f(1,0,0);
    var qt = x3dom.fields.Quaternion.axisAngle(x,-tilt);
    var M_tilt = qt.toMatrix();

    // Heading
    var y = new x3dom.fields.SFVec3f(0,1,0);
    var qh = x3dom.fields.Quaternion.axisAngle(y,-heading);
    var M_heading = qh.toMatrix();

    var M = M_heading.mult(M_tilt).mult(M_roll);
    
    // store matrices
    Data.camera.Matrices = {
        Head: M_heading,
        Tilt: M_tilt,
        Roll: M_roll,
        R: M
    };
    
    // set view
    var Q = new x3dom.fields.Quaternion(0, 0, 1, 0);
    Q.setValue(M.inverse());
    var AA = Q.toAxisAngle();
    
    var viewpoint = $(Scene.element).find("Viewpoint");
    viewpoint.attr("orientation",AA[0].toString()+" "+AA[1]);
    
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
                    longitude: Lm._latlng.lng
                });
                
                var p1_ll = Camera._latlng;
                var p2_ll = Lm._latlng;

                //var azimuth = getAzimuth(p1_ll,p2_ll);
                var azimuth = getAzimuth(p1_ll,p2_ll);
                
                var initial_heading = INIT_HEADING;
                
                var angle = azimuth - initial_heading;
                var distance = p1_ll.distanceTo(p2_ll);
                
                //console.log("angle from lat lng: "+angle);
                
                mark.x = distance*Math.sin(Math.PI/180*angle);
                mark.y = 0;
                mark.z = -distance*Math.cos(Math.PI/180*angle);
                
                Data.markers.push(mark);
                
                new X3DOMObject.Marker(mark.x,mark.y,mark.z);
                
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
    
}

function leaf_mousemove_nohc(e){
    
    var Camera = Map.marker;
    
    //old
    var p0 = new L.LatLng(Data.camera.latitude,Data.camera.longitude);
    var p1 = new L.LatLng(Camera._latlng.lat,Camera._latlng.lng);
    
    Data.camera.latitude = Camera._latlng.lat;
    Data.camera.longitude = Camera._latlng.lng;
    
    var dh = Camera._heading - Math.PI/180*Data.camera.heading;
    
    //console.log(Camera._heading);
    
    Data.camera.heading = Camera._heading*180/Math.PI;
    
    var newheading = Data.camera.heading;// - INIT_HEADING;
    
    if ((p0.lat!=p1.lat)||(p0.lng!=p1.lng)){
        console.log("translation");
        leaf_translation_v1(p0,p1);
    }

    //leaf_rotation_v1(newheading,dh);
    x3dom_rotation(dh);
    
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
        
        var azimuth = getAzimuth(p1_ll,p2_ll);
        //var initial_heading = Data.camera.heading;
        
        var angle = azimuth - INIT_HEADING;
        var distance = p1_ll.distanceTo(p2_ll);
        
        mark.x = distance*Math.sin(Math.PI/180*angle);
        mark.z = -distance*Math.cos(Math.PI/180*angle);
        
        X3DOMObject.Marker.place(mark.x,mark.y,mark.z,"my-sph-"+index);
    
    }
    
}

function leaf_translation_v1(p0,p1){
    
    var pi = new L.LatLng(p0.lat,p1.lng);
    
    var dx = p0.distanceTo(pi);
    var dy = 0;
    var dz = p1.distanceTo(pi);
    var dl = p0.distanceTo(p1);
    
    //console.log(dx+" "+dz+" "+dl);
    
    if (p1.lng<p0.lng){
        dx = -dx;
    }
    
    if (p1.lat<p0.lat){
        dz = -dz;
    }

    var da = Math.atan2(dz,dx);
    
    var A = Math.PI/180*INIT_HEADING;
    
    dx = dl*Math.sin(A-da);
    dz = -dl*Math.cos(A-da);

    console.log("dx="+dx+" dy="+dy+" dz="+dz+" A="+A+" da="+da);
    
    // translation over map = xz
    x3dom_translation(dx,dy,dz)
    
}

function x3d_mouseMove(){
    
    var Camera = Map.marker;
    
    var initial_heading = Data.camera.heading;
    //var initial_heading = INIT_HEADING;
    
    var heading = x3dom_getViewDirection(Scene.element);
    
    Map.marker.setHeading(heading+INIT_HEADING);
    
    var d = x3dom_getViewTranslation(Scene.element);
    
    var dx;
    var dz;
    
    if (Scene.old_view_translation == null){
        dx = 0;
        dz = 0;
    }else{
        dx = d.x - Scene.old_view_translation.x;
        dz = d.z - Scene.old_view_translation.z;
    }
    
    var distance = Math.sqrt(dx*dx+dz*dz);
    var angle = 180/Math.PI*Math.atan2(dx,-dz);

    var initial_coordinates = [Data.camera.latitude,Data.camera.longitude];
    
    var p0 = new L.LatLng(initial_coordinates[0],initial_coordinates[1]);//Camera._latlng;
    
    var p1 = p0.CoordinatesOf(angle+INIT_HEADING,distance);

    Map.marker.setBasePoint(p1);
    Map.marker._syncMeasureMarkersToBasePoint();

    Data.camera.latitude = p1.lat;
    Data.camera.longitude = p1.lng;
    Data.camera.heading = heading+INIT_HEADING;
    
    Scene.old_view_translation = d;
    
}

// http://www.movable-type.co.uk/scripts/latlong.html
// initial bearing

// precision problems?!

function getAzimuth2(p1,p2){

    //p1 - start point
    //p2 - end point
    
    var dlat = p2.lat-p1.lat;
    var dlon = p2.lng-p1.lng;

    var y = Math.sin(dlon)*Math.cos(p2.lat);
    var x = Math.cos(p1.lat)*Math.sin(p2.lat)-Math.sin(p1.lat)*Math.cos(p2.lat)*Math.cos(dlon);
    
    var azimuth = ((2*Math.PI + Math.atan2(y,x))*180/Math.PI) % 360;
    
    return azimuth;
  
}

function getAzimuth(p1_ll,p2_ll){
    
    var Camera = Map.marker;
    
    var p1 = Camera._map.latLngToLayerPoint(p1_ll);
    var p2 = Camera._map.latLngToLayerPoint(p2_ll);
    
    var dx = p2.x - p1.x;
    var dz = p2.y - p1.y;
    
    var azimuth = (180/Math.PI*Math.atan2(dx,-dz)+360)%360;
    
    return azimuth;
    
}


// no comments
function parseURL(){
    var parameters=location.href.replace(/\?/ig,"&").split("&");
    for (var i=0;i<parameters.length;i++) parameters[i]=parameters[i].split("=");
    for (var i=1;i<parameters.length;i++) {
        switch (parameters[i][0]) {
            case "pointer":    SETTINGS.pointer   = true; break;
            case "highlight":  SETTINGS.highlight = true; break;
            case "viewinfo":   SETTINGS.viewinfo  = true; break;
            case "moreinfo":   SETTINGS.moreinfo  = true; break;
            case "crosshair":  SETTINGS.crosshair = true; break;
            case "shiftspeed": SETTINGS.shiftspeed = parseFloat(parameters[i][1]); break;
        }
    }
}
