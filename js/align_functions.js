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
  var vec = new x3dom.fields.SFVec3f(mark.align.x-base.x,0,mark.align.z-base.z);
  var res = Math.atan2(vec.x,-vec.z)*180/Math.PI + v[2];

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
  return 1;
  //return 1/art_l_i(i);
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
  return 1;
  //return 1/art_l_i(i);
}
