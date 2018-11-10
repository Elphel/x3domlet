
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
  var e2_k = 1/2;
  var e2_abc = [e2_k*1,e2_k*30,e2_k*1];
  var e2_scale = e2_abc.join(",");
  //x3dom_draw_ellipsoid("e2","green",e2_c.toString(),"",e2_scale);

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
  x3dom_draw_line("helper_line0","white", e1_c, new x3dom.fields.SFVec3f(0,0,0));
  // e1 direction from e2_c
  x3dom_draw_line("helper_line1","white", e2_c.add(e1_c), e2_c.subtract(e1_c));


  // E1: draw tilted ellipsoid

  var e1_d = x3dom_3d_distance(e1_c.x,e1_c.y,e1_c.z,false);
  var e1_k = 20;
  var e1_abc = [e1_k*0.00038*e1_d,e1_k*0.00038*e1_d,2*e1_k*e1_d*e1_d/10000];
  var e1_scale = e1_abc.join(",");
  console.log("e1 scale: "+e1_scale);

  // draw ellipsoid axes
  var e1_dir  = e1_c;
  e1_dir = e1_dir.normalize();

  var xa = e1_dir.cross(new x3dom.fields.SFVec3f(0,1,0));
  var ya = xa.cross(e1_dir);
  var za = e1_dir.negate();

  x3dom_draw_line("xa","red",  e2_c, e2_c.add(xa.multiply(e1_abc[0])));
  x3dom_draw_line("ya","green",e2_c, e2_c.add(ya.multiply(e1_abc[1])));
  x3dom_draw_line("za","blue", e2_c, e2_c.add(za.multiply(e1_abc[2])));

  //console.log(xa.toString());
  //console.log(ya.toString());
  //console.log(za.toString());

  // next construct rotation matrix
  var RE1 = x3dom.fields.SFMatrix4f.identity();
  RE1.setValue(xa,ya,za);

  console.log(RE1.toString());

  var translation = new x3dom.fields.SFVec3f(0,0,0);
  var scaleFactor = new x3dom.fields.SFVec3f(1,1,1);
  var rotation = new x3dom.fields.Quaternion(0,0,1,0);
  var scaleOrientation = new x3dom.fields.Quaternion(0,0,1,0);
  RE1.getTransform(translation, rotation, scaleFactor, scaleOrientation);

  var q = rotation.toAxisAngle();
  var q_str = q[0].toString()+" "+q[1];

  x3dom_draw_ellipsoid("e1b","green",e2_c,q_str,e1_scale);

  // now let's get to covariance matrix
  var JE1 = x3dom_ellipsoid_inertia_tensor(1,e1_abc[0],e1_abc[1],e1_abc[2]);
  var RE1i = RE1.inverse();
  var RE1iJE1 = RE1i.mult(JE1);

  var C = RE1iJE1.mult(RE1iJE1.transpose());

  Cn = matrix_x3dom_to_numeric(C);
  Bn = numeric.eig(Cn);

  console.log(Bn);

  var m = 1/5;

  var jxx = Math.sqrt(Bn.lambda.x[0]);
  var jyy = Math.sqrt(Bn.lambda.x[1]);
  var jzz = Math.sqrt(Bn.lambda.x[2]);

  var ee_a = Math.sqrt(1/2/m*(jyy+jzz-jxx));
  var ee_b = Math.sqrt(1/2/m*(jxx+jzz-jyy));
  var ee_c = Math.sqrt(1/2/m*(jxx+jyy-jzz));

  console.log("e1 restored scale: "+[ee_a,ee_b,ee_c].join(" "));

  var RE1n = new x3dom.fields.SFMatrix4f(
               Bn.E.x[0][0], Bn.E.x[1][0], Bn.E.x[2][0], 0,
               Bn.E.x[0][1], Bn.E.x[1][1], Bn.E.x[2][1], 0,
               Bn.E.x[0][2], Bn.E.x[1][2], Bn.E.x[2][2], 0,
                          0,             0,           0, 1
             );

  console.log(RE1n.toString());

  return 0;

  //$(".my-markers").find("material").attr("transparency","0.5");

  //$("#deltalink").remove();

  var coords = [
    "0 0 0",
    p_w.x+" "+p_w.y+" "+p_w.z,
    marker.x+" "+marker.y+" "+marker.z,
    "0 0 0",
  ].join(" ");

  var html = [
    '<group id="deltalink" class="deltalink">',
    '  <switch whichChoice="0">',
    '    <transform>',
    '      <shape>',
    '        <appearance>',
    '          <material emissiveColor="white" transparency="0.0"></material>',
    '        </appearance>',
    '        <lineset vertexCount="4" solid="true" ccw="true" lit="true">',
    '          <coordinate point="'+coords+'"></coordinate>',
    '        </lineset>',
    '      </shape>',
    '    </transform>',
    '  </switch>',
    '</group>'
  ].join('\n');

  var sphere_element = $(html);
  $('scene',Scene.element).append(sphere_element);

  //var d = x3dom_3d_distance(p_w.x,p_w.y,p_w.z,false);
  var d = x3dom_3d_distance(marker.x,marker.y,marker.z,false);
  //console.log("Distance to pointe is "+d);

  // z-axis
  var mark_dir  = new x3dom.fields.SFVec3f(marker.x,marker.y,marker.z);
  mark_dir = mark_dir.normalize();

  var world_y = new x3dom.fields.SFVec3f(0,1,0);

  var mark_x = mark_dir.cross(world_y);
  var mark_y = mark_x.cross(mark_dir);
  var mark_z = mark_dir.negate();

  var M = x3dom.fields.SFMatrix4f.lookAt(new x3dom.fields.SFVec3f(0,0,0), mark_dir, mark_y);

  var translation = new x3dom.fields.SFVec3f(0,0,0);
  var scaleFactor = new x3dom.fields.SFVec3f(1,1,1);
  var rotation = new x3dom.fields.Quaternion(0,0,1,0);
  var scaleOrientation = new x3dom.fields.Quaternion(0,0,1,0);
  M.getTransform(translation, rotation, scaleFactor, scaleOrientation);

  console.log("Rotation matrix");
  console.log(M.toString());

  // draw vectors?!

  var aa = rotation.toAxisAngle();
  var aa_string = aa[0].toString()+" "+aa[1];

  //
  // now draw the 1st ellipse
  //
  mark_dir  = new x3dom.fields.SFVec3f(marker.x,marker.y,marker.z);
  var k = 20;
  var e1_abc = [k*0.00038*d,k*0.00038*d,2*k*d*d/10000];
  var model_scale = e1_abc.join(",");

  // at marker
  //x3dom_draw_ellipsoid("e2a","gold",mark_dir.toString(),aa_string,model_scale);
  // overlayed
  //x3dom_draw_ellipsoid("e1b","green",transl,aa_string,model_scale);

  // now Covariance

  // E1 (model, tilted):
  var J1 = x3dom_ellipsoid_inertia_tensor(1,e1_abc[0],e1_abc[1],e1_abc[2]);
  var R1 = M;
  var R1i = R1.inverse();
  var R1iJ1 = R1i.mult(J1);

  // E2 (map, vertical):
  var J2 = x3dom_ellipsoid_inertia_tensor(1,e2_abc[0],e2_abc[1],e2_abc[2]);
  var R2 = new x3dom.fields.SFMatrix4f(
              1, 0, 0, 0,
              0, 1, 0, 0,
              0, 0, 1, 0,
              0, 0, 0, 1
           );
  var R2i = R2.inverse();
  var R2iJ2 = R2i.mult(J2);

  var   C = R1iJ1.mult(R1iJ1.transpose());
  //var   C = R2iJ2.mult(R2iJ2.transpose());
  //C = C.add(R2iJ2.mult(R2iJ2.transpose()));

  Cnum = matrix_x3dom_to_numeric(C);
  Bnum = numeric.eig(Cnum);

  var point = new x3dom.fields.SFVec3f(p_w.x,p_w.y,p_w.z);

  var RNEW = new x3dom.fields.SFMatrix4f(
              Bnum.E.x[0][0], Bnum.E.x[1][0], Bnum.E.x[2][0], 0,
              Bnum.E.x[0][1], Bnum.E.x[1][1], Bnum.E.x[2][1], 0,
              Bnum.E.x[0][2], Bnum.E.x[1][2], Bnum.E.x[2][2], 0,
                           0,              0,              0, 1
           );

  console.log("R new");
  console.log(Rnew.toString());

  var xnew = new x3dom.fields.SFVec3f(Bnum.E.x[0][0],Bnum.E.x[1][0],Bnum.E.x[2][0]);
  var ynew = new x3dom.fields.SFVec3f(Bnum.E.x[0][1],Bnum.E.x[1][1],Bnum.E.x[2][1]);
  var znew = new x3dom.fields.SFVec3f(Bnum.E.x[0][2],Bnum.E.x[1][2],Bnum.E.x[2][2]);

  var m = 1/5;

  var jxx = Math.sqrt(Bnum.lambda.x[0]);
  var jyy = Math.sqrt(Bnum.lambda.x[1]);
  var jzz = Math.sqrt(Bnum.lambda.x[2]);

  var ee_a = Math.sqrt(1/2/m*(jyy+jzz-jxx));
  var ee_b = Math.sqrt(1/2/m*(jxx+jzz-jyy));
  var ee_c = Math.sqrt(1/2/m*(jxx+jyy-jzz));

  //x3dom_draw_line("yaxis","green",point, point.add(ynew.multiply(ee_b)));

  x3dom_draw_line("xaxis","red",  point, point.add(xnew.multiply(ee_a)));
  x3dom_draw_line("yaxis","green",point, point.add(ynew.multiply(ee_b)));
  x3dom_draw_line("zaxis","blue", point, point.add(znew.multiply(ee_c)));

  console.log("Covariance matrix");
  console.log(C.toString());

  // now what if I get transform from this?
  var translation = new x3dom.fields.SFVec3f(0,0,0);
  var scaleFactor = new x3dom.fields.SFVec3f(1,1,1);
  var rotation = new x3dom.fields.Quaternion(0,0,1,0);
  var scaleOrientation = new x3dom.fields.Quaternion(0,0,1,0);
  C.getTransform(translation, rotation, scaleFactor, scaleOrientation);

  console.log("Covariance decomposition");
  console.log(translation.toString());
  console.log(rotation.toString());
  console.log(scaleFactor.toString());
  console.log(scaleOrientation.toString());


}

function x3dom_draw_ellipsoid(id,color,transl,rotat,scale){

  $("#"+id).remove();

  var html = [
    '<group id="'+id+'">',
    '  <switch whichChoice="0">',
    '    <transform translation="'+transl+'" >',
    '      <transform rotation="'+rotat+'" >',
    '        <transform scale="'+scale+'" >',
    '          <shape>',
    '            <appearance>',
    '               <material diffuseColor="'+color+'" transparency="0.5"></material>',
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

// also from 4x4 to 3x3
function matrix_x3dom_to_numeric(m){

  return [
    [m._00, m._01, m._02],
    [m._10, m._11, m._12],
    [m._20, m._21, m._22]
  ];

}


















