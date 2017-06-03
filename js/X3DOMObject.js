
var X3DOMObject = function(element,data,options){

    var defaults = {
        debug: true,
        highlight: true,
        fov: 30*Math.PI/180,//deg, vertical
        fov_step: 0.025, //rad
    };

    this._settings = $.extend(defaults,options);
    
    this._FOV = this._settings.fov;
    this._FOV_STEP = this._settings.fov_step;
    this._HIGHLIGHT_ON_MOUSEOVER = this._settings.highlight;
    this._DEBUG = this._settings.debug;
    
    this._resizeTimer = false;
    this._eventCtrlKey = false;
    
    //this._X3DOM_SCENE_INIT = this._settings.debug;
    this._X3DOM_SCENE_INIT = false;
    
    //this._element = element;
    this.element = element;
     
    this.highlighted_marker_index = null;
    
    this.old_view_translation = null;
    //this.lastMouseX;
    //this.lastMouseY;
    this.data = data;

    this.initialize();
    
};

X3DOMObject.prototype.initialize = function(){
    
    var self = this;

    self.resize();

    //bind resize
    $(window).resize(function(){
        clearTimeout(self.resizeTimer);
        self.resizeTimer = window.setTimeout(function(){
            self.resize();
        },100);
    });

    //self.getX3DOMlibrary();

}

X3DOMObject.prototype.resize = function(){
    
    var self = this;

    var w = $(window).width();
    var h = $(window).height();

    $(self.element).attr("width",w);
    $(self.element).attr("height",h);
  
    $("#crosshair_h").css({
        left: (w/2-$("#crosshair_h").width()/2)+"px",
        top: (h/2)+"px"
    });

    $("#crosshair_v").css({
        left: (w/2)+"px",
        top: (h/2-$("#crosshair_v").height()/2)+"px"
    });
    
    var fov = w/h*self._FOV;
    
    //fov = Math.PI/2;
    
    // apply to all viewpoints, but:
    // https://doc.x3dom.org/author/Navigation/Viewpoint.html
    // = correct field of view is not guaranteed in X3DOM
    $(self.element).find("Viewpoint").each(function(){
        $(this).attr("fieldOfView",fov);
    });
    
    self.data.camera.fov = fov;
    
    if (Map.marker != undefined){
        Map.marker.setFoV(fov);
    }
    
}

/*
X3DOMObject.getX3DOMlibrary = function(){
    
    var self = this;
    
    $.getScript("js/x3dom-full.debug.js",function(){
        //wait until it parsed the DOM
        x3dom.runtime.ready = function(){
            self.deepInit();
        };
    });
}
*/

// so one doesn't have to click to enable keydown/keyup
X3DOMObject.prototype.focusOnCanvas = function(){
    
    this.element.getElementsByTagName("canvas")[0].focus();
    
}

X3DOMObject.prototype.FoVEvents = function(){
    
    var self = this;
    // true = CAPTURING = from parent to child
    // canvas is a child of x3d
    
    //Chrome?!
    self.element.addEventListener('mousewheel',function(e){
        var delta = (e.deltaY>0)?self._FOV_STEP:-self._FOV_STEP;
        self.changeFoV(e,delta);
    },true);
    
    //Firefox?!
    self.element.addEventListener('DOMMouseScroll',function(e){  
        var delta = (e.detail>0)?self._FOV_STEP:-self._FOV_STEP;
        self.changeFoV(e,delta);
    },true);
    
    
}


X3DOMObject.prototype.changeFoV = function(e,val){

    var fov = this.getFoV()+val;
    this.setFoV(fov);
    Map.marker.setFoV(fov);

    e.preventDefault();
    e.stopPropagation();
    return false;
    
}

X3DOMObject.prototype.setFoV = function(val){
  
    var vp = $(this.element).find("Viewpoint")[0];
    $(vp).prop("fieldOfView",val);
  
}

X3DOMObject.prototype.getFoV = function(){
  
    var vp = $(this.element).find("Viewpoint")[0];
    return parseFloat($(vp).prop("fieldOfView"));
    
}

