
var theLastMovedMarker = null;

function x3dom_delta_markers(){

  // what's the last dragged marker? (over map?)
  // see leaflet_init.js
  var index = theLastMovedMarker;

  var marker = Data.markers[index];
  console.log(marker);

  var Camera = Map.marker;

  // calling this function
  Av_f({
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

}

function Av_f(mark,pars){

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

  //x3dom_draw_line("soup0","white", new x3dom.fields.SFVec3f(0,0,0), e1_model);
  //x3dom_draw_line("soup1","white", new x3dom.fields.SFVec3f(0,0,0), e2_model);
  //x3dom_draw_line("soup2","white", e1_model, e2_model);

  // world axes are correct - verified
  //x3dom_draw_line("soup0","red",   e1_model, e1_model.add(W2M.multMatrixVec(new x3dom.fields.SFVec3f(10,0,0))));
  //x3dom_draw_line("soup1","green", e1_model, e1_model.add(W2M.multMatrixVec(new x3dom.fields.SFVec3f(0,10,0))));
  //x3dom_draw_line("soup2","blue",  e1_model, e1_model.add(W2M.multMatrixVec(new x3dom.fields.SFVec3f(0,0,10))));

  console.log("MARK-on-MODEL in WORLD: "+e1_world.toString());

  // pointing from model mark to map mark
  var v = e1_world.subtract(e2_world);

  // Need to find A

  // point in Model
  // from 0,0,0
  var e1_d = x3dom_3d_distance(e1_world.x,e1_world.y,e1_world.z,false);
  //var e1_k = 20;
  var e1_k = 1;
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
  //var C = C1.add(C1);
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
               vec0.z, vec1.z, vec2.z, 0,
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

  x3dom_draw_ellipsoid_by_semiaxes_and_center("ec1","red",{
    O:  W2M.multMatrixVec(e2_world),
    Ox: W2M.multMatrixVec(RESmatrix.transpose().e0().multiply(es_a)),
    Oy: W2M.multMatrixVec(RESmatrix.transpose().e1().multiply(es_b)),
    Oz: W2M.multMatrixVec(RESmatrix.transpose().e2().multiply(es_c))
  },transparency=0.8);

  // and so, the error vector is E=Av
  var Av = A.multMatrixVec(v);
  // draw the vector
  x3dom_draw_line("err0","gold", e1_model, e1_model.add(W2M.multMatrixVec(Av)));

  // Is it correct? The direction seems right for close and far objects

  // return vector
  return Av;
}

function Av_df_dx(){
  console.log("Welcome to dAv/dx");
};

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


















