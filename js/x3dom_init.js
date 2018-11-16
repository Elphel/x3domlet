/*

  Copyright (C) 2017 Elphel Inc.

  License: GPL-3.0+

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

var X3DOMObject = function(element,data,options){

    this.element = element;
    this.data = data;

    var defaults = {
        debug: true,        // {boot}, unused
        highlight: true,    // {bool}, highlight surfaces on mouseover
        fov: 30*Math.PI/180,// {rad}, default vertical fov
        fov_step: 0.025,    // {rad}, min change
    };

    this._settings = $.extend(defaults,options);

    this._DEBUG = this._settings.debug;
    this._FOV = this._settings.fov;
    this._FOV_STEP = this._settings.fov_step;
    this._HIGHLIGHT_ON_MOUSEOVER = this._settings.highlight;

    // tmp vars
    this._resizeTimer = false;
    this._eventCtrlKey = false;

    this.highlighted_marker_index = null;
    this.old_view_translation = null;

    // status vars
    this._X3DOM_SCENE_INIT_BACK_DONE = false;
    this._X3DOM_SCENE_INIT_DONE = false;

    this._ctrlKey = false;
    this._shiftKey = false;
    this._stored_x3dom_event = null;

    this.markInfoIndex = null;

};

// ui, window
X3DOMObject.prototype.initResize = function(){

    var self = this;

    self.resize();

    //bind resize
    $(window).resize(function(){
        clearTimeout(self.resizeTimer);
        self.resizeTimer = window.setTimeout(function(){
            self.resize();
        },100);
    });

}

// ui, window
X3DOMObject.prototype.resize = function(){

    var self = this;

    var w = $(window).width();
    var h = $(window).height();

    $(self.element).attr("width",w);
    $(self.element).attr("height",h);

    $(self.element).css({
      width: w+"px",
      height: h+"px"
    });

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
    //console.log(fov);

    self.setFoV(fov);

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

/**
 * Intercept scroll and change field of view instead of moving the observer,
 * which was the default action
 */
X3DOMObject.prototype.FoVEvents = function(){

    var self = this;
    // true = CAPTURING = from parent to child
    // canvas is a child of x3d

    //Chrome?!
    self.element.addEventListener('mousewheel',function(e){
        var delta = e.deltaY>0 ? 1 : -1;
        self.changeFoV(delta*self._FOV_STEP);
        // prevent zoom
        e.preventDefault();
        e.stopPropagation();
        return false;
    },true);

    //Firefox?!
    self.element.addEventListener('DOMMouseScroll',function(e){
        var delta = e.detail>0 ? 1 : -1;
        self.changeFoV(delta*self._FOV_STEP);
        // prevent zoom
        e.preventDefault();
        e.stopPropagation();
        return false;
    },true);


}

/**
 * Change by delta
 * @val {rad}
 */
X3DOMObject.prototype.changeFoV = function(val){

    var fov = this.getFoV()+val;
    this.setFoV(fov);

    // update Map
    Map.marker.setFoV(fov);

}

/**
 * Set by @val rad
 */
X3DOMObject.prototype.setFoV = function(val){

    var vp = $(this.element).find("Viewpoint")[0];
    $(vp).prop("fieldOfView",val);

    // apply to all viewpoints, but:
    // https://doc.x3dom.org/author/Navigation/Viewpoint.html
    // = correct field of view is not guaranteed in X3DOM
    /*
    $(self.element).find("Viewpoint").each(function(){
        $(this).attr("fieldOfView",fov);
    });
    */

}

/**
 * Read property from DOM element
 */
X3DOMObject.prototype.getFoV = function(){

    var vp = $(this.element).find("Viewpoint")[0];
    return parseFloat($(vp).prop("fieldOfView"));

}

/**
 * Remember which key is pressed - used for mouse moving / dragging
 */
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

    self.element.addEventListener('keypress',function(e){
        if (e.key=="r"){
          //reset to initial position - no tilt = horizontal
          $("#reset_view").click();
        }else if(e.key=="t"){
          //reset to initial position with tilt
          reset_to_initial_position("t");
        }
    });

}

/**
 * The 3D model building blocks are shapes
 */
X3DOMObject.prototype.ShapeEvents = function(){

    var self = this;

    var tmp = new X3DOMObject.PointerMarker();

    var inlines = $(self.element).find("inline");

    inlines.each(function(){

        console.log("binding inline: "+$(this).attr("name"));

        if ($(this).attr("name")!="back"){

            var shapes = $(this).find("Shape");

            shapes.each(function(){

                new X3DOMObject.Shape(this);

            });

        }

    });

}