X3DOMObject.prototype.KeyEvents = function(){
    
    var self = this;
    //Chrome?!
    self.element.addEventListener('mousemove',function(e){
        if (e.ctrlKey){
            self._ctrlKey = true;
        }else{
            self._ctrlKey = false;
        }
        if (e.shiftKey){
            self._shiftKey = true;
        }else{
            self._shiftKey = false;
        }        
    },true);

}
/*
X3DOMObject.prototype.mouseMove = function(e){

    //offsetX / offsetY polyfill for FF
    var target = e.target || e.srcElement;
    var rect = target.getBoundingClientRect();

    e.offsetX = e.clientX - rect.left;
    e.offsetY = e.clientY - rect.top;

    if (this.lastMouseX === -1){
        this.lastMouseX = e.offsetX;
    }
    if (this.lastMouseY === -1){
        this.lastMouseY = e.offsetY;
    }

    if (this.draggedTransformNode){
        this.dragMarker(e.offsetX - this.lastMouseX, e.offsetY - this.lastMouseY);
    }

    this.lastMouseX = e.offsetX;
    this.lastMouseY = e.offsetY;
    
}



X3DOMObject.prototype.dragMarker = function(dx,dy){
    
    var offsetUp    = draggingUpVec.multiply(-dy);
    var offsetRight = draggingRightVec.multiply(dx);

    this.unsnappedDragPos = this.unsnappedDragPos.add(offsetUp).add(offsetRight);

    $(this.draggedTransformNode).attr("translation", this.unsnappedDragPos.toString());
    
    //use callback?
    
}
*//*
X3DOMObject.prototype.stopDraggingMarker = function(e){
    
    this.removeEventListener('mousemove',this.mouseMove,true);
    this.removeEventListener('mouseup',this.mouseup,true);
    
    draggedTransformNode = null;
    draggingUpVec        = null;
    draggingRightVec     = null;
    unsnappedDragPos     = null;
    
    document.getElementById("navInfo").setAttribute("type",'"examine"');
    
}
*/

X3DOMObject.prototype.initInfoWindow = function(){

    //...
    
    /* 
    // position - folowing mouse without delay? aha
    $(this.element).find("canvas").on('mousemove',function(e){
        $("#window-info").css({
            top: (e.originalEvent.clientY+20)+"px",
            left: (e.originalEvent.clientX+20)+"px"
        });
    });
    
    $("#window-info").on('mouseover',function(){
        $(this).hide();
    });
    */
    
}

X3DOMObject.prototype.initViewInfoWindow = function(){
    
    /*
    var el = $("<div>",{id:"messagewindow"}).css({
        position:"absolute",
        bottom:"2px",
        left:"2px",
        "z-index":10,
        background:"red",
        border:"1px solid red",
        "border-radius": "2px",
        color:"white",
        padding:"0px"
    });
    $("body").append(el);
    */

}

X3DOMObject.prototype.showMessage = function(id,msg,bg){

    if (bg != undefined){
        $("#"+id).css({background:bg});
    }
    
    $("#"+id).show();
    
    $("#"+id).html($("<div>").html(msg).css({
        padding:"5px 10px"
    })).show();

}

X3DOMObject.prototype.hideMessage = function(id){

    $("#"+id).hide();

}


X3DOMObject.prototype.registerShapesEvents = function(){
    
    var self = this;

    var tmp = new X3DOMObject.PointerMarker();
    
    var inlines = $(self.element).find("inline");
    
    inlines.each(function(){

        if ($(this).attr("name")!="back"){

            var shapes = $(this).find("Shape");

            shapes.each(function(){
            
                /*
                this.addEventListener('click',function(e){
                    
                    console.log("click1");
                    //console.log(e.worldX+" "+e.worldY+" "+e.worldZ);
                    //createSphere(e.worldX,e.worldY,e.worldZ);
                    
                });
                */
            
                $(this).on("mousemove",function(e){
                    
                    var x = e.originalEvent.worldX;
                    var y = e.originalEvent.worldY;
                    var z = e.originalEvent.worldZ;

                    if (self._ctrlKey||SETTINGS.pointer){
                        X3DOMObject.Marker.place(x,y,z,"sliding_sphere");
                        $("#sliding_sphere").find("switch").attr("whichChoice",0);
                    }else{
                        X3DOMObject.Marker.place(0,0,0,"sliding_sphere");
                        $("#sliding_sphere").find("switch").attr("whichChoice",-1);
                    }

                    
                    /*
                    var v = new x3dom.fields.SFVec3f(x,y,z);
                    
                    //for printing
                    var x = v.x.toFixed(2);
                    var y = v.y.toFixed(2);
                    var z = v.z.toFixed(2);
                    var l = (v.length()).toFixed(1);
                    
                    var msg = "<div>x="+x+"</div>"+
                                "<div>y="+y+"</div>"+
                                "<div>z="+z+"</div>"+
                                "<div>d="+l+"</div>";
                    
                    msg = "<div>"+l+" m</div>";
                                
                    //self.showMessage("infowindow",msg);
                    */

                });
                
                
                $(this).on("click",function(e){

                    console.log(e);
                    
                    /*
                    // when ctrlKey then the mouse is always over pointer marker
                    if (self._ctrlKey){
                        self.placeMarker(e.originalEvent.worldX,e.originalEvent.worldY,e.originalEvent.worldZ);
                    }
                    */
                    
                    if ((self._shiftKey)||(SETTINGS.highlight)){
                        self.toggleShape(this);
                    }
                    
                });
                
                $(this).on("mouseover",function(e){
                
                    /*
                    var tmp = $(self).attr("id");
              
                    if (tmp == undefined){
                        tmp = "missing <b>id</b> attribute";
                    }

                    x3dom.debug.logInfo(tmp);
                    self.showMessage("shapetitle",tmp);
                    */
                
                    // e.ctrlKey will not work because X3DOM does something to events
                    if (self._shiftKey){
            
                        if (self._HIGHLIGHT_ON_MOUSEOVER){
                            self.highlightShape(this);
                        }

                    }
            
                });
            
                $(this).on("mouseout",function(e){

                    self.dehighlightShape(this);
                    //self.placeMarker(0,0,0,"sliding_sphere");
                    //self.hideMessage("shapetitle");
                    //self.resetInfoWindow();

                });
                
                // not working
                /*
                $(this).on("keydown",function(e){
                    console.log("KeyDown");
                    self.highlightShape(self);
                });
                */
                // not working
                /*
                this.addEventListener('keydown',function(e){
                    console.log("should not work!");
                });
                */
                // not working
                /*
                $(this).on("keyup",function(e){
                    console.log("keyup");
                    self.highlightShape(self);
                });
                */
            
            });
        
        }

    });
    
}

