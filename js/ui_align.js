/*

  Copyright (C) 2017 Elphel Inc.

  License: GPL-3.0

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

var DEBUG_ALIGN = false;

function align_init(){

    $("#align_button").on("click",function(){
        //align_heading();
        //test_markers_set1();
        //if (DEBUG_ALIGN) test_markers_set1();
        if (DEBUG_ALIGN) test_markers_set2();
        //if (DEBUG_ALIGN) test_markers_set3();
        x3dom_align_GN();
    });

    $("#align_tr_button").on("click",function(){
        x3dom_align_tr();
    });

    /*
    $("#align_0").on("click",function(){
        x3dom_align_0();
    });
    */

}

/*
 * Check which markers need to be moved to have both 3d and map coorinates
 * returns false if yes
 *          true - all's fine
 */
function check_markers(){

  var c1,c2;
  var result = true;
  var msg = [];

  for(var i=0;i<Data.markers.length;i++){

    c1 = Data.markers[i].d_map;
    c2 = Data.markers[i].d_x3d;

    if (c1.toString().indexOf("drag")!=-1){
      msg.push("error: marker "+i+": drag over map. Mouse over shows a marker info.");
      //console.log("error: marker "+i+": drag over map. Mouse over shows a marker info.");
      result = false;
    }

    if (c2.toString().indexOf("drag")!=-1){
      msg.push("error: marker "+i+": drag over 3D scene. Mouse over shows a marker info.");
      result = false;
    }

  }

  if (msg.length!=0){
    ui_showMessage("window-error",msg.join("<br/>"));
  }

  return result;

}

/*
 * run the Gauss-Newton algorithm iterations
 */
function x3dom_align_GN(){

  // need at least 3 points
  if (Data.markers != undefined){
    if (Data.markers.length<3){
        var msg = "Alignment error: place at least 3 markers";
        ui_showMessage("window-error",msg);
        return -1;
    }
  }else{
    var msg = "Alignment error: place at least 3 markers";
    ui_showMessage("window-error",msg);
    return -1;
  }

  if (!check_markers()){
    //var msg = "Alignment error: marker has not been moved over 3D or Map";
    //ui_showMessage("window-error",msg);
    return -2;
  }

  ui_hideMessage("window-error");

  // initial approximation:
  var x0 = Data.camera.kml.latitude;
  var y0 = Data.camera.kml.longitude;
  var h0 = Data.camera.kml.heading;
  var epsilon = 1e-8;

  var xyh = [x0,y0,(h0>180)?h0-360:h0];

  var result = numbers.calculus.GaussNewton(xyh,Data.markers.length,r_i,[dr_dx_i,dr_dy_i,dr_dh_i],epsilon);

  xyh = result.v;
  var s1 = result.error;
  var counter = result.count;

  //calc distance error
  de = distance_error(x0,y0,(h0>180)?h0-360:h0);
  //convert to conventional range
  xyh[2] = (xyh[2]+360)%360;
  //init apply dialog
  apply_alignment_dialog([x0,y0,h0],xyh,counter,s1,de);

}

/*
 * heading in degrees from 3D model
 */
function f1_3d_i(i,v){
  var base = Data.camera;
  var mark = Data.markers[i];
  var vec = new x3dom.fields.SFVec3f(mark.align.x-base.x,0,mark.align.z-base.z);
  var res = Math.atan2(vec.x,-vec.z)*180/Math.PI + v[2];

  if (res> 180) res = res - 360;
  if (res<-180) res = res + 360;

  return res;
}

/*
 * heading in degrees from map
 */
function f2_map_i(i,v){

  var mark = Data.markers[i];
  var p1_ll = new L.LatLng(v[0],v[1]);
  var p2_ll = new L.LatLng(mark.align.latitude,mark.align.longitude);

  //console.log(p1_ll);
  //console.log(p2_ll);

  p1_ll.lat = p1_ll.lat*Math.PI/180;
  p1_ll.lng = p1_ll.lng*Math.PI/180;

  p2_ll.lat = p2_ll.lat*Math.PI/180;
  p2_ll.lng = p2_ll.lng*Math.PI/180;

  var dlat = p2_ll.lat-p1_ll.lat;
  var dlon = p2_ll.lng-p1_ll.lng;

  var dy = Math.sin(dlon)*Math.cos(p2_ll.lat);
  var dx = Math.cos(p1_ll.lat)*Math.sin(p2_ll.lat)-Math.sin(p1_ll.lat)*Math.cos(p2_ll.lat)*Math.cos(dlon);

  //console.log("dy = "+dy+" dx = "+dx);

  var res = 180/Math.PI*Math.atan2(dy,dx);

  return res;

}

/*
 * residuals function
 */
function r_i(i,v){
  var f1 = f1_3d_i(i,v);
  var f2 = f2_map_i(i,v);
  //return (f1-f2+360)%360;
  return (f1-f2);
}

/*
 * dr/dx(i)
 */
