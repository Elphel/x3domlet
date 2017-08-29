/*
 * convert '0.5 1.0 0.5' to #7f7
 */

function convert_color_x2l(color){

    var rgb = color.split(" ");

    var r = parseInt(rgb[0]*15);
    var g = parseInt(rgb[1]*15);
    var b = parseInt(rgb[2]*15);

    r = r.toString(16);
    g = g.toString(16);
    b = b.toString(16);

    return "#"+r+g+b;

}

/*
 * convert #7f7 to '0.5 1.0 0.5'
 */
function convert_color_l2x(color){

    var r = parseInt(color[1],16);
    var g = parseInt(color[2],16);
    var b = parseInt(color[3],16);

    r = r/15;
    g = g/15;
    b = b/15;

    return r+" "+g+" "+b;

}

// http://www.movable-type.co.uk/scripts/latlong.html
// initial bearing
// precision problems?!
/*
 * azimuth by geo coords
 */

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

/*
 * azimuth by canvas coords
 */

function getAzimuth(p1_ll,p2_ll){

    var Camera = Map.marker;

    var p1 = Camera._map.latLngToLayerPoint(p1_ll);
    var p2 = Camera._map.latLngToLayerPoint(p2_ll);

    var dx = p2.x - p1.x;
    var dz = p2.y - p1.y;

    var azimuth = (180/Math.PI*Math.atan2(dx,-dz)+360)%360;

    return azimuth;

}

function xyz_to_real_world(x,y,z){

  var R0 = Data.camera.Matrices.R0;
  var p_w = new x3dom.fields.SFVec3f(x,y,z);
  var p_rw = R0.multMatrixVec(p_w);

  return {x: p_rw.x, y: p_rw.y, z: p_rw.z};
}

function bring_angle_to_range_deg(a,a0,a1){

  var res = a;
  var c = 0;

  console.log("Bringing value "+a+" to range ["+a0+","+a1+"]");

  while ((res<a0)||(res>a1)){
    c++;

    console.log("a = "+res);

    if (res<a0) {
      res += 360;
    }else if (res>a1){
      res -= 360;
    }
    if (c==100){
      console.log("done");
      break;
    }
  }

  console.log("    result = "+res);
  return res;

}