X3DOMObject.prototype.highlightShape = function(elem){
    
    var m = $(elem).find("Material[class='hl']");
    
    if (m.length==0){
        m = $("<Material>",{class:'hl'});
        //m.attr("ambientintensity","1");
        //m.attr("shininess","0.2");
        m.attr("emissiveColor","0.1 0.3 0.1");
        $(elem).find("Appearance").append(m);
    }

}

X3DOMObject.prototype.dehighlightShape = function(elem){
    
    var self = this;
    
    $(elem).find("Appearance").find("Material[class='hl']").remove();
    
    m = $(elem).find("Material[class='sl']");
    if (m.length==1){
        self.selectShape(elem);
    }
  
}

X3DOMObject.prototype.toggleShape = function(elem){

    var self = this;
    
    var m = $(elem).find("Material[class='sl']");
        
    if (m.length!=0){
        self.deselectShape(elem);
    }else{
        self.selectShape(elem);
    }
  
}

X3DOMObject.prototype.selectShape = function(elem){
    
  var self = this;
    
  self.deselectShape(elem);
  
  var m = $(elem).find("Material[class='sl']");
  
  m = $("<Material>",{class:'sl'});
  m.attr("emissiveColor","1 1 1");
  //m.attr("transparency","0");
  $(elem).find("Appearance").append(m);
  
}

X3DOMObject.prototype.deselectShape = function(elem){

  var tmpapp = $(elem).find("Appearance").find("Material[class='sl']").remove();

}

X3DOMObject.prototype.createMarker = function(x,y,z,id){

    var self = this;
    
    sph_class = "";
    
    var index = null;
    
    if ((id=="")||(id==undefined)){
        sph_class = "my-markers";
        index = $("."+sph_class).length;
        id = "my-sph-"+index;
    }

    var html = `
    <group id='`+id+`' class='`+sph_class+`'>
    <switch whichChoice='0'>
    <transform translation='`+x+` `+y+` `+z+`' rotation='0 0 0 0'>
        <shape class='shapemarker'> 
        <appearance> 
            <material diffuseColor='0.07 1 0.07' transparency='0.0'></material> 
        </appearance> 
        <Sphere DEF="sphere" radius="1" />
        </shape> 
    </transform>
    </switch>
    </group>
    `;
    
    var sphere_element = $(html);
    
    $(this.element).find("scene").append(sphere_element);
    
    var shape = $(sphere_element).find("shape");
    var id_prefix = $(sphere_element).attr("id").substr(0,7);
    
    return sphere_element;
    // sphere events
    // Drag, select, delete
    // Data.push()
    
}

X3DOMObject.prototype.updateMarkersIndices = function(){
    
    $(this.element).find(".my-markers").each(function(i,v){

        $(this).attr("id","my-sph-"+i);

    });
    // sphere events
    // Drag, select, delete
    // Data.push()
    
}

X3DOMObject.prototype.placeMarker = function(x,y,z,id){

    var tr = $("#"+id).find("transform");  
    $(tr).attr("translation",x+" "+y+" "+z);

}

X3DOMObject.prototype.highlightMarker = function(index){
    
    var color = "1 0.5 0.5";
    
    $("#my-sph-"+index).find('material').attr("diffuseColor",color);
    
}

X3DOMObject.prototype.dehighlightMarker = function(index){

    var elem = $("#my-sph-"+index).find('material');
    var color = "0.07 1 0.07";

    if (!elem.prop("selected")){
        elem.attr("diffuseColor",color);
    }

}

X3DOMObject.prototype.toggleMarker = function(index){

    var elem = $("#my-sph-"+index).find('material');
    var color = elem.attr("diffuseColor");

    if (elem.prop("selected")){
        elem.prop("selected",false);
    }else{
        elem.prop("selected",true);
    }

}

X3DOMObject.prototype.getViewDirection = function(){
    
    var elem = this.element;
    
    var vp_mat = elem.runtime.viewMatrix();
    
    var vMatInv  = vp_mat.inverse();
    var viewDir  = vMatInv.multMatrixVec(new x3dom.fields.SFVec3f(0.0, 0.0, -1.0));
    
    var angle = Math.atan2(viewDir.x,-viewDir.z)*180/Math.PI;
    
    return angle;
    
}

