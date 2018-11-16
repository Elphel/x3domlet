
function Av_func(mark,pars){

  /*

  mark = {
    map:{ lat: 0, lng: 0, alt: 0},
    model:{ x: 0, y: 0, z: 0 }
  }

  pars = {
    lat: 0,
    lng: 0,
    alt: 0,
    heading: 0,
    tilt: 0,
    roll: 0
  }

  */

  /*
   * 'WORLD' COORDINATE SYSTEM
   * X - to North
   * Y - to East
   * Z - to Earth center
   */

  var p0_ll = new L.LatLng(pars.lat, pars.lng);
  var p1_ll = new L.LatLng(mark.map.lat, mark.map.lng);

  // get coordinates of marker in real world coorinates
  // the world is
  var pi_ll = new L.LatLng(p0_ll.lat, p1_ll.lng);

  // will need derivatives from this distanceTo
  var dx = pi_ll.distanceTo(p1_ll);
  var dy = p0_ll.distanceTo(pi_ll);
  var dz = (mark.map.alt-pars.alt)*(-1);

  // sign
  if (p1_ll.lng<p0_ll.lng) dy = -dy;
  if (p1_ll.lat<p0_ll.lat) dx = -dx;

  // dx,dy,dz - coorinates map marker in 'world' coordinates
  // with the center in p0
  //
  // which is ellipse 2 e2.

  var e2_world = new x3dom.fields.SFVec3f(dx,dy,dz);

  console.log("MARK-on-MAP in WORLD:   "+e2_world.toString());

  var heading = pars.heading*Math.PI/180;
  var tilt    = (pars.tilt-90)*Math.PI/180;
  var roll    = pars.roll*Math.PI/180;

  // Heading,Tilt,Roll
  var Mh = x3dom.fields.SFMatrix4f.rotationZ(heading);
  var Mt = x3dom.fields.SFMatrix4f.rotationY(tilt);
  var Mr = x3dom.fields.SFMatrix4f.rotationX(roll);

  // I'll need R'
  var R = Mh.mult(Mt).mult(Mr);
  // T is constant
  var T = x3dom_toYawPitchRoll();

  var M2W = R.mult(T);
  var W2M = R.mult(T).inverse();

  var e1_model = new x3dom.fields.SFVec3f(mark.model.x,mark.model.y,mark.model.z);
  var e1_world = M2W.multMatrixVec(e1_model);

  var e2_model = W2M.multMatrixVec(e2_world);

  x3dom_draw_line("soup0","white", new x3dom.fields.SFVec3f(0,0,0), e1_model);
  x3dom_draw_line("soup1","white", new x3dom.fields.SFVec3f(0,0,0), e2_model);
  x3dom_draw_line("soup2","white", e1_model, e2_model);

  console.log("MARK-on-MODEL in WORLD: "+e1_world.toString());

  // pointing from model mark to map mark
  var v = e1_world.subtract(e2_world);

  // Need to find A

  // point in Model
  // from 0,0,0
  var e1_d = x3dom_3d_distance(e1_world.x,e1_world.y,e1_world.z,false);
  var e1_k = 20;
  //var e1_k = 1;
  var e1_abc = [e1_k*0.00038*e1_d, e1_k*0.00038*e1_d, 2*e1_k*e1_d*e1_d/10000];
  //var e1_abc = [e1_k*0.00038*e1_d, e1_k*0.00038*e1_d, e1_k*e1_d*e1_d/25000];

  var e1_dir = e1_world.normalize();

  // -z look upwards in world coordinates
  //var xa1 = e1_dir.cross(new x3dom.fields.SFVec3f(0,0,-1));
  var xa1 = e1_dir.cross(new x3dom.fields.SFVec3f(0,1,0));
  var ya1 = xa1.cross(e1_dir);
  var za1 = e1_dir.negate();

  /*
  x3dom_draw_ellipsoid_by_semiaxes_and_center("e1","green",{
    O:  W2M.multMatrixVec(e2_world),
    Ox: W2M.multMatrixVec(xa1.multiply(e1_abc[0])),
    Oy: W2M.multMatrixVec(ya1.multiply(e1_abc[1])),
    Oz: W2M.multMatrixVec(za1.multiply(e1_abc[2]))
  },transparency=0.5);
  */

  var RE1 = x3dom.fields.SFMatrix4f.identity();
  RE1.setValue(xa1,ya1,za1);
  // and so RE1 is in the world coordinates

  var e2_k = 1;
  var e2_abc = [e2_k*1,e2_k*1,e2_k*30];

  var xa2 = new x3dom.fields.SFVec3f(e2_abc[0],         0,         0);
  var ya2 = new x3dom.fields.SFVec3f(        0, e2_abc[1],         0);
  var za2 = new x3dom.fields.SFVec3f(        0,         0, e2_abc[2]);

  /*
  x3dom_draw_ellipsoid_by_semiaxes_and_center("e2","green",{
    O:  W2M.multMatrixVec(e2_world),
    Ox: W2M.multMatrixVec(xa2),
    Oy: W2M.multMatrixVec(ya2),
    Oz: W2M.multMatrixVec(za2)
  },transparency=0.5);
  */

  // it's vertical in the WORLD
  var RE2 = x3dom.fields.SFMatrix4f.identity();

  // now let's get to covariance matrix
  var JE1 = x3dom_ellipsoid_inertia_tensor_v2(1,e1_abc[0],e1_abc[1],e1_abc[2]);
  var RE1xJE1 = RE1.mult(JE1);

  var JE2 = x3dom_ellipsoid_inertia_tensor_v2(1,e2_abc[0],e2_abc[1],e2_abc[2]);
  var RE2xJE2 = RE2.mult(JE2);

  var C1 = RE1xJE1.mult(RE1xJE1.transpose());
  var C2 = RE2xJE2.mult(RE2xJE2.transpose());
  var C = C1.add(C2);
  var C = C1.add(C1);
  //var C = C2.add(C2);

  Cn = matrix_x3dom_to_numeric(C);
  Bn = numeric.eig(Cn);

  var es_a = Math.sqrt(Bn.lambda.x[0]);
  var es_b = Math.sqrt(Bn.lambda.x[1]);
  var es_c = Math.sqrt(Bn.lambda.x[2]);

  var vec0 = new x3dom.fields.SFVec3f(Bn.E.x[0][0],Bn.E.x[0][1],Bn.E.x[0][2]);
  var vec1 = new x3dom.fields.SFVec3f(Bn.E.x[1][0],Bn.E.x[1][1],Bn.E.x[1][2]);
  var vec2 = new x3dom.fields.SFVec3f(Bn.E.x[2][0],Bn.E.x[2][1],Bn.E.x[2][2]);

  var RESmatrix = new x3dom.fields.SFMatrix4f(
               vec0.x, vec1.x, vec2.x, 0,
               vec0.y, vec1.y, vec2.y, 0,
               vec0.z, vec1.x, vec2.z, 0,
                    0,      0,      0, 1
             );
  //RESmatrix = RESmatrix.transpose();

  var RESaxes = new x3dom.fields.SFMatrix4f(
               es_a,    0,    0, 0,
                  0, es_b,    0, 0,
                  0,    0, es_c, 0,
                  0,    0,    0, 1
             );

  var A = RESaxes.inverse().mult(RESmatrix.transpose());

  x3dom_draw_ellipsoid_by_semiaxes_and_center("ec1","gold",{
    O:  W2M.multMatrixVec(e2_world),
    Ox: W2M.multMatrixVec(RESmatrix.transpose().e0().multiply(es_a)),
    Oy: W2M.multMatrixVec(RESmatrix.transpose().e1().multiply(es_b)),
    Oz: W2M.multMatrixVec(RESmatrix.transpose().e2().multiply(es_c))
  },transparency=0.7);

}

