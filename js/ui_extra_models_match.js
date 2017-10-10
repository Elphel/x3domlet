function x3dom_align_models(){

  // do models have to loaded?

  var marks = Data.mpr.markers;

  for(var i=0;i<marks.length;i++){

    console.log("Marks pair # "+i);

    var mark = marks[i];

    var inline1 = $('inline[name=x3d_'+mark.m1.name+']');
    var inline2 = $('inline[name=x3d_'+mark.m2.name+']');

    if((inline1.length!=0)&&(inline2.length!=0)){

      var p1_1 = mark.m1.position;
      var p2_2 = mark.m2.position;

      var c1 = mark.m1.camera;
      var c2 = mark.m2.camera;

      var m1 = x3dom_getTransorm_from_2_parents(inline1);
      var m2 = x3dom_getTransorm_from_2_parents(inline2);

      // from inline2 to inline1
      var m = m1.inverse().mult(m2);
      // p2 in inline1's coordinates
      var p2_1 = m.multMatrixVec(p2_2);

      var v1 = p1_1.subtract(c1);
      var v2 = p2_1.subtract(c1);
      var vcro = v1.cross(v2);
      var vsca = v1.dot(v2);
      console.log("  before scaling:"+vcro.toString());
      console.log("  scalar product:"+vsca);
      vcro = vcro.multiply(1/vsca);
      console.log("  after  scaling:"+vcro.toString());
      console.log("          length:"+vcro.length());

//       // from inline1 to inline2
//       m = m.inverse();
//       // p1 in inline2's coordinates
//       var p1_2 = m.multMatrixVec(p1_1);
//
//       var v1 = p1_2.subtract(c2);
//       var v2 = p2_2.subtract(c2);
//       var vcro = v1.cross(v2);
//       var vsca = v1.dot(v2);
//       console.log("  before scaling:"+vcro.toString());
//       console.log("  scalar product:"+vsca);
//       vcro = vcro.multiply(1/vsca);
//       console.log("  after  scaling:"+vcro.toString());
//       console.log("          length:"+vcro.length());

    }

  }

}

function mpr_R(d){

  var sin = Math.sin;
  var cos = Math.cos;

  var _00 = sin(d.psi)*sin(d.theta)*sin(d.phi)+cos(d.psi)*cos(d.phi);
  var _01 = -sin(d.psi)*sin(d.theta)*cos(d.phi)+cos(d.psi)*sin(d.phi);
  var _02 = -sin(d.psi)*cos(d.theta);
  var _03 = -d.x;

  var _10 = -cos(d.theta)*sin(d.phi);
  var _11 = cos(d.theta)*cos(d.phi);
  var _12 = -sin(d.theta);
  var _13 = -d.y;

  var _20 = -cos(d.psi)*sin(d.theta)*sin(d.phi)+sin(d.psi)*cos(d.phi);
  var _21 = cos(d.psi)*sin(d.theta)*cos(d.phi)+sin(d.psi)*sin(d.phi);
  var _22 = cos(d.psi)*cos(d.theta);
  var _23 = -d.z;

  var _30 = 0;
  var _31 = 0;
  var _32 = 0;
  var _33 = 1;

  var m = new x3dom.fields.SFMatrix4f(
    _00, _01, _02, _03,
    _10, _11, _12, _13,
    _20, _21, _22, _23,
    _30, _31, _32, _33
  );

  return m;

}

function mpr_dR_dpsi(d){

  var sin = Math.sin;
  var cos = Math.cos;

  var _00 = cos(d.psi)*sin(d.theta)*sin(d.phi)-sin(d.psi)*cos(d.phi);
  var _01 = -cos(d.psi)*sin(d.theta)*cos(d.phi)-sin(d.psi)*sin(d.phi);
  var _02 = -cos(d.psi)*cos(d.theta);
  var _03 = 0;

  var _10 = 0;
  var _11 = 0;
  var _12 = 0;
  var _13 = 0;

  var _20 = sin(d.psi)*sin(d.theta)*sin(d.phi)+cos(d.psi)*cos(d.phi);
  var _21 = -sin(d.psi)*sin(d.theta)*cos(d.phi)+cos(d.psi)*sin(d.phi);
  var _22 = -sin(d.psi)*cos(d.theta);
  var _23 = 0;

  var _30 = 0;
  var _31 = 0;
  var _32 = 0;
  var _33 = 0;

  var m = new x3dom.fields.SFMatrix4f(
    _00, _01, _02, _03,
    _10, _11, _12, _13,
    _20, _21, _22, _23,
    _30, _31, _32, _33
  );

  return m;

}

function mpr_dR_dtheta(d){

  var sin = Math.sin;
  var cos = Math.cos;

  var _00 = sin(d.psi)*cos(d.theta)*sin(d.phi);
  var _01 = -sin(d.psi)*cos(d.theta)*cos(d.phi);
  var _02 = sin(d.psi)*sin(d.theta);
  var _03 = 0;

  var _10 = sin(d.theta)*sin(d.phi);
  var _11 = -sin(d.theta)*cos(d.phi);
  var _12 = -cos(d.theta);
  var _13 = 0;

  var _20 = -cos(d.psi)*cos(d.theta)*sin(d.phi);
  var _21 = cos(d.psi)*cos(d.theta)*cos(d.phi);
  var _22 = -cos(d.psi)*sin(d.theta);
  var _23 = 0;

  var _30 = 0;
  var _31 = 0;
  var _32 = 0;
  var _33 = 0;

  var m = new x3dom.fields.SFMatrix4f(
    _00, _01, _02, _03,
    _10, _11, _12, _13,
    _20, _21, _22, _23,
    _30, _31, _32, _33
  );

  return m;

}

function mpr_dR_dphi(d){

  var sin = Math.sin;
  var cos = Math.cos;

  var _00 = sin(d.psi)*sin(d.theta)*cos(d.phi)-cos(d.psi)*sin(d.phi);
  var _01 = sin(d.psi)*sin(d.theta)*sin(d.phi)+cos(d.psi)*cos(d.phi);
  var _02 = 0;
  var _03 = 0;

  var _10 = -cos(d.theta)*cos(d.phi);
  var _11 = -cos(d.theta)*sin(d.phi);
  var _12 = 0;
  var _13 = 0;

  var _20 = -cos(d.psi)*sin(d.theta)*cos(d.phi)-sin(d.psi)*sin(d.phi);
  var _21 = -cos(d.psi)*sin(d.theta)*sin(d.phi)+sin(d.psi)*cos(d.phi);
  var _22 = 0;
  var _23 = 0;

  var _30 = 0;
  var _31 = 0;
  var _32 = 0;
  var _33 = 0;

  var m = new x3dom.fields.SFMatrix4f(
    _00, _01, _02, _03,
    _10, _11, _12, _13,
    _20, _21, _22, _23,
    _30, _31, _32, _33
  );

  return m;

}
