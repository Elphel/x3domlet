/*

  Copyright (C) 2017 Elphel Inc.

  License: GPL-3.0

  https://www.elphel.com

*/
/**
 * @file this file
 * @brief
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

/**
 * hll_ and art_
 */

/**
 * Functions for heading and position latitude and longitude
 * hll_...
 */

/*
 * heading in degrees from 3D model
 */
function hll_f_3d_i(i,v){

  var base = Data.camera;
  var mark = Data.markers[i];

  //var xyz_real = x3dom_scene_to_real(mark.align.x-base.x,mark.align.y-base.y,mark.align.z-base.z);
  //var xyz_real = x3dom_scene_to_heading(mark.align.x-base.x,mark.align.y-base.y,mark.align.z-base.z);
  var xyz_real = x3dom_scene_to_heading(mark.align.x,mark.align.y,mark.align.z);

  var vec = new x3dom.fields.SFVec3f(xyz_real.x,xyz_real.y,xyz_real.z);
  //var vec = new x3dom.fields.SFVec3f(mark.align.x-base.x,mark.align.y-base.y,mark.align.z-base.z);
  var res = Math.atan2(vec.x,-vec.z)*180/Math.PI + v[2];

  //console.log("hll_f_3d_i: "+i+" "+res);

  if (res> 180) res = res - 360;
  if (res<-180) res = res + 360;

  return res;
}

/*
 * heading in degrees from map
 */