var theLastMovedMarker = null;

function x3dom_delta_markers(){

  // what's the last dragged marker? (over map?)
  // see leaflet_init.js
  var index = theLastMovedMarker;

  var marker = Data.markers[index];
  console.log(marker);

  var Camera = Map.marker;

  // calling this function
  Av_func({
      map: { lat: marker.latitude, lng: marker.longitude, alt: marker.altitude},
      model: {x: marker.x, y: marker.y, z: marker.z}
    },
    {
      lat:     Data.camera.kml.latitude,
      lng:     Data.camera.kml.longitude,
      alt:     Data.camera.kml.altitude,
      heading: Data.camera.kml.heading,
      tilt:    Data.camera.kml.tilt,
      roll:    Data.camera.kml.roll
    }
  );

  /*
  var e1_c = new x3dom.fields.SFVec3f(marker.x,marker.y,marker.z);
  x3dom_draw_line("x0","red",   e1_c, e1_c.add(new x3dom.fields.SFVec3f(50, 0, 0)));
  x3dom_draw_line("y0","green", e1_c, e1_c.add(new x3dom.fields.SFVec3f( 0,50, 0)));
  x3dom_draw_line("z0","blue",  e1_c, e1_c.add(new x3dom.fields.SFVec3f( 0, 0,50)));

  x3dom_draw_line("x1","red",   new x3dom.fields.SFVec3f(0,0,0), new x3dom.fields.SFVec3f(50, 0, 0));
  x3dom_draw_line("y1","green", new x3dom.fields.SFVec3f(0,0,0), new x3dom.fields.SFVec3f( 0,50, 0));
  x3dom_draw_line("z1","blue",  new x3dom.fields.SFVec3f(0,0,0), new x3dom.fields.SFVec3f( 0, 0,50));
  */

  return 0;

  var p_mark_ll = new L.LatLng(marker.latitude, marker.longitude);
  //var p_cam_ll  = Camera._latlng;
  var p_cam_ll  = new L.LatLng(Data.camera.kml.latitude,Data.camera.kml.longitude);

  var p_model = x3dom_delta_map2scene(p_cam_ll, p_mark_ll);
  //p_w = x3dom_scene_to_real(p_w.x,p_w.y,p_w.z);


  // vertical ellipse's center
  var e2_c = p_model;
  // depth ellipse's center
  var e1_c = new x3dom.fields.SFVec3f(marker.x,marker.y,marker.z);


  // E2: draw vertical ellipsoid

  // just a coefficient
  //var e2_k = 1/2;
  var e2_k = 1;
  var e2_abc = [e2_k*1,e2_k*30,e2_k*1];
  //var e2_scale = e2_abc.join(",");
  //x3dom_draw_ellipsoid("e2","green",e2_c.toString(),"",e2_scale);

  var R0  = Data.camera.Matrices.R0;
  var R0i = Data.camera.Matrices.R0.inverse();

  var xa2 = new x3dom.fields.SFVec3f(e2_abc[0],         0,         0);
  var ya2 = new x3dom.fields.SFVec3f(        0, e2_abc[1],         0);
  var za2 = new x3dom.fields.SFVec3f(        0,         0, e2_abc[2]);

  /*
  x3dom_draw_ellipsoid_by_semiaxes_and_center("e2","green",{
    O:  e2_c,
    Ox: R0i.multMatrixVec(xa2),
    Oy: R0i.multMatrixVec(ya2),
    Oz: R0i.multMatrixVec(za2)
  },transparency=0.0);
  */


  var RE2 = x3dom.fields.SFMatrix4f.identity();
  //RE2.setValue(xa,ya,za);

  // draw ellipsoid axes
  //var xa = new x3dom.fields.SFVec3f(1,0,0);
  //var ya = new x3dom.fields.SFVec3f(0,1,0);
  //var za = new x3dom.fields.SFVec3f(0,0,1);

  //x3dom_draw_line("xa","red",  e2_c, e2_c.add(xa.multiply(e2_abc[0])));
  //x3dom_draw_line("ya","green",e2_c, e2_c.add(ya.multiply(e2_abc[1])));
  //x3dom_draw_line("za","blue", e2_c, e2_c.add(za.multiply(e2_abc[2])));

  // to 0,0,0
  //x3dom_draw_line("test0","white", e2_c, new x3dom.fields.SFVec3f(0,0,0));

  //x3dom_draw_line("test1","tomato", new x3dom.fields.SFVec3f(0,0,0), new x3dom.fields.SFVec3f(100,0,0));
  //x3dom_draw_line("test2","seagreen", new x3dom.fields.SFVec3f(0,0,0), new x3dom.fields.SFVec3f(0,100,0));
  //x3dom_draw_line("test3","royalblue", new x3dom.fields.SFVec3f(0,0,0), new x3dom.fields.SFVec3f(0,0,100));
  //x3dom_draw_line("test4","royalblue", e2_c.add(za.multiply(e2_abc[2])), new x3dom.fields.SFVec3f(0,0,100));

  // e1 direction
  x3dom_draw_line("helper_line0a","white", e1_c, new x3dom.fields.SFVec3f(0,0,0));
  x3dom_draw_line("helper_line0b","white", e2_c, new x3dom.fields.SFVec3f(0,0,0));
  // e1 direction from e2_c
  //x3dom_draw_line("helper_line1","white", e2_c.add(e1_c), e2_c.subtract(e1_c));

  x3dom_draw_line("helper_line3","white", e1_c, e2_c);

  // E1: draw tilted ellipsoid

  var e1_d = x3dom_3d_distance(e1_c.x,e1_c.y,e1_c.z,false);
  //var e1_k = 20;
  var e1_k = 1;
  var e1_abc = [e1_k*0.00038*e1_d,e1_k*0.00038*e1_d,2*e1_k*e1_d*e1_d/10000];

  console.log("e1 abc: "+e1_abc.join(" "));

  // draw ellipsoid axes
  var e1_dir  = e1_c;
  e1_dir = R0.multMatrixVec(e1_dir.normalize());

  var xa1 = e1_dir.cross(new x3dom.fields.SFVec3f(0,1,0));
  var ya1 = xa1.cross(e1_dir);
  var za1 = e1_dir.negate();

  // next construct rotation matrix
  // it's in the WORLD coordinates
  var RE1 = x3dom.fields.SFMatrix4f.identity();
  RE1.setValue(xa1,ya1,za1);

  //console.log(RE1.toString());

  /*
  x3dom_draw_ellipsoid_by_semiaxes_and_center("e1b","green",{
    O:  e2_c,
    Ox: R0i.multMatrixVec(xa1).multiply(e1_abc[0]),
    Oy: R0i.multMatrixVec(ya1).multiply(e1_abc[1]),
    Oz: R0i.multMatrixVec(za1).multiply(e1_abc[2])
  },transparency=0.0);
  */

  // now let's get to covariance matrix
  var JE1 = x3dom_ellipsoid_inertia_tensor_v2(1,e1_abc[0],e1_abc[1],e1_abc[2]);
  var RE1xJE1 = RE1.mult(JE1);

  var JE2 = x3dom_ellipsoid_inertia_tensor_v2(1,e2_abc[0],e2_abc[1],e2_abc[2]);
  var RE2xJE2 = RE2.mult(JE2);

  var C1 = RE1xJE1.mult(RE1xJE1.transpose());
  var C2 = RE2xJE2.mult(RE2xJE2.transpose());

  var C = C1.add(C2);
  // testing
  //var C = C1.add(C1);

  Cn = matrix_x3dom_to_numeric(C);
  Bn = numeric.eig(Cn);

  //console.log(Bn);

  var es_a = Math.sqrt(Bn.lambda.x[0]);
  var es_b = Math.sqrt(Bn.lambda.x[1]);
  var es_c = Math.sqrt(Bn.lambda.x[2]);

  console.log("e1 restored abc: "+[es_a,es_b,es_c].join(" "));

  var RESmatrix = new x3dom.fields.SFMatrix4f(
               Bn.E.x[0][0], Bn.E.x[1][0], Bn.E.x[2][0], 0,
               Bn.E.x[0][1], Bn.E.x[1][1], Bn.E.x[2][1], 0,
               Bn.E.x[0][2], Bn.E.x[1][2], Bn.E.x[2][2], 0,
                          0,            0,            0, 1
             );

  console.log(RESmatrix.toString());

  var RESaxes = new x3dom.fields.SFMatrix4f(
               es_a,    0,    0, 0,
                  0, es_b,    0, 0,
                  0,    0, es_c, 0,
                  0,    0,    0, 1
             );

  var A = RESaxes.inverse().mult(RESmatrix.transpose());

  console.log(RESaxes.toString());

  var RES = RESmatrix.mult(RESaxes);

  var RESt = RES.transpose();
  console.log("RES");
  console.log(RES.toString());
  console.log("RESt");
  console.log(RESt.toString());

  /*
  x3dom_draw_ellipsoid_by_semiaxes_and_center("e1c","red",{
    O:  e2_c,
    Ox: R0i.multMatrixVec(RESmatrix.transpose().e0()).multiply(es_a),
    Oy: R0i.multMatrixVec(RESmatrix.transpose().e1()).multiply(es_b),
    Oz: R0i.multMatrixVec(RESmatrix.transpose().e2()).multiply(es_c)
  },transparency=0.8);
  */

  var v = R0.multMatrixVec(e1_c.subtract(e2_c));
  var Av = A.multMatrixVec(v);
  var Av_model = R0i.multMatrixVec(Av);

  x3dom_draw_line("helper_lineX","yellow", e2_c, e2_c.add(Av_model));

  // now get error:

  // we have:
  // 1. e1_c
  // 2. RES and es_a, es_b, es_c

  // RES x e1_c
  var RESi = RES.inverse();

  var E = RESi.multMatrixVec(v);

  console.log("delta vector in ellipsoid:");
  console.log(E.toString());

  E = E.multComponents(new x3dom.fields.SFVec3f(1/es_a, 1/es_b, 1/es_c));

  console.log(E.toString());
  console.log("E^2 from eigen: " +E.length()*E.length());

  // scale the result ellipsoid so it with touch another marker
  // and it did - it only tests that the scale is correct

  /*
  x3dom_draw_ellipsoid_by_semiaxes_and_center("e1d","gold",{
    O:  e2_c,
    Ox: RES.e0().multiply(E.length()*es_a),
    Oy: RES.e1().multiply(E.length()*es_b),
    Oz: RES.e2().multiply(E.length()*es_c)
  },transparency=0.7);
  */

  // alternative calculations where E^2 = delta^T x C^-1 x delta
  var delta = v;
  var Ci = C.inverse();

  var Ci_x_delta = Ci.multMatrixVec(delta);
  var E2 = delta.dot(Ci_x_delta);

  console.log("E^2 from d^T x C^-1 x d: "+E2);

  return 0;

}