X3DOMObject.prototype.getViewTranslation = function(){

    var elem = this.element;

    var vp_mat = elem.runtime.viewMatrix().inverse();
    //var vp_rotation = new x3dom.fields.Quaternion(0, 0, 1, 0);

    //vp_rotation.setValue(vp_mat);

    var vp_translation = vp_mat.e3();

    return vp_translation;

}

// Marker
X3DOMObject.Marker = function(x,y,z){
    
    this._x = x || 0;
    this._y = y || 0;
    this._z = z || 0;
    
    this.init();
    
}

X3DOMObject.Marker.prototype.init = function(){
    
    this._elem = Scene.createMarker(this._x,this._y,this._z);
    this._shape = this._elem.find("shape");
    this._registerEvents();
    
}




X3DOMObject.Marker.prototype._registerEvents = function(){
    
    var PREFIX = "my-sph-";
    
    var self = this;
    var marker = this._shape;
    var id_prefix = $(this._elem).attr("id").substr(0,PREFIX.length);
    var index = parseInt($(this._elem).attr("id").substr(PREFIX.length));
    
    marker.on('click',function(e){
        
        //self.dehighlight();
        //X3DOMObject.PointerMarker.dehighlight(self._elem);
        
        if (Scene._ctrlKey){

            if (id_prefix==PREFIX){

                self._elem.remove();
                
                // REMOVE
                Data.markers.splice(index);
                Scene.updateMarkersIndices();
                
                Map.deleteMarker(index);
                
            }

        }else{

            X3DOMObject.Marker.toggle(self._elem);
            Map.toggleMarker(index);

        }
        
    });
    
    marker.on('mouseover',function(e){
        
        X3DOMObject.Marker.highlight(self._elem);
        Map.highlightMarker(index);
        Scene.highlighted_marker_index = index;
        
        if (Scene._ctrlKey){
            if (id_prefix==PREFIX){
                $("#sliding_sphere").find("switch").attr("whichChoice",-1);
            }
        }
        
    });

    /*
    marker.addEventListener('mouseover',function(){
        
        Scene.showMessage("infowindow","X");
        
    },true);
    */
    
    marker.on('mouseout',function(e){
        
        //self.highlightMarker(index);
        Scene.highlighted_marker_index = null;

        if (Scene.draggedTransformNode==null){
            
            if (!self._elem.prop("selected")){
                X3DOMObject.Marker.dehighlight(self._elem);
                Map.dehighlightMarker(index);
            }else{
                X3DOMObject.Marker.highlight(self._elem);
                Map.highlightMarker(index);
            }

        }
        
    });
    
    marker.on('mousedown',function(e){

        X3DOMObject.Marker.dehighlight(self._elem);
        Map.dehighlightMarker(index);
        
        document.getElementById("navInfo").setAttribute("type", '"NONE"');
        
        Scene.lastMouseX = event.offsetX;
        Scene.lastMouseY = event.offsetY;
        
        X3DOMObject.Marker.dragStart(this);

        //$(this).on('mousemove',x3d_markerDrag);
        /*
        $(Scene.element).on('mousemove',function(){
            console.log("preMouseMove");
            x3d_sceneMouseMove2();
        },true);
        */

        Scene.element.addEventListener('mousemove',X3DOMObject.Marker.mouseMove,true);
        Scene.element.addEventListener('mouseup',X3DOMObject.Marker.mouseUp,true);
                
    });
    
    marker.on('mouseup',function(e){

        X3DOMObject.Marker.highlight(self._elem);
        Map.highlightMarker(index);

    });
    
}

X3DOMObject.Marker.mouseUp = function(){

    var elem = Scene.draggedTransformNode.parent().parent();

    // click is already bound
    /*
    if (!Scene.markerdragged){
        X3DOMObject.Marker.toggle(elem);
    }
    */
    
    Scene.element.removeEventListener('mousemove',X3DOMObject.Marker.mouseMove,true);
    Scene.element.removeEventListener('mouseup',X3DOMObject.Marker.mouseUp,true);
    
    Scene.draggedTransformNode = null;
    Scene.draggingUpVec        = null;
    Scene.draggingRightVec     = null;
    Scene.unsnappedDragPos     = null;
    Scene.markerdragged = false;
    
    document.getElementById("navInfo").setAttribute("type",'"examine"');
    
}