function dr_dx_i(i,v){

  var mark = Data.markers[i];
  var p1_ll = new L.LatLng(v[0],v[1]);
  var p2_ll = new L.LatLng(mark.align.latitude,mark.align.longitude);

  p1_ll.lat = p1_ll.lat*Math.PI/180;
  p1_ll.lng = p1_ll.lng*Math.PI/180;

  p2_ll.lat = p2_ll.lat*Math.PI/180;
  p2_ll.lng = p2_ll.lng*Math.PI/180;

  var dlat = p2_ll.lat-p1_ll.lat;
  var dlon = p2_ll.lng-p1_ll.lng;

  var dy = Math.sin(dlon)*Math.cos(p2_ll.lat);
  var dx = Math.cos(p1_ll.lat)*Math.sin(p2_ll.lat)-Math.sin(p1_ll.lat)*Math.cos(p2_ll.lat)*Math.cos(dlon);

  var dydx = 0;
  var dxdx = (-Math.sin(p1_ll.lat)*Math.sin(p2_ll.lat)-Math.cos(p1_ll.lat)*Math.cos(p2_ll.lat)*Math.cos(dlon))*Math.PI/180;

  var Arg = dy/dx;

  var res = -180/Math.PI*1/(1+Math.pow(Arg,2))*(-dy*dxdx)/Math.pow(dx,2);

  return res;

}
/*
 * dr/dy(i)
 */
function dr_dy_i(i,v){

  var mark = Data.markers[i];
  var p1_ll = new L.LatLng(v[0],v[1]);
  var p2_ll = new L.LatLng(mark.align.latitude,mark.align.longitude);

  p1_ll.lat = p1_ll.lat*Math.PI/180;
  p1_ll.lng = p1_ll.lng*Math.PI/180;

  p2_ll.lat = p2_ll.lat*Math.PI/180;
  p2_ll.lng = p2_ll.lng*Math.PI/180;

  var dlat = p2_ll.lat-p1_ll.lat;
  var dlon = p2_ll.lng-p1_ll.lng;

  var dy = Math.sin(dlon)*Math.cos(p2_ll.lat);
  var dx = Math.cos(p1_ll.lat)*Math.sin(p2_ll.lat)-Math.sin(p1_ll.lat)*Math.cos(p2_ll.lat)*Math.cos(dlon);

  var dydy = Math.cos(p2_ll.lat)*Math.cos(dlon)*(-1)*Math.PI/180;
  var dxdy = -Math.sin(p1_ll.lat)*Math.cos(p2_ll.lat)*(-1)*Math.sin(dlon)*(-1)*Math.PI/180;

  var Arg = dy/dx;

  var res = -180/Math.PI*1/(1+Math.pow(Arg,2))*(dydy*dx-dy*dxdy)/Math.pow(dx,2);

  return res;

}
/*
 * dr/dh(i)
 */
function dr_dh_i(i,v){
  return 1;
}


/*
 * ui dialog to apply or cancel results
 */
function apply_alignment_dialog(xyh0,xyh1,c,e,de){

  var d = $("<div>",{id:"aa1_dialog"});

  var dc = $([
    '<div>Alignment algorithm results</div>',
    '<br/>',
    '<div>Error: <b>'+e+' &deg;</b></div>',
    '<div>d<sup>-1</sup> Error: <b>'+de+' m<sup>-1</sup></b></div>',
    '<div>Iterations: <b>'+c+'</b></div>',
    '<div>',
    '<table>',
    '  <tr>',
    '    <th></th>',
    '    <th>Latitude</th>',
    '    <th>Longitude</th>',
    '    <th>Heading</th>',
    '  </tr>',
    '  <tr>',
    '    <th>old</th>',
    '    <td>'+xyh0[0]+'</td>',
    '    <td>'+xyh0[1]+'</td>',
    '    <td>'+xyh0[2]+'</td>',
    '  </tr>',
    '  <tr>',
    '    <th>new</th>',
    '    <td>'+xyh1[0]+'</td>',
    '    <td>'+xyh1[1]+'</td>',
    '    <td>'+xyh1[2]+'</td>',
    '  </tr>',
    '</table>',
    '</div>',
    '<br/>'
  ].join('\n'));

  d.append(dc);

  var b1 = $("<button>").html("apply");

  b1.on('click',function(){
    apply_alignment(xyh1);
    b2.click();
  });

  var b2 = $("<button>").html("cancel");

  b2.on('click',function(){
    $("#aa1_dialog").remove();
  });

  d.append($("<div>").append(b1).append(b2));

  $("body").append(d);

}

/*
 * actual apply function
 */