/*
 e is an object
  {
    O:  x3dom.fields.SFVec3f()
    Ox: x3dom.fields.SFVec3f()
    Oy: x3dom.fields.SFVec3f()
    Oz: x3dom.fields.SFVec3f()
  }
*/
function x3dom_draw_ellipsoid_by_semiaxes_and_center(id,color,e,transparency=0.5){

  var transl = e.O.toString();
  var scale = [e.Ox.length(),e.Oy.length(),e.Oz.length()].join(" ");

  var xa = e.Ox.normalize();
  var ya = e.Oy.normalize();
  var za = e.Oz.normalize();

  var R = x3dom.fields.SFMatrix4f.identity();
  R.setValue(xa,ya,za);

  var translation = new x3dom.fields.SFVec3f(0,0,0);
  var scaleFactor = new x3dom.fields.SFVec3f(1,1,1);
  var rotation = new x3dom.fields.Quaternion(0,0,1,0);
  var scaleOrientation = new x3dom.fields.Quaternion(0,0,1,0);

  R.getTransform(translation, rotation, scaleFactor, scaleOrientation);

  var q = rotation.toAxisAngle();
  var q_str = q[0].toString()+" "+q[1];

  $("#"+id+"_xa").remove();
  $("#"+id+"_ya").remove();
  $("#"+id+"_za").remove();

  // draw semi-axes
  x3dom_draw_line(id+"_xa","red",   e.O, e.O.add(e.Ox));
  x3dom_draw_line(id+"_ya","green", e.O, e.O.add(e.Oy));
  x3dom_draw_line(id+"_za","blue",  e.O, e.O.add(e.Oz));

  x3dom_draw_ellipsoid(id,color,transl,q_str,scale,transparency);

}

