
var theLastMovedMarker = null;

function x3dom_delta_markers(){

  // what's the last dragged marker? (over map?)
  // see leaflet_init.js
  var index = theLastMovedMarker;

  var marker = Data.markers[index];
  console.log(marker);

  var Camera = Map.marker;

  var marker_i = {
      map: { lat: marker.latitude, lng: marker.longitude, alt: marker.altitude},
      model: {x: marker.x, y: marker.y, z: marker.z}
    };

  var parameters = {
      lat:     Data.camera.kml.latitude,
      lng:     Data.camera.kml.longitude,
      alt:     Data.camera.kml.altitude,
      heading: Data.camera.kml.heading,
      tilt:    Data.camera.kml.tilt,
      roll:    Data.camera.kml.roll
    };

  var Error_vector = get_E(marker_i,parameters);

  /*
  var h = 12;
  var t = 30;
  var r = 71;
  // RtR' testing
  var m1 = Rz(h);
  var m2 = Ry(t);
  var m3 = Rx(r);
  var MX1 = m1.mult(m2).mult(m3);
  var dm3 = dRx(r);
  var MX2 = m1.mult(m2).mult(dm3);
  var RES = MX1.transpose().mult(MX2);
  console.log("ROTATION DERIVATIVE: "+RES.toString());
  */

  var dx = 1;

  var nd = nd_E_heading(marker_i,parameters,100*Number.EPSILON);
  console.log("Numerical dE/dh (vector) = "+nd.toString());

  var ad = ad_E_heading(marker_i,parameters);
  console.log("Analytical dE/dh (vector) = "+ad.toString());

  var C = get_C(marker_i,parameters);
  var Ci = C.inverse();

  var A = get_A(marker_i,parameters);

  var AtA = A.transpose().mult(A);

  /*
  console.log("Test: C^-1 = AtA ?");
  console.log("Ci: "+Ci.toString());
  console.log("AtA: "+AtA.toString());
  */

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

function get_E(mark,pars){

  var v = get_v(mark,pars);
  var A = get_A(mark,pars);
  var Av = A.multMatrixVec(v);

  return Av;

}

// ad_ == analytical derivative
function ad_E_heading(mark,pars){

  var A  = get_A(mark,pars);
  var dA = get_dA(mark,pars,dHTR_dheading);
  var v  = get_v(mark,pars);
  var dv = get_dv(mark,pars,dHTR_dheading);

  console.log("AD2:");
  console.log("dA2: "+dA.toString());
  console.log("dv2: "+dv.toString());

  var part1 = A.multMatrixVec(dv);
  var part2 = dA.multMatrixVec(v);

  var result = part1.add(part2);

  return result;

}




// nd_ == numerical derivative
function nd_E_heading(mark,pars,dx=0.001){

  // in degrees
  //var dx = 0.01;

  var p1 = JSON.parse(JSON.stringify(pars));
  var p2 = JSON.parse(JSON.stringify(pars));

  p2.heading += dx;

  //console.log(p1);
  //console.log(p2);

  var y1 = get_E(mark,p1);
  var y2 = get_E(mark,p2);

  var dy = y2.subtract(y1).divide(dx);

  return dy;

}

// J1
function get_JE1(mark,pars){

  var e1_world = get_e1_w(mark,pars);

  var e1_d = x3dom_3d_distance(e1_world.x,e1_world.y,e1_world.z,false);
  // multiplier for debugging
  var e1_k = 40;
  // less precise
  //var e1_abc = [e1_k*0.00038*e1_d, e1_k*0.00038*e1_d, e1_k*e1_d*e1_d/10000];
  // more precise
  var e1_abc = [e1_k*0.00038*e1_d, e1_k*0.00038*e1_d, e1_k*e1_d*e1_d/25000];
  var JE1 = x3dom_ellipsoid_inertia_tensor_v2(1,e1_abc[0],e1_abc[1],e1_abc[2]);

  return JE1;

}

// R1
function get_RE1(mark,pars){

  var e1_world = get_e1_w(mark,pars);

  // build a right basis
  var e1_dir = e1_world.normalize();
  var xa1 = e1_dir.cross(new x3dom.fields.SFVec3f(0,1,0));
  var ya1 = xa1.cross(e1_dir);
  //var za1 = e1_dir.negate();
  var za1 = e1_dir;

  // e1 ref system
  var RE1 = x3dom.fields.SFMatrix4f.identity();
  RE1.setValue(xa1,ya1,za1);

  return RE1;

}

// J2
function get_JE2(mark,pars){

  // e2 depens on the map
  // multiplier for debugging
  var e2_k = 1;
  var e2_abc = [e2_k*1,e2_k*1,e2_k*30];

  var JE2 = x3dom_ellipsoid_inertia_tensor_v2(1,e2_abc[0],e2_abc[1],e2_abc[2]);

  return JE2;

}

// R2
function get_RE2(mark,pars){

  var RE2 = x3dom.fields.SFMatrix4f.identity();
  return RE2;

}

function get_C(mark,pars){

  var JE1 = get_JE1(mark,pars);
  var RE1 = get_RE1(mark,pars);

  var JE2 = get_JE2(mark,pars);
  var RE2 = get_RE2(mark,pars);

  // debugging
  /*
  var e2_world = get_e2_w(mark,pars);
  var M2W = get_e1_M2W(mark,pars);
  var W2M = M2W.inverse();

  x3dom_draw_ellipsoid_by_semiaxes_and_center("e1","orange",{
    O:  W2M.multMatrixVec(e2_world),
    Ox: W2M.multMatrixVec(RE1.e0().multiply(JE1._00)),
    Oy: W2M.multMatrixVec(RE1.e1().multiply(JE1._11)),
    Oz: W2M.multMatrixVec(RE1.e2().multiply(JE1._22))
  },transparency=0.3);

  x3dom_draw_ellipsoid_by_semiaxes_and_center("e2","orange",{
    O:  W2M.multMatrixVec(e2_world),
    Ox: W2M.multMatrixVec(RE2.e0().multiply(JE2._00)),
    Oy: W2M.multMatrixVec(RE2.e1().multiply(JE2._11)),
    Oz: W2M.multMatrixVec(RE2.e2().multiply(JE2._22))
  },transparency=0.3);
  */

  // now let's get to covariance matrix
  var RE1xJE1 = RE1.mult(JE1);
  var RE2xJE2 = RE2.mult(JE2);

  var C1 = RE1xJE1.mult(RE1xJE1.transpose());
  var C2 = RE2xJE2.mult(RE2xJE2.transpose());

  //console.log(C1);
  //console.log(C1.toString());

  //console.log(C2);
  //console.log(C2.toString());

  var C = C1.add(C2);
  //var C = C1.add(C1);
  //var C = C2.add(C2);

  return C;

}

// general - can do via callback
function get_dC(mark,pars,callback){

  var M1 = get_dC1(mark,pars,callback);
  var M2 = get_dC2(mark,pars,callback);

  var dC = M1.add(M2);

  return dC;

}

function get_A(mark,pars){

  var  C =  get_C(mark,pars);
  //var dC = get_dC(mark,pars);

  Cn = matrix_x3dom_to_numeric(C);
  Bn = numeric.eig(Cn);

  var a = Bn.lambda.x[0];
  var b = Bn.lambda.x[1];
  var c = Bn.lambda.x[2];

  var sa = Math.sqrt(a);
  var sb = Math.sqrt(b);
  var sc = Math.sqrt(c);

  var vec0 = new x3dom.fields.SFVec3f(Bn.E.x[0][0],Bn.E.x[0][1],Bn.E.x[0][2]);
  var vec1 = new x3dom.fields.SFVec3f(Bn.E.x[1][0],Bn.E.x[1][1],Bn.E.x[1][2]);
  var vec2 = new x3dom.fields.SFVec3f(Bn.E.x[2][0],Bn.E.x[2][1],Bn.E.x[2][2]);

  var R = new x3dom.fields.SFMatrix4f(
               vec0.x, vec1.x, vec2.x, 0,
               vec0.y, vec1.y, vec2.y, 0,
               vec0.z, vec1.z, vec2.z, 0,
                    0,      0,      0, 1
             );

  var J = new x3dom.fields.SFMatrix4f(
               sa,  0,  0, 0,
                0, sb,  0, 0,
                0,  0, sc, 0,
                0,  0,  0, 1
             );

  var Ji = J.inverse();

  var JiR = Ji.mult(R);

  var e2_world = get_e2_w(mark,pars);
  var M2W = get_e1_M2W(mark,pars);
  var W2M = M2W.inverse();

  /*
  x3dom_draw_ellipsoid_by_semiaxes_and_center("ec1","red",{
    O:  W2M.multMatrixVec(e2_world),
    Ox: W2M.multMatrixVec(R.transpose().e0().multiply(sa)),
    Oy: W2M.multMatrixVec(R.transpose().e1().multiply(sb)),
    Oz: W2M.multMatrixVec(R.transpose().e2().multiply(sc))
  },transparency=0.6);
  */

  /*
  console.log("Eigen test:");
  console.log("C = RAR^-1: "+C.toString());
  console.log("A: "+J.mult(J).toString());
  */

  // incorrect
  var T1 = R.mult(J).mult(J).mult(R.inverse());
  // That's how it got decomposed:
  var T2 = R.transpose().mult(J).mult(J).mult(R);
  //var T1 = R.mult(J).mult(J).mult(J).mult(J).mult(R.inverse());

  //console.log("C: "+C.toString());
  //console.log("T1: "+T1.toString());
  //console.log("T2: "+T2.toString());

  return JiR;

}

//E = Av
// callback is the needed derivative function

// This is for derivatives for eigenvalues and eigenvectors:
// https://people.maths.ox.ac.uk/gilesm/files/NA-08-01.pdf
function get_dA(mark,pars,callback){

  var  C =  get_C(mark,pars);
  var dC = get_dC(mark,pars,callback);

  //console.log("dC(get_dA): "+dC.toString());

  Cn = matrix_x3dom_to_numeric(C);
  Bn = numeric.eig(Cn);

  var a = Bn.lambda.x[0];
  var b = Bn.lambda.x[1];
  var c = Bn.lambda.x[2];

  var sa = Math.sqrt(a);
  var sb = Math.sqrt(b);
  var sc = Math.sqrt(c);

  var sa3 = Math.pow(sa,3);
  var sb3 = Math.pow(sb,3);
  var sc3 = Math.pow(sc,3);

  var vec0 = new x3dom.fields.SFVec3f(Bn.E.x[0][0],Bn.E.x[0][1],Bn.E.x[0][2]);
  var vec1 = new x3dom.fields.SFVec3f(Bn.E.x[1][0],Bn.E.x[1][1],Bn.E.x[1][2]);
  var vec2 = new x3dom.fields.SFVec3f(Bn.E.x[2][0],Bn.E.x[2][1],Bn.E.x[2][2]);

  var R = new x3dom.fields.SFMatrix4f(
               vec0.x, vec1.x, vec2.x, 0,
               vec0.y, vec1.y, vec2.y, 0,
               vec0.z, vec1.z, vec2.z, 0,
                    0,      0,      0, 1
             );

  var U = R.transpose();

  // testing - C is symmetric
  //console.log("BIG TEST0: "+C.toString());

  //console.log("BIG TEST1: "+R.mult(R.transpose()).toString());
  //console.log("BIG TEST2: "+R.transpose().mult(R).toString());

  var L = new x3dom.fields.SFMatrix4f(
                  a, 0, 0, 0,
                  0, b, 0, 0,
                  0, 0, c, 0,
                  0, 0, 0, 1
             );

  // test - Λ is diagonal
  // console.log("Λ = "+R.mult(C).mult(R.transpose()).toString());

  //var RtdCR = R.transpose().mult(dC).mult(R);
  var UtdCU = U.transpose().mult(dC).mult(U);
  //console.log("RdCRt = "+RtdCR.toString());

  // and we take only diag elements because we know
  var dL = new x3dom.fields.SFMatrix4f(
             UtdCU._00,         0,         0, 0,
                     0, UtdCU._11,         0, 0,
                     0,         0, UtdCU._22, 0,
                     0,         0,         0, 1
             );

  /*
  var da = vec0.dot(dC.multMatrixVec(vec0));
  var db = vec1.dot(dC.multMatrixVec(vec1));
  var dc = vec2.dot(dC.multMatrixVec(vec2));
  */

  var da = dL._00;
  var db = dL._11;
  var dc = dL._22;

  //console.log("dL = "+dL.toString());

  var Ji = new x3dom.fields.SFMatrix4f(
               1/sa,    0,    0, 0,
                  0, 1/sb,    0, 0,
                  0,    0, 1/sc, 0,
                  0,    0,    0, 1
             );

  var dJi = new x3dom.fields.SFMatrix4f(
               -0.5/sa3*da,          0,          0, 0,
                        0, -0.5/sb3*db,          0, 0,
                        0,          0, -0.5/sc3*dc, 0,
                        0,          0,           0, 1
             );

  // RtdCR
  var F = new x3dom.fields.SFMatrix4f(
                  0,  1/(b-a),  1/(c-a), 0,
            1/(a-b),        0,  1/(c-b), 0,
            1/(a-c),  1/(b-c),        0, 0,
                  0,        0,        0, 1
          );

  var FhUtdCU = Hadamard_product(F,UtdCU);
  //console.log("FhRtdCR: "+FhRtdCR.toString());

  var dU = U.mult(FhUtdCU);
  //console.log("dU "+dU.toString());

  var dR = dU.transpose();

  //var dR = dQ;

  //console.log("Ji:  "+Ji.toString());
  //console.log("dJi: "+dJi.toString());

  //console.log("R:  "+R.toString());
  //console.log("dR: "+dR.toString());

  // Q = JiR
  // dQ = dJi x R + Ji x dR
  var dA = dJi.mult(R).add(Ji.mult(dR));

  // ok
  return dA;

}

function Hadamard_product(A,B){

  return new x3dom.fields.SFMatrix4f(
           A._00*B._00,  A._01*B._01,  A._02*B._02,  0,
           A._10*B._10,  A._11*B._11,  A._12*B._12,  0,
           A._20*B._20,  A._21*B._21,  A._22*B._22,  0,
                     0,            0,            0,  1
  );

}

// don't need
function get_dvec(A,dA,lambda,dlambda,vec){

  //console.log("TESTING DVEC");

  var I = x3dom.fields.SFMatrix4f.identity();

  //var M1 = A.add(I.multiply(lambda).negate()).inverse();
  var M1 = A.add(I.multiply(lambda).negate());

  console.log("A-aI: "+M1.toString());
  console.log("det(A-aI): "+M1.det());

  //var M1i = M1.inverse();
  //console.log("(A-aI)^-1: "+M1i.toString());

  //console.log(M1.det());

  //console.log("M1i x M1: "+M1i.mult(M1).toString());

  //var M2 = I.multiply(dlambda).add(dA.negate());

  //console.log("M2: "+M2.toString());

  //var W = M1i.mult(M2);

  //var dvec = W.multMatrixVec(vec);

  //var dvec2 = vec.dot()

  dvec = vec;

  return dvec;

}

function get_dE(mark,pars){

  var A  = get_A(mark,pars);
  var dA = get_dA(mark,pars);

  var v  = get_v(mark,pars);
  var dv = get_dv(mark,pars);

  var p1 =  A.multMatrixVec(dv);
  var p2 = dA.multMatrixVec(v);

  var de = p1.add(p2);
  return de;

}

function get_v(mark,pars){

  var e1_world = get_e1_w(mark,pars);
  var e2_world = get_e2_w(mark,pars);
  // pointing from model mark to map mark
  var v = e1_world.subtract(e2_world);

  return v;
}

function get_dv(mark,pars,callback){

  //return new x3dom.fields.SFVec3f(0,0,0);
  var M = callback(mark,pars);
  var T = x3dom_toYawPitchRoll();

  var e1_model = new x3dom.fields.SFVec3f(mark.model.x,mark.model.y,mark.model.z);

  var dv = M.mult(T).multMatrixVec(e1_model);
  return dv;

}

// rads per degree
var RPD = Math.PI/180;

// C derivatives


// v derivatives

function dv_lat(mark,pars){

  // dv = de1 - de2, where de1==0
  // dv = -de2

  //var dlat = p2_ll.lat-p1_ll.lat;
  //var dlon = p2_ll.lng-p1_ll.lng;
  //var dy = Math.sin(dlon)*Math.cos(p2_ll.lat);
  //var dx = Math.cos(p1_ll.lat)*Math.sin(p2_ll.lat)-Math.sin(p1_ll.lat)*Math.cos(p2_ll.lat)*Math.cos(dlon);

  //
  var p0_ll = new L.LatLng(pars.lat, pars.lng);
  var p1_ll = new L.LatLng(mark.map.lat, mark.map.lng);

  //var Earth = 6371000;
  // take from leaflet
  var Earth = L.CRS.Earth.R;



}

function get_dRE1(mark,pars,callback){

  // a'
  var e1_model = new x3dom.fields.SFVec3f(mark.model.x,mark.model.y,mark.model.z);
  var e1_world = get_e1_w(mark,pars);
  var a = e1_world;

  var heading = pars.heading*RPD;
  var tilt    = (pars.tilt-90)*RPD;
  var roll    = pars.roll*RPD;

  var T = x3dom_toYawPitchRoll();

  /*
  var M = x3dom.fields.SFMatrix4f.zeroMatrix();
  M.add(dHTR(heading,tilt,roll));
  M.add(HdTR(heading,tilt,roll));
  M.add(HTdR(heading,tilt,roll));
  */

  var M = callback(mark,pars);

  var d_e1_world = M.mult(T).multMatrixVec(e1_model);

  var da = d_e1_world;

  var dR1 = new x3dom.fields.SFMatrix4f(
          -da.z,    -da.x*a.z-a.x*da.z, da.x, 0,
              0, 2*a.x*da.x+2*a.z*da.z, da.y, 0,
           da.x,    -da.y*a.z-a.y*da.z, da.z, 0,
              0,                     0,    0, 1
  );

  return dR1;

}

function dHTR_dheading(mark,pars){

  var heading = pars.heading*RPD;
  var tilt    = (pars.tilt-90)*RPD;
  var roll    = pars.roll*RPD;

  var M = dHTR(heading,tilt,roll).multiply(RPD);
  return M;

}

function get_dC1(mark,pars,callback){

  var RE1  = get_RE1(mark,pars);
  var dRE1 = get_dRE1(mark,pars,callback);
  var JE1  = get_JE1(mark,pars);

  var JE1xJE1t = JE1.mult(JE1.transpose());

  var P1 = dRE1.mult(JE1xJE1t).mult(RE1.transpose());
  var P2 = RE1.mult(JE1xJE1t).mult(dRE1.transpose());

  var RES = P1.add(P2);

  return RES;

}

function get_dC2(mark,pars,callback){

  var M = x3dom.fields.SFMatrix4f.zeroMatrix();
  return M;

}

// BASIC FUNCTIONS and DERIVATIVES

// model to world (for debugging mainly)
function get_e1_M2W(mark,pars){

  var heading = pars.heading*RPD;
  var tilt    = (pars.tilt-90)*RPD;
  var roll    = pars.roll*RPD;

  // Heading,Tilt,Roll
  var Mh = x3dom.fields.SFMatrix4f.rotationZ(heading);
  var Mt = x3dom.fields.SFMatrix4f.rotationY(tilt);
  var Mr = x3dom.fields.SFMatrix4f.rotationX(roll);

  // I'll need R'
  var R = Mh.mult(Mt).mult(Mr);
  // T is constant
  var T = x3dom_toYawPitchRoll();

  var M2W = R.mult(T);

  return M2W;
}

// get ellipse 1 in world coordinates
function get_e1_w(mark,pars){

  var M2W = get_e1_M2W(mark,pars);
  var W2M = M2W.inverse();

  var e1_model = new x3dom.fields.SFVec3f(mark.model.x,mark.model.y,mark.model.z);
  var e1_world = M2W.multMatrixVec(e1_model);

  return e1_world;
}

// get ellipse 2 in world coordinates
function get_e2_w(mark,pars){

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

  return e2_world;

}


function Av_df_dx(){

  console.log("Welcome to dAv/dx");

  //dE =

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

// for rotation matrices

function Rx(a){

    return new x3dom.fields.SFMatrix4f(
      1,           0,            0, 0,
      0, Math.cos(a), -Math.sin(a), 0,
      0, Math.sin(a),  Math.cos(a), 0,
      0,           0,            0, 1
    );

}

function Ry(a){

    return new x3dom.fields.SFMatrix4f(
       Math.cos(a),  0, Math.sin(a), 0,
                 0,  1,           0, 0,
      -Math.sin(a),  0, Math.cos(a), 0,
                 0,  0,           0, 1
    );

}

function Rz(a){

    return new x3dom.fields.SFMatrix4f(
          Math.cos(a), -Math.sin(a), 0, 0,
          Math.sin(a),  Math.cos(a), 0, 0,
                    0,            0, 1, 0,
                    0,            0, 0, 1
    );

}

function dRx(a){

    return new x3dom.fields.SFMatrix4f(
      1,           0,             0, 0,
      0, -Math.sin(a), -Math.cos(a), 0,
      0,  Math.cos(a), -Math.sin(a), 0,
      0,           0,             0, 1
    );

}

function dRy(a){

    return new x3dom.fields.SFMatrix4f(
      -Math.sin(a),  0,  Math.cos(a), 0,
                 0,  1,            0, 0,
      -Math.cos(a),  0, -Math.sin(a), 0,
                 0,  0,            0, 1
    );

}

function dRz(a){

    return new x3dom.fields.SFMatrix4f(
          -Math.sin(a), -Math.cos(a), 0, 0,
           Math.cos(a), -Math.sin(a), 0, 0,
                    0,             0, 1, 0,
                    0,             0, 0, 1
    );

}

function dHTR(h,t,r){

  var m1 = dRz(h);
  var m2 = Ry(t);
  var m3 = Rx(r);

  return m1.mult(m2).mult(m3);

}

function HdTR(h,t,r){

  var m1 = Rz(h);
  var m2 = dRy(t);
  var m3 = Rx(r);

  return m1.mult(m2).mult(m3);

}

function HTdR(h,t,r){

  var m1 = Rz(h);
  var m2 = Ry(t);
  var m3 = dRx(r);

  return m1.mult(m2).mult(m3);

}