function apply_alignment(xyh){

    var Camera = Map.marker;

    Data.camera.heading   = xyh[2];
    Data.camera.latitude  = xyh[0];
    Data.camera.longitude = xyh[1];

    Data.camera.kml.heading   = xyh[2];
    Data.camera.kml.latitude  = xyh[0];
    Data.camera.kml.longitude = xyh[1];
    //update initial location and heading

    Map.marker.setHeading(xyh[2]);
    Map.marker.setBasePoint(new L.LatLng(xyh[0],xyh[1]));
    Map.marker._syncMeasureMarkersToBasePoint();

    //update on 3d
    var p1_ll = Camera._latlng;

    for(var i=0;i<Data.markers.length;i++){
      var p2_ll = Camera._measureMarkers[i]._latlng;
      leaf_update_x3dom_marker(p1_ll,p2_ll,i);
    }

    x3d_initial_camera_placement();

}

function distance_error(x,y,h){

  var sum = 0;

  for(var i=0;i<Data.markers.length;i++){
      var angle0 = h;
      var angle1 = f2_map_i(i,[x,y,h]);
      var z_map = Math.cos(Math.PI/180*(angle0-angle1))*Data.markers[i].d_map;
      var z_x3d = -Data.markers[i].align.z;
      sum += 1/z_map-1/z_x3d;
      console.log("Marker: "+i+", Camera heading: "+angle0+", Point azimuth: "+angle1+" , z_map: "+z_map+", z_x3d: "+z_x3d+", error^-1: "+(1/z_map-1/z_x3d));
  }

  sum = sum/Data.markers.length;

  console.log("Final sum averaged: "+sum);

  return sum;

}

function x3dom_align_tr(){

  if (Data.markers.length<2){
    console.log("Too few points");
    return;
  }

  var mark0 = Data.markers[0];
  var mark1 = Data.markers[1];

  var v0 = { x: mark0.align.x, y: mark0.align.y, z: mark0.align.z};
  var v1 = { x: mark1.align.x, y: mark1.align.y, z: mark1.align.z};

  var dx = Math.abs(v1.x-v0.x);
  var dy = Math.abs(v1.y-v0.y);
  var dz = Math.abs(v1.z-v0.z);

  console.log(dx+" "+dy+" "+dz);

  var tilt = 180/Math.PI*Math.asin(dy/Math.sqrt(dy*dy+dz*dz));
  var roll = 180/Math.PI*Math.asin(dy/Math.sqrt(dy*dy+dx*dx));

  console.log("Tilt: "+tilt+" Roll: "+roll);

}

/*
 * not used
 */
function align_roll(){

    console.log("roll");

}

/*
 * not used
 */
function align_tilt(){

    console.log("tilt");

}

function test_markers_set1(){

  Data.camera.kml.latitude  = 40.7233861;
  Data.camera.kml.longitude = -111.9328843;
  Data.camera.kml.heading   = 62;

  Data.markers = [
    {d_map:0, d_x3d:0, align:{  latitude: 40.72362633635111, longitude: -111.93257600069047, x:-9.079290749776595, y:-14.27794573338788,  z: -32.46383785654424  }},
    {d_map:0, d_x3d:0, align:{  latitude: 40.7234408473505,  longitude: -111.93217568099502, x:23.90413018819188,  y:-16.192438967265613, z: -53.91987886096472  }},
    {d_map:0, d_x3d:0, align:{  latitude: 40.7239048229759,  longitude: -111.93186186254026, x:-8.800276069589225, y:-17.382935178801347, z:-100.34033327103612  }}
  ];

}

function test_markers_set2(){

  Data.camera.kml.latitude  = 40.77589481693107;
  Data.camera.kml.longitude = -111.89113654196264;
  Data.camera.kml.heading   = 185.15855178060607;

  Data.markers = [
    {d_map:0, d_x3d:0, align:{  latitude: 40.775409876634654, longitude: -111.89125657081605, x:  4.714593840189788, y: -5.9648880758191085, z:  -51.71562469465225  }},
    {d_map:0, d_x3d:0, align:{  latitude: 40.770452618976286, longitude: -111.89164549112321, x: -9.225969874358247, y:  1.0038959217814385, z: -322.9596304948839  }},
    {d_map:0, d_x3d:0, align:{  latitude: 40.77414901529763,  longitude: -111.89088240265848, x:-60.99135351237815,  y: -9.828564556750072,  z: -276.1326527395041  }}
  ];

}

// bad set, needed more points
function test_markers_set3(){

  Data.camera.kml.latitude  = 40.79437830462248;
  Data.camera.kml.longitude = -111.90397158265115;
  Data.camera.kml.heading   = 249.4439547804165;

  Data.markers = [
    {d_map:0, d_x3d:0, align:{  latitude: 40.79412143437496, longitude: -111.90607845783235, x: 13.930790294993443, y: 17.628990742021394, z:  -154.9656658238599  }},
    {d_map:0, d_x3d:0, align:{  latitude: 40.79364474960238, longitude: -111.90520875155927, x: -30.99517183539921, y:  8.62831993127737, z: -92.96031068292253  }},
    {d_map:0, d_x3d:0, align:{  latitude: 40.79441790113347,  longitude: -111.90620452165605, x:34.451361546214116,  y: 30.539873602241727,  z: -133.39148171966684  }}
  ];

}