function x3dom_draw_ellipsoid(id,color,transl,rotat,scale,transparency=0.5){

  $("#"+id).remove();

  var html = [
    '<group id="'+id+'">',
    '  <switch whichChoice="0">',
    '    <transform translation="'+transl+'" >',
    '      <transform rotation="'+rotat+'" >',
    '        <transform scale="'+scale+'" >',
    '          <shape>',
    '            <appearance>',
    '               <material diffuseColor="'+color+'" transparency="'+transparency+'"></material>',
    '            </appearance>',
    '            <sphere radius="1"></sphere>',
    '          </shape>',
    '        </transform>',
    '      </transform>',
    '    </transform>',
    '  </switch>',
    '</group>'
  ].join('\n');

  var sphere_element = $(html);
  $('scene',Scene.element).append(sphere_element);

}

function x3dom_draw_line(id,color,p1,p2){

  $("#"+id).remove();

  var coords = [
    p1.x+" "+p1.y+" "+p1.z,
    p2.x+" "+p2.y+" "+p2.z
  ].join(" ");

  var html = [
    '<group id="'+id+'">',
    '  <switch whichChoice="0">',
    '    <transform>',
    '      <shape>',
    '        <appearance>',
    '          <material emissiveColor="'+color+'" transparency="0.0"></material>',
    '        </appearance>',
    '        <lineset vertexCount="2" solid="true" ccw="true" lit="true">',
    '          <coordinate point="'+coords+'"></coordinate>',
    '        </lineset>',
    '      </shape>',
    '    </transform>',
    '  </switch>',
    '</group>'
  ].join('\n');

  var sphere_element = $(html);
  $('scene',Scene.element).append(sphere_element);

}