// from https://x3dom.org/x3dom/example/MovingObjectsWithDOMEvents.html
X3DOMObject.Marker.dragStart = function(elem){

    // move up from <shape> to <transform>
    var transformNode = $(elem).parent();
    var tr0 = $(transformNode).attr("translation");

    Scene.draggedTransformNode = transformNode; 

    Scene.unsnappedDragPos = new x3dom.fields.SFVec3f.parse(tr0);
    
    //compute the dragging vectors in world coordinates
    //(since navigation is disabled, those will not change until dragging has been finished)
    
    var vMatInv = Scene.element.runtime.viewMatrix().inverse();
    var viewDir = vMatInv.multMatrixVec(new x3dom.fields.SFVec3f(0.0, 0.0, -1.0));

    //use the viewer's up-vector and right-vector
    Scene.draggingUpVec    = vMatInv.multMatrixVec(new x3dom.fields.SFVec3f(0.0, 1.0,  0.0));
    Scene.draggingRightVec = viewDir.cross(Scene.draggingUpVec);

    var p1 = Scene.element.runtime.calcCanvasPos(Scene.unsnappedDragPos.x, Scene.unsnappedDragPos.y, Scene.unsnappedDragPos.z);
    var p2 = Scene.element.runtime.calcCanvasPos(Scene.unsnappedDragPos.x + Scene.draggingRightVec.x,
                                         Scene.unsnappedDragPos.y + Scene.draggingRightVec.y,
                                         Scene.unsnappedDragPos.z + Scene.draggingRightVec.z);

    var magnificationFactor = 1.0 / Math.abs(p1[0] - p2[0]);

    //scale up vector and right vector accordingly            
    Scene.draggingUpVec    = Scene.draggingUpVec.multiply(magnificationFactor);
    Scene.draggingRightVec = Scene.draggingRightVec.multiply(magnificationFactor);
    
}

X3DOMObject.Marker.mouseMove = function(event){
    
    Scene.markerdragged = true;
    
    X3DOMObject.Marker.highlight(Scene.draggedTransformNode.parent().parent());
    
    //offsetX / offsetY polyfill for FF
    var target = event.target || event.srcElement;
    var rect = target.getBoundingClientRect();

    event.offsetX = event.clientX - rect.left;
    event.offsetY = event.clientY - rect.top;

    if (Scene.lastMouseX === -1){
        Scene.lastMouseX = event.offsetX;
    }
    if (Scene.lastMouseY === -1){
        Scene.lastMouseY = event.offsetY;
    }

    if (Scene.draggedTransformNode){
        X3DOMObject.Marker.drag(event.offsetX - Scene.lastMouseX, event.offsetY - Scene.lastMouseY);
    }

    Scene.lastMouseX = event.offsetX;
    Scene.lastMouseY = event.offsetY;
    
}

X3DOMObject.Marker.drag = function(dx,dy){
 
    var offsetUp    = Scene.draggingUpVec.multiply(-dy);
    var offsetRight = Scene.draggingRightVec.multiply(dx);

    Scene.unsnappedDragPos = Scene.unsnappedDragPos.add(offsetUp).add(offsetRight);

    $(Scene.draggedTransformNode).attr("translation", Scene.unsnappedDragPos.toString());

    var sphere = $(Scene.draggedTransformNode).parent().parent();
    var index = parseInt(sphere.attr("id").substr(7));

    var c = Data.markers[index];
    
    c.x = Scene.unsnappedDragPos.x;
    c.y = Scene.unsnappedDragPos.y;
    c.z = Scene.unsnappedDragPos.z;
    
    var azimuth = Math.atan2(c.x,-c.z)*180/Math.PI;
    //var initial_heading = Data.camera.heading;
    var distance = Math.sqrt(c.x*c.x+c.z*c.z);
    
    var p1_ll = Map.marker._latlng;
    var p2_ll = p1_ll.CoordinatesOf(azimuth+INIT_HEADING,distance);
    
    c.latitude = p2_ll.lat;
    c.longitude = p2_ll.lng;
    c.altitude = c.y;
    
    Map.marker.moveMeasureMarker(p2_ll,index);
    
}

X3DOMObject.Marker.place = function(x,y,z,id){

    var tr = $("#"+id).find("transform");  
    $(tr).attr("translation",x+" "+y+" "+z);

}

X3DOMObject.Marker.highlight = function(elem){
    
    var color = "1 0.5 0.5";
    elem.find('material').attr("diffuseColor",color); 
    
}

X3DOMObject.Marker.dehighlight = function(elem){
    
    var color = "0.07 1 0.07";
    elem.find('material').attr("diffuseColor",color);
    
}

X3DOMObject.Marker.toggle = function(elem){
    
    if (elem.prop("selected")){
        elem.prop("selected",false);
    }else{
        elem.prop("selected",true);
    }
    
}
// PointerMarker

X3DOMObject.PointerMarker = function(){
  
    //init
    this._init();
  
};

X3DOMObject.PointerMarker.prototype._init = function(){

    this._elem = Scene.createMarker(0,0,0,"sliding_sphere");;
    this._shape = this._elem.find("shape");
    this._registerEvents();
    
    this._elem.find("switch").attr("whichChoice",-1);
    
}