function hll_f_map_i(i,v){

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
function hll_r_i(i,v){
  var f1 = hll_f_3d_i(i,v);
  var f2 = hll_f_map_i(i,v);
  //return (f1-f2+360)%360;
  f1 -= v[2];
  f2 -= v[2];
  f1 = bring_degrees_to_n180_180(f1);
  f2 = bring_degrees_to_n180_180(f2);

  return (f1-f2);
}

/*
 * dr/dx(i)
 */
function hll_dr_dx_i(i,v){

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
function hll_dr_dy_i(i,v){

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
function hll_dr_dh_i(i,v){
  return 1;
}

/**
 * weight function
 */

function hll_w_i(i,v){

  var mark = Data.markers[i];
  var xi = mark.align.x;
  var yi = mark.align.y;
  var zi = mark.align.z;

  //var arad = 0.0004404;
  var D = 100;

  var d = Math.sqrt(Math.pow(xi,2)+Math.pow(yi,2)+Math.pow(zi,2));

  var res = d/D;
  res = (res>1)?1:res;

  return res;

}

/**
 * Functions for heading (position latitude and longitude are fixed)
 * hll2_...
 */

function hll2_r_i(i,v){

  var lat = Data.camera.kml.latitude;
  var lng = Data.camera.kml.longitude;

  var f1 = hll_f_3d_i(i,[lat,lng,v[0]]);
  var f2 = hll_f_map_i(i,[lat,lng,v[0]]);

  f1 -= v[0];
  f2 -= v[0];
  f1 = bring_degrees_to_n180_180(f1);
  f2 = bring_degrees_to_n180_180(f2);

  //return (f1-f2+360)%360;
  return (f1-f2);
}

function hll2_dr_dx_i(i,v){

  var lat = Data.camera.kml.latitude;
  var lng = Data.camera.kml.longitude;

  return hll_dr_dh_i(i,[lat,lng,v[0]]);

}

function hll2_w_i(i,v){

  var lat = Data.camera.kml.latitude;
  var lng = Data.camera.kml.longitude;

  return hll_w_i(i,[lat,lng,v[0]]);

}

function bring_degrees_to_n180_180(a){

  while(a<-180){
    a += 360;
  }
  while(a>180){
    a -= 360;
  }
  return a;

}

/**
 * Functions for position latitude and longitude (heading is fixed)
 * hll3_...
 */
function hll3_r_i(i,v){

  var heading = Data.camera.kml.heading;

  var f1 = hll_f_3d_i(i,[v[0],v[1],heading]);
  var f2 = hll_f_map_i(i,[v[0],v[1],heading]);

  console.log("f1 vs f2 ==  start");
  console.log("1: "+f1+" vs "+f2);

  f1 -= heading;
  f2 -= heading;

  console.log("2: "+f1+" vs "+f2);

  f1 = bring_degrees_to_n180_180(f1);
  f2 = bring_degrees_to_n180_180(f2);

  console.log("3: "+f1+" vs "+f2);
  console.log("f1 vs f2 ==  stop");

  //return (f1-f2+360)%360;
  return (f1-f2);
}

function hll3_dr_dx_i(i,v){

  var heading = Data.camera.kml.heading;
  return hll_dr_dx_i(i,[v[0],v[1],heading]);

}

function hll3_dr_dy_i(i,v){

  var heading = Data.camera.kml.heading;
  return hll_dr_dy_i(i,[v[0],v[1],heading]);

}

function hll3_w_i(i,v){

  var heading = Data.camera.kml.heading;

  return hll_w_i(i,[v[0],v[1],heading]);

}

/**
 * Functions for position latitude and longitude (heading is fixed)
 * hll4a_...
 */
// p0 = new L.LatLng(lat0,lng0)
// p1 = new L.LatLng(lat0,lng0)
// p0.distanceTo(p1)

function hll4a_r_i(i,v){
  return hll3_r_i(i,v);
}

function hll4a_dr_dx_i(i,v){
  return hll3_dr_dx_i(i,v);
}

function hll4a_dr_dy_i(i,v){
  return hll3_dr_dy_i(i,v);
}

function hll4a_w_i(i,v){
  return hll3_w_i(i,v);
}

function hll4b_3d_i(i,v){

  var base = Data.camera;
  var mark = Data.markers[i];

  // 3D model part
  var xyz_real = x3dom_scene_to_heading(mark.align.x,mark.align.y,mark.align.z);
  var vec_xz = new x3dom.fields.SFVec3f(xyz_real.x,0,xyz_real.z);
  var d_3d = vec_xz.length();

  return d_3d;

}

function hll4b_map_i(i,v){

  var base = Data.camera;
  var mark = Data.markers[i];

  var p1_ll = new L.LatLng(v[0],v[1]);
  var p2_ll = new L.LatLng(mark.align.latitude,mark.align.longitude);

  var d_map = p1_ll.distanceTo(p2_ll);

  return d_map;

}

function hll4b_r_i(i,v){

  var base = Data.camera;
  var mark = Data.markers[i];

  // 3D model part
  var d_3d = hll4b_3d_i(i,v);
  // Map part
  var d_map = hll4b_map_i(i,v);

  // bring error to degrees:
  var result = Math.atan((d_3d-d_map)/d_3d)*180/Math.PI;

  return result;
}

// latitude
function hll4b_dr_dx_i(i,v){

  var mark = Data.markers[i];

  var p1_ll = new L.LatLng(v[0],v[1]);
  var p2_ll = new L.LatLng(mark.align.latitude,mark.align.longitude);

  p1_ll.lat = p1_ll.lat*Math.PI/180;
  p1_ll.lng = p1_ll.lng*Math.PI/180;

  p2_ll.lat = p2_ll.lat*Math.PI/180;
  p2_ll.lng = p2_ll.lng*Math.PI/180;

  var dlat = p2_ll.lat-p1_ll.lat;
  var dlon = p2_ll.lng-p1_ll.lng;

  // L.CRS.Earth.R - distance in meters

  var a = Math.sin(dlat/2)*Math.sin(dlat/2)+Math.cos(p1_ll.lat)*Math.cos(p2_ll.lat)*Math.sin(dlon/2)*Math.sin(dlon/2);
  var da = -1/2*Math.sin(dlat/4)-Math.sin(p1_ll.lat)*Math.cos(p2_ll.lat)*Math.sin(dlon/2)*Math.sin(dlon/2)*(-1);

  var res = L.CRS.Earth.R*(1/Math.sqrt(a))*(1/Math.sqrt(1-a))*da;

  // extra coeff
  var d_3d  = hll4b_3d_i(i,v);
  var d_map = hll4b_map_i(i,v);
  //var k = -1/d_3d*180/Math.PI;

  var result = 1/(1+((d_3d-d_map)/d_3d))*(-1)*res*180/Math.PI;

  return result;

}

// longitude
function hll4b_dr_dy_i(i,v){

  var mark = Data.markers[i];

  var p1_ll = new L.LatLng(v[0],v[1]);
  var p2_ll = new L.LatLng(mark.align.latitude,mark.align.longitude);

  p1_ll.lat = p1_ll.lat*Math.PI/180;
  p1_ll.lng = p1_ll.lng*Math.PI/180;

  p2_ll.lat = p2_ll.lat*Math.PI/180;
  p2_ll.lng = p2_ll.lng*Math.PI/180;

  var dlat = p2_ll.lat-p1_ll.lat;
  var dlon = p2_ll.lng-p1_ll.lng;

  // L.CRS.Earth.R - distance in meters

  var a = Math.sin(dlat/2)*Math.sin(dlat/2)+Math.cos(p1_ll.lat)*Math.cos(p2_ll.lat)*Math.sin(dlon/2)*Math.sin(dlon/2);
  var da = (-1/2)*Math.cos(p1_ll.lat)*Math.cos(p2_ll.lat)*Math.sin(dlon/2)*Math.cos(dlon/2);

  var res = L.CRS.Earth.R*(1/Math.sqrt(a))*(1/Math.sqrt(1-a))*da;

  // extra coeff
  var d_3d  = hll4b_3d_i(i,v);
  var d_map = hll4b_map_i(i,v);
  //var k = -1/d_3d*180/Math.PI;

  var result = 1/(1+((d_3d-d_map)/d_3d))*(-1)*res*180/Math.PI;

  return result;

}

function hll4b_w_i(i,v){

  return 1;

}

/**
 * Functions for relative altitude, tilt and roll
 * art_...
 */

function art_f_3d_i(i,v){

  var mark = Data.markers[i];
  var xi = mark.align.x;
  var yi = mark.align.y;
  var zi = mark.align.z;

  var res  = -Math.cos(v[0])*Math.sin(v[1])*xi;
      res +=  Math.cos(v[0])*Math.cos(v[1])*yi;
      res += -Math.sin(v[0])*zi;

      res += v[2];

  return res;

}

function art_f_map_i(i,v){

  var mark = Data.markers[i];
  return mark.align.altitude;

}

function art_r_i(i,v){

  var f1 = art_f_3d_i(i,v);
  var f2 = art_f_map_i(i,v);
  //return (f1-f2+360)%360;
  return (f1-f2);
}

function art_dr_dx_i(i,v){

  var mark = Data.markers[i];
  var xi = mark.align.x;
  var yi = mark.align.y;
  var zi = mark.align.z;

  var res  =  Math.sin(v[0])*Math.sin(v[1])*xi;
      res += -Math.sin(v[0])*Math.cos(v[1])*yi;
      res += -Math.cos(v[0])*zi;

  return res;

}

function art_dr_dy_i(i,v){

  var mark = Data.markers[i];
  var xi = mark.align.x;
  var yi = mark.align.y;
  var zi = mark.align.z;

  var res  = -Math.cos(v[0])*Math.cos(v[1])*xi;
      res += -Math.cos(v[0])*Math.sin(v[1])*yi;

  return res;

}

function art_dr_da_i(i,v){
  return 1;
}

function art_l_i(i){

  var mark = Data.markers[i];
  var xi = mark.align.x;
  var yi = mark.align.y;
  var zi = mark.align.z;

  return Math.sqrt(Math.pow(xi,2)+Math.pow(yi,2)+Math.pow(zi,2));

}

function art_w_i(i,v){
  //return 1;
  //return 1/art_l_i(i);
  return art_l_i(i);
}

/**
 * Functions for relative altitude, tilt and roll
 * art2_...
 */

function art2_f_3d_i(i,v){
  return art_f_3d_i(i,[v[0],0,v[1]]);
}

function art2_f_map_i(i,v){
  return art_f_map_i(i,[v[0],0,v[1]]);
}

function art2_r_i(i,v){

  var f1 = art2_f_3d_i(i,v);
  var f2 = art2_f_map_i(i,v);
  //return (f1-f2+360)%360;
  return (f1-f2);
}

function art2_dr_dx_i(i,v){
  return art_dr_dx_i(i,[v[0],0,v[1]]);
}

function art2_dr_da_i(i,v){
  return 1;
}

function art2_l_i(i){

  var mark = Data.markers[i];
  var xi = mark.align.x;
  var yi = mark.align.y;
  var zi = mark.align.z;

  return Math.sqrt(Math.pow(xi,2)+Math.pow(yi,2)+Math.pow(zi,2));

}

function art2_w_i(i,v){
  //return 1;
  return 1/art_l_i(i);
}