/**
 * <shape> DOM elements
 */

X3DOMObject.Shape = function(element){

    this._elem  = element
    this._clearEvents();
    this._registerEvents();

}

X3DOMObject.Shape.prototype._clearEvents = function(){

  $(this._elem).off("mousemove");
  $(this._elem).off("click");
  $(this._elem).off("mouseover");
  $(this._elem).off("mouseout");

}

X3DOMObject.Shape.prototype._registerEvents = function(){

    var self = Scene;

    $(this._elem).on("mousemove",function(e){

        if(!SETTINGS.manualposor){

          var x = e.originalEvent.worldX;
          var y = e.originalEvent.worldY;
          var z = e.originalEvent.worldZ;

          var xyz = zNear_bug_correction([x,y,z]);

          x = xyz[0];
          y = xyz[1];
          z = xyz[2];

          // (not used atm) store x3dom event to use in normal events
          self._stored_x3dom_event = e.originalEvent;

          if (self._ctrlKey||SETTINGS.pointer){

              // place pointer marker
              X3DOMObject.PointerMarker.updatePars();

              X3DOMObject.Marker.place(x,y,z,"sliding_sphere");
              $("#sliding_sphere").find("switch").attr("whichChoice",0);

          }else{

              // place at 0,0,0 and hide
              X3DOMObject.Marker.place(0,0,0,"sliding_sphere");
              $("#sliding_sphere").find("switch").attr("whichChoice",-1);

          }

        }else{

          // for align marker? do nothing

        }

        /*
        if (!SETTINGS.verticaldrag&&Scene.draggedMarker){

            console.log("dragging not vertically");
            //$(Scene.draggedMarker) - get id
            var sphere = $(Scene.draggedMarker).parent().parent();

            console.log(Scene.draggedMarker.parent().parent());

            var index = parseInt(sphere.attr("id").substr(7));

            console.log(index);

            X3DOMObject.Marker.place(x,y,z,"my-sph-"+index);

        }
        */
    });


    $(this._elem).on("click",function(e){

        // if self._shiftKey then the mouse will always be over the pointer marker

        if ((self._shiftKey)||(SETTINGS.highlight)){
            if (!SETTINGS.manualposor){
              X3DOMObject.Shape.toggle(this);
            }
        }

        if (self._ctrlKey){

          if(!SETTINGS.manualposor){

            var x = e.originalEvent.worldX;
            var y = e.originalEvent.worldY;
            var z = e.originalEvent.worldZ;

            var xyz = zNear_bug_correction([x,y,z]);

            x = xyz[0];
            y = xyz[1];
            z = xyz[2];

            X3DOMObject.createNewMarker(x,y,z);

          }else{

            // align marker
            var lx = e.originalEvent.layerX;
            var ly = e.originalEvent.layerY;

            manualposor_init_shootrays(lx,ly);

          }

        }

        /*
        console.log("Shape event: ");
        console.log("  canvas: x= "+e.originalEvent.layerX+" y= "+e.originalEvent.layerY);
        console.log("  scene: x= "+e.originalEvent.worldX+" y= "+e.originalEvent.worldY+" z="+e.originalEvent.worldZ);
        */

    });

    $(this._elem).on("mouseover",function(e){

        // e.ctrlKey will not work because X3DOM does something to events
        if (self._shiftKey){

            if (self._HIGHLIGHT_ON_MOUSEOVER&&!SETTINGS.manualposor){
                X3DOMObject.Shape.highlight(this);
            }

        }

    });

    $(this._elem).on("mouseout",function(e){

        X3DOMObject.Shape.dehighlight(this);

    });

}

X3DOMObject.Shape.highlight = function(elem){

    var m = $(elem).find("Material[class='hl']");

    if (m.length==0){
        m = $("<Material>",{class:'hl'});
        //m.attr("ambientintensity","1");
        //m.attr("shininess","0.2");
        m.attr("emissiveColor","0.1 0.3 0.1");
        $(elem).find("Appearance").append(m);
    }

}

X3DOMObject.Shape.dehighlight = function(elem){

    var self = this;

    $(elem).find("Appearance").find("Material[class='hl']").remove();

    m = $(elem).find("Material[class='sl']");
    if (m.length==1){
        X3DOMObject.Shape.select(elem);
    }

}

X3DOMObject.Shape.toggle = function(elem){

    var self = this;

    var m = $(elem).find("Material[class='sl']");

    if (m.length!=0){
        X3DOMObject.Shape.deselect(elem);
    }else{
        X3DOMObject.Shape.select(elem);
    }

}