X3DOMObject.PointerMarker.prototype._registerEvents = function(){
    
    var self = this;
    var Camera = Map.marker;

    self._shape.on("click",function(e){
        
        X3DOMObject.Marker.dehighlight(self._elem);
        
        var xyz = $(this).parent().attr("translation");
        xyz = xyz.split(" ");
        
        // Create marker for Data
        var mark = new X3L({
            x: parseFloat(xyz[0]) || 0,
            y: parseFloat(xyz[1]) || 0,
            z: parseFloat(xyz[2]) || 0
        });
        Data.markers.push(mark);

        // Create marker on the scene
        new X3DOMObject.Marker(mark.x,mark.y,mark.z);

        // Create marker on the map
        var azimuth = Math.atan2(mark.x,-mark.z)*180/Math.PI;
        var distance = Math.sqrt(mark.x*mark.x+mark.z*mark.z);

        Camera.createMeasureMarker(azimuth+INIT_HEADING,distance);
        
        var map_mark = Camera._measureMarkers[Camera._measureMarkers.length-1];
        
        // Update marker in Data
        mark.latitude = map_mark._latlng.lat;
        mark.longitude = map_mark._latlng.lng;
        
        // register events for a new marker in Data
        X3DOMObject.MapMarker.registerEvents(map_mark);
        
        // need?
        Camera._syncMeasureMarkersToBasePoint();

    });
    
    self._shape.on("mousedown",function(e){

        X3DOMObject.Marker.highlight(self._elem);

    });
    
}

X3DOMObject.MapMarker = {};

X3DOMObject.MapMarker.registerEvents = function(map_mark){
    
        var Camera = Map.marker;
    
        map_mark.on('mouseover',function(){
            
            var index = this._index;
            var elem = $("#my-sph-"+index);

            X3DOMObject.Marker.highlight(elem);
            Map.highlightMarker(index);
            
        });
        
        map_mark.on('mouseout',function(){
            
            var index = this._index;
            var elem = $("#my-sph-"+index);
            
            if (Camera.draggedMarker._index!=index){                
                if (!this._selected){
                    X3DOMObject.Marker.dehighlight(elem);
                    Map.dehighlightMarker(index);
                }
            }

        });
        
        /*
        map_mark.on('click',function(e){
            
            var index = this._index
            var elem = $("#my-sph-"+index);
            
            X3DOMObject.Marker.toggle(elem);
            Map.toggleMarker(index);
            
            //if ctrl - remove
            //Data.markers.splice(index);
            //Scene.updateMarkersIndices();

        });
        */
        
        map_mark.on('mousedown',function(){
            
            var index = this._index;
            var elem = $("#my-sph-"+index);
            
            X3DOMObject.Marker.dehighlight(elem);
            Map.dehighlightMarker(index);
            
        });
    
        map_mark.on('mouseup',function(e){
            
            var index = this._index;
            var elem = $("#my-sph-"+index);
                    
            if (e.originalEvent.ctrlKey){
                
                // from Data
                Data.markers.splice(index);
                
                // from Map (indices get updated)
                Map.deleteMarker(index);
                
                // from Scene
                elem.remove();
                Scene.updateMarkersIndices();
                
            }else{

                X3DOMObject.Marker.toggle(elem);
                Map.toggleMarker(index);
                
                X3DOMObject.Marker.highlight(elem);
                Map.highlightMarker(index);
            
            }
            
        });
    
}

X3DOMObject.displayInfo = function(e){
    
        var elem = Scene.element;

        var mouse = x3dom_getXYPosOr(e.clientX,e.clientY,true);
        
        var dist = 1000;
        
        $("#window-info").css({"font-size":"20px"});
        
        if (mouse.d_xz != null){

            var dist_msg = "";
            var id_msg = "";
            
            if (SETTINGS.moreinfo){
                
                $("#window-info").css({"font-size":"16px"});
                
                var st = mouse.id;
                
                id_msg = (st===undefined)?"n/a":st;
                
                dist_msg += "<table>";
                dist_msg += "<tr><th align='center'>shape id</td><td>"+id_msg+"</td></tr>";
                dist_msg += "</table><table>";
                dist_msg += "<tr><th align='center'>d<sub>xz</sub></td><td>"+mouse.d_xz+" m</td></tr>";
                dist_msg += "<tr><th align='center'>d<sub>xyz</sub></td><td>"+mouse.d_xyz+" m</td></tr>";
                dist_msg += "</table>";
                
            }else{

                dist_msg = mouse.d_xz+" m";

            }

            dist = parseFloat(mouse.d_xz);

        }else{

            dist_msg = "&infin; m";

        }

        var msg = "<div>"+dist_msg+"</div>";

        Scene.showMessage("window-info",msg);

        return dist;

}

X3DOMObject.displayViewInfo = function(e){
    
    if (!e.target){
        e.clientX = $(window).width()/2;
        e.clientY = $(window).height()/2;
    }
    
    var mouse = x3dom_getXYPosOr(e.clientX,e.clientY,true);
    mouse.s = "0";
    
    var camera = x3dom_getCameraPosOr(true);
    
    // ?!!!
    //Map.marker.setAltitude(camera.y);
    //Map.marker.setElevation(camera.e*Math.PI/180);
    
    var msg = `
<table>
<tr>
    <td></td>
    <td colspan='3' align='center'>position, m</td>
    <td colspan='3' align='center'>orientation, &deg;</td>
</tr>
<tr>
    <th></th>
    <th style='width:50px;'>x</th>
    <th style='width:50px;'>y</th>
    <th style='width:50px;'>z</th>
    <th>azimuth</th>
    <th>elevation</th>
    <th>skew</th>
</tr>
<tr>
    <td>mouse</td>
    <td>`+mouse.x+`</td>
    <td>`+mouse.y+`</td>
    <td>`+mouse.z+`</td>
    <td>`+mouse.a+`</td>
    <td>`+mouse.e+`</td>
    <td>`+mouse.s+`</td>
</tr>
<tr>
    <td>camera</td>
    <td>`+camera.x+`</td>
    <td>`+camera.y+`</td>
    <td>`+camera.z+`</td>
    <td>`+camera.a+`</td>
    <td>`+camera.e+`</td>
    <td>`+camera.s+`</td>
</tr>
</table>
`;
    
    if (SETTINGS.viewinfo){
        Scene.showMessage("window-viewinfo",msg);
    }else{
        Scene.hideMessage("window-viewinfo");
    }
}