// Ellipsoids parameters:

// For map:
//   m = 1,
//   a = 0.1
//   b = 0.1
//   c = 30 or 50? or 100?

// For model (depends on distance):
//   m = 1
//   a = 4.38*0.0001*d
//   b = 4.38*0.0001*d
//   c = d*d/10000 or d*d/25000

function x3dom_ellipsoid_inertia_tensor(m,a,b,c){

    var Jxx = 1/5*m*(b*b+c*c);
    var Jyy = 1/5*m*(a*a+c*c);
    var Jzz = 1/5*m*(a*a+b*b);

    return new x3dom.fields.SFMatrix4f(
        Jxx,   0,   0, 0,
          0, Jyy,   0, 0,
          0,   0, Jzz, 0,
          0,   0,   0, 1
    );

}

function x3dom_ellipsoid_inertia_tensor_v2(m,a,b,c){

    return new x3dom.fields.SFMatrix4f(
          a, 0, 0, 0,
          0, b, 0, 0,
          0, 0, c, 0,
          0, 0, 0, 1
    );

}

// also from 4x4 to 3x3
function matrix_x3dom_to_numeric(m){

  return [
    [m._00, m._01, m._02],
    [m._10, m._11, m._12],
    [m._20, m._21, m._22]
  ];

}


