X3DOMObject.Shape.select = function(elem){

  var self = this;

  X3DOMObject.Shape.deselect(elem);

  var m = $(elem).find("Material[class='sl']");

  m = $("<Material>",{class:'sl'});
  m.attr("emissiveColor","1 1 1");
  //m.attr("transparency","0");
  $(elem).find("Appearance").append(m);

}

X3DOMObject.Shape.deselect = function(elem){

  var tmpapp = $(elem).find("Appearance").find("Material[class='sl']").remove();

}

/**
 * Create marker at x,y,z (need global)
 */
X3DOMObject.prototype.createMarker = function(x,y,z,id){

    var self = this;

    var sph_class = "";

    var index = null;

    var color = convert_color_l2x(SETTINGS.markercolor);
    var size = x3dom_markersize()/2;

    if ((id=="")||(id==undefined)){
        sph_class = "my-markers";
        index = $("."+sph_class).length;
        id = "my-sph-"+index;
        color = convert_color_l2x(self.data.markers[index].color);
        size  = self.data.markers[index].size/2;
    }

    var html = [
      '<group id="'+id+'" class="'+sph_class+'">',
      '  <switch whichChoice="0">',
      '    <transform translation="'+x+' '+y+' '+z+'" rotation="0 0 0 0">',
      '      <shape class="shapemarker">',
      '        <appearance>',
      '          <material diffuseColor="'+color+'" transparency="0.3" myColor="'+color+'"></material>',
      '        </appearance>',
      '        <Sphere DEF="sphere" radius="'+size+'" />',
      '      </shape>',
      '    </transform>',
      '  </switch>',
      '</group>'
    ].join('\n');

    var sphere_element = $(html);

    $('scene',this.element).append(sphere_element);

    //var shape = $(sphere_element).find("shape");
    //var id_prefix = $(sphere_element).attr("id").substr(0,7);

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

/**
 *  Marker object - which is a sphere of 1m radius
 *  @ylevel - level height
 */
X3DOMObject.Marker = function(x,y,z,ylevel){

    this._x = x || 0;
    this._y = y || 0;
    this._z = z || 0;
    this._ylevel = ylevel || false;

    this.init();

}


X3DOMObject.Marker.prototype.init = function(){

    // this branch is experimental and inactive
    if (this._ylevel){

        //console.log(this._x+" "+this._y+" "+this._z);

        // temporary solution is to shoot rays - very slow
        var cPos = Scene.element.runtime.calcCanvasPos(this._x,this._y,this._z);

        var cx = cPos[0];
        var cy = 0;
        var x,y,z,d0,d1;
        var sr;

        d0 = Math.sqrt(this._x*this._x+this._z*this._z);

        for(var i=0;i<$(window).height();i++){

            sr = Scene.element.runtime.shootRay(cx,cy);

            if (sr.pickPosition != null){

                x = sr.pickPosition.x;
                y = sr.pickPosition.y;
                z = sr.pickPosition.z;

                var xyz = zNear_bug_correction([x,y,z]);

                x = xyz[0];
                y = xyz[1];
                z = xyz[2];

                d1 = Math.sqrt(x*x+z*z);

                if ((d1-d0)<0.1){
                    this._y = y;
                    break;
                }
            }

            cy += 1;

        }

    }

    this._elem = Scene.createMarker(this._x,this._y,this._z);
    this._shape = this._elem.find("shape");
    this._registerEvents();

}


X3DOMObject.Marker.prototype._registerEvents = function(){

    var PREFIX = "my-sph-";

    var self = this;
    var marker = this._shape;
    //var id_prefix = $(this._elem).attr("id").substr(0,PREFIX.length);
    //var index = parseInt($(this._elem).attr("id").substr(PREFIX.length));

    marker.on('click',function(e){

        var elem = $(this).parent().parent().parent();
        var index = parseInt($(elem).attr("id").substr(PREFIX.length));
        var id_prefix = $(elem).attr("id").substr(0,PREFIX.length);
        //self.dehighlight();
        //X3DOMObject.PointerMarker.dehighlight(self._elem);

        if (Scene._ctrlKey){

            if (id_prefix==PREFIX){

                elem.remove();

                // REMOVE
                Data.markers.splice(index,1);
                Scene.updateMarkersIndices();

                Map.deleteMarker(index);
                Map.marker.draggedMarker._index = null;

                Scene.highlighted_marker_index = null;
            }

        }else{

            X3DOMObject.Marker.toggle(elem);
            Map.toggleMarker(index);

        }

    });

    marker.on('mouseover',function(e){

        var elem = $(this).parent().parent().parent();
        var index = parseInt($(elem).attr("id").substr(PREFIX.length));
        var id_prefix = $(elem).attr("id").substr(0,PREFIX.length);

        X3DOMObject.Marker.highlight(elem);
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

        var elem = $(this).parent().parent().parent();
        var index = parseInt($(elem).attr("id").substr(PREFIX.length));

        //self.highlightMarker(index);
        Scene.highlighted_marker_index = null;

        if (Scene.draggedTransformNode==null){

            if (!elem.prop("selected")){
                X3DOMObject.Marker.dehighlight(elem);
                Map.dehighlightMarker(index);
            }else{
                X3DOMObject.Marker.highlight(elem);
                Map.highlightMarker(index);
            }

        }

    });

    marker.on('mousedown',function(e){

        var self = this;
        var elem = $(this).parent().parent().parent();
        var index = parseInt($(elem).attr("id").substr(PREFIX.length));

        X3DOMObject.Marker.dehighlight(elem);
        Map.dehighlightMarker(index);

        document.getElementById("navInfo").setAttribute("type", '"NONE"');

        Scene.lastMouseX = event.offsetX;
        Scene.lastMouseY = event.offsetY;

        X3DOMObject.Marker.dragStart(this);

        Scene.element.addEventListener('mousemove',X3DOMObject.Marker.mouseMove,true);
        Scene.element.addEventListener('mouseup',X3DOMObject.Marker.mouseUp,true);

        // check for button released outside the window
        $(window).on('mouseover.drag_marker',function(e) {
            if (e && e.buttons===0 && Scene.markerToDrag) {
                X3DOMObject.Marker.mouseUp.apply(self,[event]);
            }
        });

    });

    marker.on('mouseup',function(e){

        var elem = $(this).parent().parent().parent();
        var index = parseInt($(elem).attr("id").substr(PREFIX.length));

        X3DOMObject.Marker.highlight(elem);
        Map.highlightMarker(index);

    });

}

X3DOMObject.Marker.mouseUp = function(){

    //console.log("Drag STOP");
    Map.marker._showMeasureMarkersTTs();

    var elem = Scene.draggedTransformNode.parent().parent();

    // click is already bound
    /*
    if (!Scene.markerdragged){
        X3DOMObject.Marker.toggle(elem);
    }
    */

    Scene.markerToDrag=null;
    Scene.element.removeEventListener('mouseup',X3DOMObject.Marker.mouseUp,true);
    Scene.element.removeEventListener('mousemove',X3DOMObject.Marker.mouseMove,true);
    $(window).off('.drag_marker');

    Scene.draggedTransformNode = null;
    Scene.draggingUpVec        = null;
    Scene.draggingRightVec     = null;
    Scene.unsnappedDragPos     = null;
    Scene.markerdragged = false;

    document.getElementById("navInfo").setAttribute("type",'"examine"');

}

// from https://x3dom.org/x3dom/example/MovingObjectsWithDOMEvents.html
X3DOMObject.Marker.dragStart = function(elem){

    //console.log("Drag START");

    Scene.markerToDrag=elem;

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

// gets called when existing marker is dragged
X3DOMObject.Marker.mouseMove = function(event){

    // hide ToolTips with meters and staff
    Map.marker._hideMeasureMarkersTTs();

    Scene.markerdragged = true;

    var sphere = Scene.draggedTransformNode.parent().parent();
    var index = parseInt(sphere.attr("id").substr(7));

    X3DOMObject.Marker.highlight(sphere);
    Map.highlightMarker(index);

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
        // once we mouse out of the marker we will get correct world coordinates
        //console.log(event);
        if (!SETTINGS.slidingdrag){
            X3DOMObject.Marker.drag(event.offsetX - Scene.lastMouseX, event.offsetY - Scene.lastMouseY);
        }else{
            Scene.markerToDrag.isPickable=false;
            //1: old
            //var sr = Scene.element.runtime.shootRay(event.clientX,event.clientY);
            //2: new
            if (!event.target) event.target = Scene.element;
            var mouse_position = Scene.element.runtime.mousePosition(event);
            var sr = Scene.element.runtime.shootRay(mouse_position[0],mouse_position[1]);

            Scene.markerToDrag.isPickable=true;
            if (sr.pickObject != null){
                if (!$(sr.pickObject).hasClass("shapemarker")){
                    var sphere = Scene.draggedTransformNode.parent().parent();
                    var index = parseInt(sphere.attr("id").substr(7));

                    // zNear bug correction
                    var xyz = [sr.pickPosition.x,sr.pickPosition.y,sr.pickPosition.z];
                    xyz = zNear_bug_correction(xyz);

                    X3DOMObject.Marker.place(xyz[0],xyz[1],xyz[2],"my-sph-"+index);
                    //console.log("got shape");
                    //Scene.draggedTransformNode
                    X3DOMObject.Marker.slide(index,xyz[0],xyz[1],xyz[2]);

                    X3DOMObject.displayInfo(event);
                    X3DOMObject.displayViewInfo(event);

                }
            }
        }
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

    X3DOMObject.Marker.slide(index,Scene.unsnappedDragPos.x,Scene.unsnappedDragPos.y,Scene.unsnappedDragPos.z);

}


X3DOMObject.Marker.slide = function(index,x,y,z){

    // camera coordinates, not correcting with zNear
    var campos = x3dom_getCameraPosOr();
    xc = campos.x;
    yc = campos.y;
    zc = campos.z;

    // coords are converted to real world inside function
    var da = x3dom_getDistAngle(x-xc,y-yc,z-zc);
    var distance = da[0];
    var angle = da[1];

    var p1_ll = Map.marker._latlng;
    var p2_ll = p1_ll.CoordinatesOf(angle,distance);

    var xyz_real = x3dom_scene_to_real(x,y,z);

    var c = Data.markers[index];

    c.x = x;
    c.y = y;
    c.z = z;
    c.latitude = p2_ll.lat;
    c.longitude = p2_ll.lng;
    c.altitude = c.y;
    //d_x3d - map distance calculated from the model
    c.d_x3d = distance;

    c.align.x = x;
    c.align.y = y;
    c.align.z = z;

    c.align.real.x = xyz_real.x;
    c.align.real.y = xyz_real.y;
    c.align.real.z = xyz_real.z;

    X3DOMObject.displayMarkInfo(index);
    X3DOMObject.displayInfo({});

    Map.marker.setMarkerPoint(p2_ll,index);

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

    //var color = "0.07 1 0.07";
    var color = elem.find('material').attr("myColor");
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

    this._elem = Scene.createMarker(0,0,0,"sliding_sphere");
    this._shape = this._elem.find("shape");
    this._shape.attr('isPickable',false);
    this._registerEvents();

    this._elem.find("switch").attr("whichChoice",-1);

}

X3DOMObject.PointerMarker.updatePars = function(){

  // place pointer marker
  $("#sliding_sphere").find('material').attr("diffuseColor",convert_color_l2x(SETTINGS.markercolor));
  $("#sliding_sphere").find('material').attr("transparency","0.2");
  $("#sliding_sphere").find('Sphere').attr("radius",((SETTINGS.markersize<0)?-1:1)*SETTINGS.markersize/2);

}

X3DOMObject.PointerMarker.prototype._registerEvents = function(){

    var self = this;
    var Camera = Map.marker;

    // PointerMarker MouseEvent are not triggered when isPickable is false
    $(window).on('mousedown',function(e){
        self._shape.attr('isPickable',true);
    });

    $(window).on('mouseup',function(){
      self._shape.attr('isPickable',false);
    });

    // window mousedown above is run after x3dom mousedown handler
    // so we must listen to x3dom 'mouseup' instead of 'click' below
    self._shape.on("mouseup",function(e){

        X3DOMObject.Marker.dehighlight(self._elem);

        var xyz = $(this).parent().attr("translation");
        xyz = xyz.split(" ");

        X3DOMObject.createNewMarker(xyz[0],xyz[1],xyz[2]);

    });

    self._shape.on("mousedown",function(e){

        X3DOMObject.Marker.highlight(self._elem);

    });

}

/**
 * need to move this to leaflet_init.js
 */
X3DOMObject.MapMarker = {};

X3DOMObject.MapMarker.registerEvents = function(map_mark){

        var Camera = Map.marker;

        map_mark.on('mouseover',function(){

            //console.log(this._index);

            var index = this._index;
            var elem = $("#my-sph-"+index);

            X3DOMObject.Marker.highlight(elem);
            Map.highlightMarker(index);
            X3DOMObject.displayMarkInfo(index);

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
                Data.markers.splice(index,1);

                // from Map (indices get updated)
                Map.deleteMarker(index);

                // from Scene
                elem.remove();
                Scene.updateMarkersIndices();

            }else{

                /*
                X3DOMObject.Marker.toggle(elem);
                Map.toggleMarker(index);
                */
                /*
                X3DOMObject.Marker.highlight(elem);
                Map.highlightMarker(index);
                */

            }

        });

        map_mark.on('click',function(e){
            var index = this._index;
            var elem = $("#my-sph-"+index);

            if (!e.originalEvent.ctrlKey){
                X3DOMObject.Marker.toggle(elem);
                Map.toggleMarker(index);
            }
        });

}

/**
 * info template
 */
X3DOMObject.displayInfo = function(e){

        if (Data.markers.length==0||!SETTINGS.markinfo){
            ui_hideMessage("window-markinfo");
        }
        //console.log("displayInfo");

        var elem = Scene.element;

        // 1:old
        //var mouse = x3dom_getXYPosOr(e.clientX,e.clientY,true);

        // 2:new
        if (!e.target) e.target = elem;
        var mouse_position = elem.runtime.mousePosition(e);
        var mouse = x3dom_getXYPosOr(mouse_position[0],mouse_position[1],true);

        if (Data.markers[mouse.index]!=undefined){
            X3DOMObject.displayMarkInfo(mouse.index);
        }

        //var dist = 1115;
        var dist = 1115;
        if ($(".GroupTop").attr("bboxSize")!=undefined){
          dist = parseFloat($(".GroupTop").attr("bboxSize").trim().split(" ")[2]);
        }

        $("#window-info").css({"font-size":"20px"});

        if (mouse.d_xz != null){

            var dist_msg = "";
            var id_msg = "";

            if (SETTINGS.moreinfo){

                //console.log("displayInfo actual displaying");

                $("#window-info").css({"font-size":"16px"});

                var st = mouse.id;

                id_msg = (st===undefined)?"n/a":st;

                dist_msg += [
                  '<table>',
                  '  <tr>',
                  '    <th align=\'center\'>shape id</td>',
                  '    <td>'+id_msg+'</td>',
                  '  </tr>',
                  '</table>',
                  '<table>',
                  '  <tr>',
                  '    <th align=\'left\'>d<sub>xz</sub></td>',
                  '    <td>'+mouse.d_xz+' m</td>',
                  '    <td>&nbsp;</td>',
                  '    <th align=\'left\'>d<sub>xyz</sub></td>',
                  '    <td>'+mouse.d_xyz+' m</td>',
                  '  </tr>',
                  '</table>'
                ].join('\n');

            }else{

                dist_msg = mouse.d_xz+" m";

            }

            dist = parseFloat(mouse.d_xz);

        }else{

            dist_msg = "&infin; m";

        }

        var msg = "<div>"+dist_msg+"</div>";

        ui_showMessage("window-info",msg);

        return dist;

}

/**
 * view info template
 */
X3DOMObject.displayViewInfo = function(e){

    if (Data.markers.length==0||!SETTINGS.markinfo){
        ui_hideMessage("window-markinfo");
    }

    if (!e.target){
        e.clientX = $(window).width()/2;
        e.clientY = $(window).height()/2;
    }

    //1: old
    //var mouse = x3dom_getXYPosOr(e.clientX,e.clientY,true);
    //2: new
    if (!e.target) e.target = Scene.element;
    var mouse_position = Scene.element.runtime.mousePosition(e);
    var mouse = x3dom_getXYPosOr(mouse_position[0],mouse_position[1],true);
    mouse.s = "0";

    /*
    if (Data.markers[mouse.index]!=undefined){
        X3DOMObject.displayMarkInfo(mouse.index);
    }
    */

    var camera = x3dom_getCameraPosOr(true);

    /* do not convert
    //convert to real world coordinates
    var tmp = xyz_to_real_world(mouse.x,mouse.y,mouse.z);

    mouse.x = tmp.x.toFixed(2);
    mouse.y = tmp.y.toFixed(2);
    mouse.z = tmp.z.toFixed(2);

    //convert to real world coordinates
    var tmp = xyz_to_real_world(camera.x,camera.y,camera.z);
    camera.x = tmp.x.toFixed(2);
    camera.y = tmp.y.toFixed(2);
    camera.z = tmp.z.toFixed(2);
    */

    // ?!!!
    //Map.marker.setAltitude(camera.y);
    //Map.marker.setElevation(camera.e*Math.PI/180);

    var m_dxz  = x3dom_2d_distance(mouse.x,mouse.z,true);
    var m_dxyz = x3dom_3d_distance(mouse.x,mouse.y,mouse.z,true);

    var m_real_dxz  = x3dom_2d_distance(mouse.real.x,mouse.real.z,true);
    var m_real_dxyz = x3dom_3d_distance(mouse.real.x,mouse.real.y,mouse.real.z,true);

    var log = [
      'data:',
      '  scene : x='+mouse.x+'    y='+mouse.y+'    z='+mouse.z+'    d_xz='+m_dxz+'    d_xyz='+m_dxyz,
      '  world : x='+mouse.real.x+'    y='+mouse.real.y+'    z='+mouse.real.z+'    d_xz='+m_real_dxz+'    d_xyz='+m_real_dxyz
    ].join('\n');

    //console.log(log);

    var msg = [
      '<table>',
      '<tr>',
      '    <td></td>',
      '    <td colspan=\'3\' align=\'center\'>position, m</td>',
      '    <td colspan=\'3\' align=\'center\'>orientation, &deg;</td>',
      '</tr>',
      '<tr>',
      '    <th></th>',
      '    <th style=\'width:60px;\'>x</th>',
      '    <th style=\'width:60px;\'>y</th>',
      '    <th style=\'width:60px;\'>z</th>',
      '    <th>azimuth</th>',
      '    <th>elevation</th>',
      '    <th>roll</th>',
      '</tr>',
      '<tr>',
      '    <td>mouse</td>',
      '    <td>'+(SETTINGS.global_coordinates?mouse.real.x:mouse.x)+'</td>',
      '    <td>'+(SETTINGS.global_coordinates?mouse.real.y:mouse.y)+'</td>',
      '    <td>'+(SETTINGS.global_coordinates?mouse.real.z:mouse.z)+'</td>',
      '    <td>'+mouse.a+'</td>',
      '    <td>'+mouse.e+'</td>',
      '    <td>'+mouse.s+'</td>',
      '</tr>',
      '<tr>',
      '    <td>camera</td>',
      '    <td>'+camera.x+'</td>',
      '    <td>'+camera.y+'</td>',
      '    <td>'+camera.z+'</td>',
      '    <td>'+camera.a+'</td>',
      '    <td>'+camera.e+'</td>',
      '    <td>'+camera.s+'</td>',
      '</tr>',
      '</table>'
    ].join('\n');

    if (SETTINGS.viewinfo){
        ui_showMessage("window-viewinfo",msg);
    }else{
        ui_hideMessage("window-viewinfo");
    }
}

/**
 * view marker data - satellite vs 3d model
 */
X3DOMObject.displayMarkInfo = function(index){

    //console.log("displayMarkInfo");

    var hide = false;

    if (Data.markers.length==0){
        hide = true;
    }else{

        var d_map = Data.markers[index].d_map;
        var d_x3d = Data.markers[index].d_x3d;

        var d_map_float = parseFloat(d_map);
        var d_x3d_float = parseFloat(d_x3d);

        var delta;

        if (isNaN(d_map_float)){
            d_map_msg = d_map;
        }else{
            d_map_msg = d_map_float.toFixed(1)+" m";
        }

        if (isNaN(d_x3d_float)){
            d_x3d_msg = d_x3d;
        }else{
            d_x3d_msg = d_x3d_float.toFixed(1)+" m";
        }


        if (!isNaN(d_x3d_float)&&!isNaN(d_map_float)){
            delta = (d_map_float-d_x3d_float).toFixed(1);
        }else{
            delta = "-";
        }

        msg = [
          '<div>Marker '+index+' (Satellite vs 3D model)</div>',
          '<table>',
          '  <tr>',
          '    <td>',
          '      <table title=\'change coordinates to move marker\'>',
          '      <tr>',
          '        <th>x</th>',
          '        <th>y</th>',
          '        <th>z</th>',
          '      </tr>',
          '      <tr>',
          '        <td><input type=\'text\' id=\'marker_x\' index='+index+' class=\'marker_coordinates\'/></td>',
          '        <td><input type=\'text\' id=\'marker_y\' index='+index+' class=\'marker_coordinates\'/></td>',
          '        <td><input type=\'text\' id=\'marker_z\' index='+index+' class=\'marker_coordinates\'/></td>',
          '        <td><input type=\'checkbox\' index='+index+' id=\'rf_switcher\' title=\'switch between global and model coordinates\'/></td>',
          '      </tr>',
          '      </table>',
          '    </td>',
          '  </tr>',
          '  <tr>',
          '    <td>',
          '      <table>',
          '      <tr title=\'drag marker over map to update distance\'>',
          '        <th align=\'left\'>d<sub>map</sub></th>',
          '        <td align=\'left\' style=\'text-align:left;\'>'+d_map_msg+'</td>',
          '      </tr>',
          '      <tr title=\'drag marker over 3d scene to update distance\'>',
          '        <th align=\'left\'>d<sub>3d</sub></th>',
          '        <td align=\'left\' style=\'text-align:left;\'>'+d_x3d_msg+'</td>',
          '      </tr>',
          '      <tr>',
          '        <th align=\'center\'>&Delta;</th>',
          '        <td align=\'left\' style=\'text-align:left;\'>'+delta+' m</td>',
          '      </tr>',
          '      </table>',
          '    </td>',
          '  </tr>',
          '</table>'
        ].join('\n');

    }

    if (hide||!SETTINGS.markinfo){
        ui_hideMessage("window-markinfo");
    }else{
        ui_showMessage("window-markinfo",msg);
    }

    if (SETTINGS.global_coordinates){
      $("#rf_switcher").prop("checked",true);
    }

    $("#rf_switcher").on('change',function(){

      //$("#global_coordinates").prop("checked",$(this).prop("checked"));
      $("#global_coordinates").click();

      X3DOMObject.displayMarkInfo($(this).attr("index"));

    });

    // enable input fields here
    $(".marker_coordinates").each(function(){

      var index = parseInt($(this).attr("index"));
      var marker = Data.markers[index];
      var coord = $(this).attr("id").substr(-1);

      var x,y,z;

      if (SETTINGS.global_coordinates){
        x = marker.align.real.x.toFixed(2);
        y = marker.align.real.y.toFixed(2);
        z = marker.align.real.z.toFixed(2);
      }else{
        x = marker.align.x.toFixed(2);
        y = marker.align.y.toFixed(2);
        z = marker.align.z.toFixed(2);
      }

      if       (coord=="x"){
        $(this).val(x);
      }else if (coord=="y"){
        $(this).val(y);
      }else if (coord=="z"){
        $(this).val(z);
      }

      //var xyz_real = x3dom_scene_to_real(x,y,z);
      $(this).on('change',function(){

        var index = parseInt($(this).attr("index"));
        var marker = Data.markers[index];
        var coord = $(this).attr("id").substr(-1);

        var xyz = {
          x: parseFloat($("#marker_x").val()),
          y: parseFloat($("#marker_y").val()),
          z: parseFloat($("#marker_z").val())
        };

        if (SETTINGS.global_coordinates){
          xyz = x3dom_real_to_scene(xyz.x,xyz.y,xyz.z);
        }

        X3DOMObject.Marker.place(xyz.x,xyz.y,xyz.z,"my-sph-"+index);
        X3DOMObject.Marker.slide(index,xyz.x,xyz.y,xyz.z);

      });
    });

}

/*
 * Called on ctrl-click over scene
 */
X3DOMObject.createNewMarker = function(x,y,z){

  x = parseFloat(x);
  y = parseFloat(y);
  z = parseFloat(z);

  var Camera = Map.marker;
  // Create marker for Data

  var color = x3dom_autocolor();

  var xyz_real = x3dom_scene_to_real(x,y,z);

  var mark = new X3L({
      x: x || 0,
      y: y || 0,
      z: z || 0,
      color: color,
      size: x3dom_markersize(x,y,z)
  });

  mark.d_x3d = Math.sqrt(Math.pow(xyz_real.x,2)+Math.pow(xyz_real.z,2));
  //mark.d_x3d = Math.sqrt(Math.pow(x,2)+Math.pow(z,2));
  mark.d_map = "<font style='color:red;'>drag over map</font>";

  mark.align = {
    latitude: 0,
    longitude: 0,
    altitude: 0,
    x: mark.x,
    y: mark.y,
    z: mark.z,
    real:{
      x: xyz_real.x,
      y: xyz_real.y,
      z: xyz_real.z,
    }
  };

  Data.markers.push(mark);

  X3DOMObject.displayMarkInfo(Data.markers.length-1);

  // Create marker on the scene
  new X3DOMObject.Marker(mark.x,mark.y,mark.z);

  // camera coordinates, not correcting with zNear
  var campos = x3dom_getCameraPosOr();
  xc = campos.x;
  yc = campos.y;
  zc = campos.z;

  // calculate relative to the camera base
  // converted to real world inside the function
  var da = x3dom_getDistAngle(mark.x-xc,mark.y-yc,mark.z-zc);
  var distance = da[0];
  var angle = da[1];

  // Create marker on the map
  Camera.createMeasureMarker(angle,distance);

  var map_mark = Camera._measureMarkers[Camera._measureMarkers.length-1];

  // Update marker in Data
  mark.latitude = map_mark._latlng.lat;
  mark.longitude = map_mark._latlng.lng;
  // used to be zero, but now it's not zero
  mark.altitude = Data.camera.kml.altitude+xyz_real.y;

  // register events for a new marker in Data
  X3DOMObject.MapMarker.registerEvents(map_mark);

  // need?
  Camera._syncMeasureMarkersToBasePoint();

  // this colors the marker on the map
  Map.dehighlightMarker(Camera._measureMarkers.length-1);

}