// various calcs

function x3dom_getXYPosOr(cnvx,cnvy,round){
    
    var elem = Scene.element;

    var x,y,z;
    var az,el,sk;
    var id;

    var dist_xyz = 1000;
    var dist_xz = 1000;

    var shootRay = elem.runtime.shootRay(cnvx,cnvy);
    
    if (shootRay.pickPosition != null){
        
        var index = Scene.highlighted_marker_index;    
        
        if ((index==null)||(Data.markers[index]==undefined)){
        
            x = shootRay.pickPosition.x;
            y = shootRay.pickPosition.y;
            z = shootRay.pickPosition.z;
            
        }else{
            
            x = Data.markers[index].x;
            y = Data.markers[index].y;
            z = Data.markers[index].z;
            
        }
        
        dist_xz  = Math.sqrt(x*x+z*z);
        dist_xyz = Math.sqrt(y*y+dist_xz*dist_xz);
        
        if (round){
            dist_xz.toFixed(2);
            dist_xyz.toFixed(2);
        }
        
        id = $(shootRay.pickObject).attr("id");
        
    }else{
        
        var viewingRay = elem.runtime.getViewingRay(cnvx,cnvy);
        
        x = viewingRay.dir.x;
        y = viewingRay.dir.y;
        z = viewingRay.dir.z;
        
        dist_xz = null;
        dist_xyz = null;
    }
    
    az = Math.atan2(x,-z)*180/Math.PI;
    az = (az+INIT_HEADING+360)%360;
    el = Math.atan2(y,Math.sqrt(x*x+z*z))*180/Math.PI;
    sk = 0;
    
    var result = {
        x: !round? x : x.toFixed(2),
        y: !round? y : y.toFixed(2),
        z: !round? z : z.toFixed(2),
        
        a: !round? az : az.toFixed(1),
        e: !round? el : el.toFixed(1),
        s: !round? sk : sk.toFixed(1)
    };
    
    if (dist_xz!=null){
        result.d_xz = !round? dist_xz : dist_xz.toFixed(1);
        result.d_xyz = !round? dist_xyz : dist_xyz.toFixed(1);
    }else{
        result.d_xz = dist_xz;
        result.d_xyz = dist_xyz;
    }
    
    result.id = id;
    
    return result;

}

function x3dom_getCameraPosOr(round){
    
    var elem = Scene.element;
    
    var vm = elem.runtime.viewMatrix().inverse();
    
    var tr = vm.e3();
    
    var x = tr.x;
    var y = tr.y;
    var z = tr.z;
    
    var R = vm;
    
    var az = Math.atan2(R._02,R._22)*180/Math.PI;
    
    az = (az+INIT_HEADING+360)%360;
    
    var el = -Math.asin(R._12)*180/Math.PI;

    var sk = Math.atan2(R._10,R._11);
    
    if (!round){
        return {
            x: x,
            y: y,
            z: z,
            a: az,
            e: el,
            s: sk
        };
    }else{
        return {
            x: x.toFixed(2),
            y: y.toFixed(2),
            z: z.toFixed(2),
            a: az.toFixed(1),
            e: el.toFixed(1),
            s: sk.toFixed(1)
        };        
    }
    
}

function x3dom_setUpRight(){

    var mat = Scene.element.runtime.viewMatrix().inverse();
    
    var from = mat.e3();
    var at = from.subtract(mat.e2());

    var up = new x3dom.fields.SFVec3f(0, 1, 0);
    
    var s = mat.e2().cross(up).normalize();
    
    var newup = mat.e2().cross(s).normalize().negate();
    
    //at = from.add(v);
    
    mat = x3dom.fields.SFMatrix4f.lookAt(from, at, newup);
    //mat = mat.inverse();
    
    //var m1  = x3dom.fields.SFMatrix4f.translation(from);
    //var m1n = x3dom.fields.SFMatrix4f.translation(from.negate());
    
    //mat = m1.mult(mat).mult(m1n);
    
    var Q = new x3dom.fields.Quaternion(0,0,1,0);
    Q.setValue(mat);
    var AA = Q.toAxisAngle();

    var viewpoint = $(Scene.element).find("Viewpoint");
    viewpoint.attr("position",mat.e3().toString());
    viewpoint.attr("centerOfRotation",mat.e3().toString());
    viewpoint.attr("orientation",AA[0].toString()+" "+AA[1]);

}

