
var theLastMovedMarker = null;

function x3dom_delta_markers(){

  // what's the last dragged marker? (over map?)
  // see leaflet_init.js
  var index = theLastMovedMarker;

  var marker = Data.markers[index];

  var Camera = Map.marker;

  var p_mark_ll = new L.LatLng(marker.latitude, marker.longitude);
  //var p_cam_ll  = Camera._latlng;
  var p_cam_ll  = new L.LatLng(Data.camera.kml.latitude,Data.camera.kml.longitude);

  var p_w = x3dom_delta_map2scene(p_cam_ll, p_mark_ll);
  //p_w = x3dom_scene_to_real(p_w.x,p_w.y,p_w.z);


  // vertical ellipse's center
  var e2_c = p_w;
  // depth ellipse's center
  var e1_c = new x3dom.fields.SFVec3f(marker.x,marker.y,marker.z);


  // E2: draw vertical ellipsoid

  // just a coefficient
  //var e2_k = 1/2;
  var e2_k = 1;
  var e2_abc = [e2_k*1,e2_k*30,e2_k*1];
  //var e2_scale = e2_abc.join(",");
  //x3dom_draw_ellipsoid("e2","green",e2_c.toString(),"",e2_scale);

  /*
  x3dom_draw_ellipsoid_by_semiaxes_and_center("e2","green",{
    O:  e2_c,
    Ox: new x3dom.fields.SFVec3f(e2_abc[0],         0,         0),
    Oy: new x3dom.fields.SFVec3f(        0, e2_abc[1],         0),
    Oz: new x3dom.fields.SFVec3f(        0,         0, e2_abc[2])
  },transparency=0.5);
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


  $("#helper_line0").remove();
  $("#helper_line1").remove();
  $("#helper_line3").remove();

  // e1 direction
  //x3dom_draw_line("helper_line0","white", e1_c, new x3dom.fields.SFVec3f(0,0,0));
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
  e1_dir = e1_dir.normalize();

  var xa = e1_dir.cross(new x3dom.fields.SFVec3f(0,1,0));
  var ya = xa.cross(e1_dir);
  var za = e1_dir.negate();

  // next construct rotation matrix
  var RE1 = x3dom.fields.SFMatrix4f.identity();
  RE1.setValue(xa,ya,za);

  console.log(RE1.toString());

  /*
  x3dom_draw_ellipsoid_by_semiaxes_and_center("e1b","green",{
    O:  e2_c,
    Ox: xa.multiply(e1_abc[0]),
    Oy: ya.multiply(e1_abc[1]),
    Oz: za.multiply(e1_abc[2])
  },transparency=0.5);
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

  var RES = new x3dom.fields.SFMatrix4f(
               Bn.E.x[0][0], Bn.E.x[0][1], Bn.E.x[0][2], 0,
               Bn.E.x[1][0], Bn.E.x[1][1], Bn.E.x[1][2], 0,
               Bn.E.x[2][0], Bn.E.x[2][1], Bn.E.x[2][2], 0,
                          0,            0,            0, 1
             );

  console.log(RES.toString());

  x3dom_draw_ellipsoid_by_semiaxes_and_center("e1c","red",{
    O:  e2_c,
    Ox: RES.e0().multiply(es_a),
    Oy: RES.e1().multiply(es_b),
    Oz: RES.e2().multiply(es_c)
  },transparency=0.7);

  // now get error:

  // we have:
  // 1. e1_c
  // 2. RES and es_a, es_b, es_c

  // RES x e1_c

  var RESi = RES.inverse();

  var E = RESi.multMatrixVec(e1_c.subtract(e2_c));

  console.log("delta vector in ellipsoid:");
  console.log(E.toString());

  E = E.multComponents(new x3dom.fields.SFVec3f(1/es_a, 1/es_b, 1/es_c));

  console.log(E.toString());
  console.log(E.length()*E.length());

  // scale the result ellipsoid so it with touch another marker
  // and it did - it only tests that the scale is correct
  x3dom_draw_ellipsoid_by_semiaxes_and_center("e1d","gold",{
    O:  e2_c,
    Ox: RES.e0().multiply(E.length()*es_a),
    Oy: RES.e1().multiply(E.length()*es_b),
    Oz: RES.e2().multiply(E.length()*es_c)
  },transparency=0.7);

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


















