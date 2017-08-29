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
        x3dom_align_hll();
    });

    $("#align_tr_button").on("click",function(){
        x3dom_align_art();
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
function x3dom_align_hll(){

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

  var result = numbers.calculus.GaussNewton(xyh,Data.markers.length,hll_r_i,[hll_dr_dx_i,hll_dr_dy_i,hll_dr_dh_i],epsilon,hll_w_i);

  xyh = result.v;
  var s1 = result.error;
  var counter = result.count;

  //calc distance error
  de = distance_error(x0,y0,(h0>180)?h0-360:h0);
  //de = -de;
  //convert to conventional range
  xyh[2] = (xyh[2]+360)%360;
  //init apply dialog
  apply_alignment_dialog_hll([x0,y0,h0],xyh,counter,s1,de);

}

/*
 * ui dialog to apply or cancel results
 */
function apply_alignment_dialog_hll(xyh0,xyh1,c,e,de){

  var d = $("<div>",{id:"aa1_dialog"});

  var dc = $([
    '<div>Least squares fitting results for heading, latitude & longitude</div>',
    '<br/>',
    '<div>Error: <b>'+e+' &deg;</b></div>',
    '<div>d<sup>-1</sup> Error: <b>'+de+' m<sup>-1</sup></b></div>',
    '<div>Iterations: <b>'+c+'</b></div>',
    '<div>',
    '<table>',
    '  <tr>',
    '    <th></th>',
    '    <th>Latitude, &deg;</th>',
    '    <th>Longitude, &deg;</th>',
    '    <th>Heading, &deg;</th>',
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
    apply_alignment_hll(xyh1);
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
function apply_alignment_hll(xyh){

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
  var wsum = 0;

  for(var i=0;i<Data.markers.length;i++){
      var angle0 = h;
      var angle1 = hll_f_map_i(i,[x,y,h]);
      var z_map = Math.cos(Math.PI/180*(angle0-angle1))*Data.markers[i].d_map;

      //var z_x3d = -Data.markers[i].align.z;
      var z_x3d = x3dom_2d_distance(Data.markers[i].align.real.x,Data.markers[i].align.real.z,false);

      var weight = Math.sqrt(z_map*z_x3d);

      wsum += weight;
      //sum += (1/z_map-1/z_x3d)*weight;
      sum += (1/z_x3d-1/z_map)*weight;

      console.log("Marker: "+i+", Camera heading: "+angle0+", Point azimuth: "+angle1+" , z_map: "+z_map+", z_x3d: "+z_x3d+", error^-1: "+(1/z_x3d-1/z_map));
  }

  //sum = sum/Data.markers.length;
  sum = sum/wsum;

  console.log("Final sum averaged: "+sum);

  return sum;

}

/**
 * Tilt, roll and relative height
 */
function x3dom_align_art(){

  var epsilon = 1e-8;

  //test_height_alignment_set1();
  //test_height_alignment_set2();
  //test_height_alignment_set3_2points();

  if (Data.markers.length<2){
    console.log("Too few points");
    return;
  }

  if (Data.markers.length==2){

    console.log("2 Markers provided: align Height'n'Tilt only (while Roll = 0)");

    var result = numbers.calculus.GaussNewton([0,0],Data.markers.length,art2_r_i,[art2_dr_dx_i,art2_dr_da_i],epsilon,art2_w_i);
    console.log(result);
    result.v[0] = result.v[0]*180/Math.PI;
    apply_alignment_dialog_art([0,0,0],[result.v[0],0,result.v[1]],result.count,result.error,false);

    return;

  }

  var result = numbers.calculus.GaussNewton([0,0,0],Data.markers.length,art_r_i,[art_dr_dx_i,art_dr_dy_i,art_dr_da_i],epsilon,art_w_i);
  console.log(result);

  //convert to degs
  result.v[0] = result.v[0]*180/Math.PI;
  result.v[1] = result.v[1]*180/Math.PI;

  //result.v[0] = bring_angle_to_range_deg(result.v[0],-180,180);
  //result.v[1] = bring_angle_to_range_deg(result.v[1],-180,180);

  apply_alignment_dialog_art([0,0,0],result.v,result.count,result.error,true);

}

function apply_alignment_dialog_art(a0,a1,c,e,full){

  var d = $("<div>",{id:"aa1_dialog"});

  var dc = $([
    (full)? '<div>Least squares fitting results for <b>tilt</b>, <b>roll</b> and <b>relative altitude</b></div>':'<div>Least squares fitting results for <b>tilt</b> and <b>relative altitude</b> (roll=0)</div>',
    '<br/>',
    '<div>Error: <b>'+e+' m</b></div>',
    '<div>Iterations: <b>'+c+'</b></div>',
    '<div>',
    '<table>',
    '  <tr>',
    '    <th></th>',
    '    <th>Tilt, &deg;</th>',
    (full)? '    <th>Roll, &deg;</th>':'',
    '    <th>Altitude, m</th>',
    '  </tr>',
    '  <tr>',
    '    <th>old</th>',
    '    <td>'+a0[0]+'</td>',
    (full)? '    <td>'+a0[1]+'</td>':'',
    '    <td>'+a0[2]+'</td>',
    '  </tr>',
    '  <tr>',
    '    <th>new</th>',
    '    <td>'+a1[0]+'</td>',
    (full)? '    <td>'+a1[1]+'</td>':'',
    '    <td>'+a1[2]+'</td>',
    '  </tr>',
    '</table>',
    '</div>',
    '<br/>'
  ].join('\n'));

  d.append(dc);

  var b1 = $("<button>").html("apply");

  b1.on('click',function(){
    apply_alignment_art(a1);
    b2.click();
  });

  var b2 = $("<button>").html("cancel");

  b2.on('click',function(){
    $("#aa1_dialog").remove();
  });

  d.append($("<div>").append(b1).append(b2));

  $("body").append(d);

}

function apply_alignment_art(tra){

    var Camera = Map.marker;

    Data.camera.tilt     = tra[0]+90;
    Data.camera.roll     = tra[1];
    Data.camera.altitude = tra[2];

    Data.camera.kml.tilt     = tra[0]+90;
    Data.camera.kml.roll     = tra[1];
    Data.camera.kml.altitude = tra[2];

    Map.marker.setAltitude(tra[2]);
    // no need
    Map.marker._syncMeasureMarkersToBasePoint();

    x3d_initial_camera_placement();

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

function test_height_alignment_set1(){

  Data.markers = [
    // mark 1
    {
      d_map:59.51564928339807,
      d_x3d:58.313592803937226,
      align:{
        altitude: -13.5,
        latitude: 40.723442371919724,
        longitude: -111.93217635154726,
        x: 23.459612763633526,
        y: -16.16174219091789,
        z: -53.38653083581816
      }
    },
    // mark 2
    {
      d_map:33.27803820582991,
      d_x3d:33.751031067385306,
      align:{
        altitude: -13.5,
        latitude: 40.72351402663441,
        longitude: -111.9325089454651,
        x: 3.874545773959316,
        y: -14.990277738492225,
        z: -33.52789872862751
      }
    },
    // mark 3
    {
      d_map:190.2700432380853,
      d_x3d:182.86147956244875,
      align:{
        altitude: -13.5,
        latitude: 40.72385908620143,
        longitude: -111.93070113658906,
        x: 37.888760344786206,
        y: -21.838175845671834,
        z: -178.89315958779198
      }
    },
    // mark 4
    {
      d_map:123.91365898007855,
      d_x3d:121.69257093022782,
      align:{
        altitude: -11.5,
        latitude: 40.724090818868255,
        longitude: -111.93171232938768,
        x: -22.176096746469145,
        y: -16.83997830234069,
        z: -119.65493116750253
      }
    }

  ];

}

function test_height_alignment_set2(){

  //call set 1 but change heights
  test_height_alignment_set1();

  Data.markers[0].align.altitude = 0;
  Data.markers[1].align.altitude = 0;
  Data.markers[2].align.altitude = 0;
  Data.markers[3].align.altitude = 2;

}

function test_height_alignment_set3_2points(){

  Data.markers = [
    // mark 1
    {
      d_map:59.51564928339807,
      d_x3d:58.313592803937226,
      align:{
        altitude: -10.5,
        latitude: 40.723442371919724,
        longitude: -111.93217635154726,
        x: 23.459612763633526,
        y: -16.16174219091789,
        z: -53.38653083581816
      }
    },
    // mark 2
    {
      d_map:190.2700432380853,
      d_x3d:182.86147956244875,
      align:{
        altitude: -10.5,
        latitude: 40.72385908620143,
        longitude: -111.93070113658906,
        x: 37.888760344786206,
        y: -21.838175845671834,
        z: -178.89315958779198
      }
    }

  ];

}
