function x3dom_rotation(delta_a){
    
    /* 
     * Printing values:
     * 
     *   var mat = Scene.element.runtime.viewMatrix().inverse();
     *   var rotation = new x3dom.fields.Quaternion(0, 0, 1, 0);
     *   rotation.setValue(mat);
     *   var translation = mat.e3();
     * 
     */
    
    var mat = Scene.element.runtime.viewMatrix();

    mat = mat.inverse();
    //console.log(mat.toString());

    var from = mat.e3();
    var at = from.subtract(mat.e2());
    var up = mat.e1();
    
    var q0 = x3dom.fields.Quaternion.axisAngle(up, -delta_a);
    var m0 = q0.toMatrix();
    
    var m1  = x3dom.fields.SFMatrix4f.translation(from);
    var m1n = x3dom.fields.SFMatrix4f.translation(from.negate());
    
    var mres = m1.mult(m0).mult(m1n);
    
    newat = mres.multMatrixPnt(at);
    
    newmat = x3dom.fields.SFMatrix4f.lookAt(from, newat, up);
        
    var Q = new x3dom.fields.Quaternion(0,0,1,0);
    //Q.setValue(newmat.inverse());
    Q.setValue(newmat);
    var AA = Q.toAxisAngle();
    
    var viewpoint = $(Scene.element).find("Viewpoint");
    viewpoint.attr("orientation",AA[0].toString()+" "+AA[1]);
    viewpoint.attr("position",from.toString());
    viewpoint.attr("centerOfRotation",from.toString());
    
}

// horizontal?
function x3dom_translation(dx,dy,dz){
    
    var mat = Scene.element.runtime.viewMatrix().inverse();
    var tr = mat.e3();

    var x = tr.x+dx;
    var y = tr.y+dy;
    var z = tr.z+dz;

    var viewpoint = $(Scene.element).find("Viewpoint");
    viewpoint.attr("position",x+" "+y+" "+z);
    viewpoint.attr("centerOfRotation",x+" "+y+" "+z);

}

function x3dom_altelev(alt,elev){

    //x3dom_matrix_test();

    var mat = Scene.element.runtime.viewMatrix().inverse();

    var from = mat.e3();
    from.y = alt;

    var az = Math.atan2(mat._02,mat._22);
    var el = elev;
    var sk = Math.atan2(mat._10,mat._11);

    var matx = x3dom.fields.SFMatrix4f.rotationX(el);
    var maty = x3dom.fields.SFMatrix4f.rotationY(az);
    var matz = x3dom.fields.SFMatrix4f.rotationZ(sk);
    var matt  = x3dom.fields.SFMatrix4f.translation(from);

    var newmat = matt.mult(maty).mult(matx).mult(matz);

    var Q = new x3dom.fields.Quaternion(0,0,1,0);
    Q.setValue(newmat);
    var AA = Q.toAxisAngle();

    var viewpoint = $(Scene.element).find("Viewpoint");
    viewpoint.attr("position",newmat.e3().toString());
    viewpoint.attr("centerOfRotation",newmat.e3().toString());
    viewpoint.attr("orientation",AA[0].toString()+" "+AA[1]);
    
}

function x3dom_matrix_test(){
    
    var viewpoint = $(Scene.element).find("Viewpoint");
    
    console.log("Viewpoint DOM element");
    console.log("position: "+viewpoint.attr("position"));
    console.log("orientation: "+viewpoint.attr("orientation"));
    
    var mat = Scene.element.runtime.viewMatrix().inverse();
    
    console.log("inversed viewMatrix");
    console.log(mat.toString());    
    
    var from = mat.e3();
    var at = from.subtract(mat.e2());
    var up = mat.e1();
    
    console.log("matrix from from-at-up");
    
    var newmat = x3dom.fields.SFMatrix4f.lookAt(from, at, up);
    
    console.log(newmat.toString());
    
    var R = mat;
    var az = Math.atan2(R._02,R._22)*180/Math.PI;
    //az = (az+INIT_HEADING+360)%360;
    //az = (az+360)%360;
    var el = -Math.asin(R._12)*180/Math.PI;
    var sk = Math.atan2(R._10,R._11);
    
    console.log("Angles:");
    console.log("az="+az+" el="+el+" sk="+sk);
    
    
    console.log("matrix from angles");    
    
    var matx = x3dom.fields.SFMatrix4f.rotationX(el*Math.PI/180);
    var maty = x3dom.fields.SFMatrix4f.rotationY(az*Math.PI/180);
    var matz = x3dom.fields.SFMatrix4f.rotationZ(sk*Math.PI/180);
    
    var m1  = x3dom.fields.SFMatrix4f.translation(from);
    var m1n = x3dom.fields.SFMatrix4f.translation(from.negate());
    
    var newmat = maty.mult(matx).mult(matz);
    
    console.log(newmat.toString());
    
}



