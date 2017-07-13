
function align_init(){

    $("#align_button").on("click",function(){
        //align_heading();
        x3dom_align_0();
    });

    /*
    $("#align_0").on("click",function(){
        x3dom_align_0();
    });
    */

}

function test_markers_set1(){

  Data.camera.kml.latitude  = 40.7233861;
  Data.camera.kml.longitude = -111.9328843;
  Data.camera.kml.heading   = 62;

  Data.markers = [
    {align:{  latitude: 40.72362633635111, longitude: -111.93257600069047, x:-9.079290749776595, y:-14.27794573338788,  z: -32.46383785654424  }},
    {align:{  latitude: 40.7234408473505,  longitude: -111.93217568099502, x:23.90413018819188,  y:-16.192438967265613, z: -53.91987886096472  }},
    {align:{  latitude: 40.7239048229759,  longitude: -111.93186186254026, x:-8.800276069589225, y:-17.382935178801347, z:-100.34033327103612  }}
  ];

}

function x3dom_align_0(){

  //get all points
  //console.log("Base");
  //console.log(Data.camera);
  //console.log("Markers");
  //console.log(Data.markers);

  //test_markers_set1();

  //var base = Data.camera;
  // base.x
  // base.y
  // base.z
  // base.latitude
  // base.longitude

  //initial?
  var x0 = Data.camera.kml.latitude;
  var y0 = Data.camera.kml.longitude;
  var h0 = Data.camera.kml.heading;

  //tests
  //test_AxB();
  //test_At();
  //test_AxV();
  //test_Ainv();

  //return -1;

  /*
  console.log("Initial approximation: "+x0+" "+y0+" "+h0);

  for(var i=0;i<Data.markers.length;i++){

    console.log("Marker "+i+": "+Data.markers[i].align.latitude+" "+Data.markers[i].align.longitude+" "+Data.markers[i].align.x+" "+Data.markers[i].align.y+" "+Data.markers[i].align.z);
    //console.log(f1_3d_i(i,x0,y0,h0)+" - "+f2_map_i(i,x0,y0,h0)+" = "+r_i(i,x0,y0,h0)+" also, final bearing: "+f2_map_i_inverse(i,x0,y0,h0));
    //console.log(f1_3d_i(i,x0,y0,h0)+" - "+f2_map_i(i,x0,y0,h0)+" = "+r_i(i,x0,y0,h0));

  }
  */
  /*
  for(var i=0;i<Data.markers.length;i++){

    //console.log(Data.markers[i].align.latitude+" "+Data.markers[i].align.longitude+" "+Data.markers[i].align.x+" "+Data.markers[i].align.y+" "+Data.markers[i].align.z);
    //console.log(f1_3d_i(i,x0,y0,h0)+" - "+f2_map_i(i,x0,y0,h0)+" = "+r_i(i,x0,y0,h0)+" also, final bearing: "+f2_map_i_inverse(i,x0,y0,h0));
    console.log(f1_3d_i(i,x0,y0,h0)+" - "+f2_map_i(i,x0,y0,h0)+" = "+r_i(i,x0,y0,h0));

  }


  console.log("Begin");
  */
  var ε = 0.0000000001;

  var iterate = true;
  var counter = 0;
  var result = 0;
  var xyh = [x0,y0,h0];

  //console.log("Iteration 0, initial: "+xyh[0]+" "+xyh[1]+" "+xyh[2]);
  //console.log("Error function value: "+sigma(xyh[0],xyh[1],xyh[2]));

  while(iterate){

    counter++;

    //console.log("Interation: "+counter+" for "+xyh[0]+" "+xyh[1]+" "+xyh[2]);
    xyh_new = GaussNewtonAlgorithm(xyh[0],xyh[1],xyh[2]);

    //console.log(xyh_new);

    var s0 = sigma(xyh[0],xyh[1],xyh[2]);
    var s1 = sigma(xyh_new[0],xyh_new[1],xyh_new[2]);

    //if ((s1>s0)||((s0-s1)<ε)){
    if (Math.abs(s0-s1)<ε){
      iterate = false;
    }

    //console.log("Errors: "+(xyh_new[0]-xyh[0])+" "+(xyh_new[1]-xyh[1])+" "+(xyh_new[2]-xyh[2]));
    //console.log("Iteration "+counter+" result: "+xyh_new[0]+" "+xyh_new[1]+" "+xyh_new[2]);

    //console.log("Error function value: "+sigma(xyh_new[0],xyh_new[1],xyh_new[2]));

    if (counter==150){
      iterate = false;
    }

    xyh[0] = xyh_new[0];
    xyh[1] = xyh_new[1];
    xyh[2] = xyh_new[2];

  }

}

function sigma(x,y,h){

  var sum = 0

  for(var i=0;i<Data.markers.length;i++){

    sum += r_i(i,x,y,h)*r_i(i,x,y,h);

  }

  sum = Math.sqrt(sum/Data.markers.length);

  return sum;

}

function GaussNewtonAlgorithm(x,y,h){

  var J = Jacobian(x,y,h);
  var Jt = At(J);

  //console.log(J);
  //console.log(Jt);

  var JtJ = AxB(Jt,J);

  //console.log(JtJ);

  //console.log("Determinant: "+Adet(JtJ));

  var JtJi = Ainv(JtJ);

  //console.log(AxB(JtJ,JtJi));

  var JtJixJt = AxB(JtJi,Jt);

//   console.log(J);
//   console.log(JtJ);
//   console.log(JtJi);
//   console.log("testing JtJ x JtJ_inv");
//   console.log(AxB(JtJi,JtJ));
//   console.log(AxB(JtJ,JtJi));
//   console.log(Jt);
//   console.log(JtJixJt);
  //console.log("JtJixJt");
  //console.log(JtJixJt);

  var Vr = [];
  for(var i=0;i<Data.markers.length;i++){
    Vr[i] = r_i(i,x,y,h);
  }

  //console.log("Vr");
  //console.log(Vr);
  //console.log("Vr");
  //console.log(Vr);

  var d = AxV(JtJixJt,Vr);

  //console.log("JtJixJt x Vr");
  //console.log(d);

  //var k = 1/10;
  var k = 1;

  return [x-k*d[0], y-k*d[1], h-k*d[2]];

}

function f1_3d_i(i,x,y,h){
  var base = Data.camera;
  var mark = Data.markers[i];
  var v = new x3dom.fields.SFVec3f(mark.align.x-base.x,0,mark.align.z-base.z);
  var res = Math.atan2(v.x,-v.z)*180/Math.PI + h;
  return res;
}

function f2_map_i(i,x,y,h){

  var mark = Data.markers[i];
  var p1_ll = new L.LatLng(x,y);
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

function f2_map_i_inverse(i,x,y,h){

  var mark = Data.markers[i];
  var p1_ll = new L.LatLng(mark.align.latitude,mark.align.longitude);
  var p2_ll = new L.LatLng(x,y);

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

function r_i(i,x,y,h){
  return (f1_3d_i(i,x,y,h)-f2_map_i(i,x,y,h));
}

function dr_dh_i(i,x,y,h){
  return 1;
}

function dr_dx_i(i,x,y,h){

  var mark = Data.markers[i];
  var p1_ll = new L.LatLng(x,y);
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

function dr_dy_i(i,x,y,h){

  var mark = Data.markers[i];
  var p1_ll = new L.LatLng(x,y);
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

function Jacobian(x,y,h){

  var J = [];

  var base = Data.camera;

  for(var i=0;i<Data.markers.length;i++){

    var mark = Data.markers[i];
    J[i]=[ dr_dx_i(i,x,y,h), dr_dy_i(i,x,y,h), dr_dh_i(i,x,y,h)];
    /*
    e0 = 0.000000001;
    e1 = 0.000000001;
    e2 = 0.00001;

    dri_dx_cal = dr_dx_i(i,x,y,h);
    dri_dy_cal = dr_dy_i(i,x,y,h);
    dri_dh_cal = dr_dh_i(i,x,y,h);

    dri_dx_num = (r_i(i,x+e0,y   ,h   )-r_i(i,x-e0,y   ,h   ))/e0/2;
    dri_dy_num = (r_i(i,x   ,y+e1,h   )-r_i(i,x   ,y-e1,h   ))/e1/2;
    dri_dh_num = (r_i(i,x   ,y   ,h+e2)-r_i(i,x   ,y   ,h-e2))/e2/2;

    console.log("CAL: "+dri_dx_cal.toFixed(10)+"  "+dri_dy_cal.toFixed(10)+" "+dri_dh_cal.toFixed(4));
    console.log("NUM: "+dri_dx_num.toFixed(10)+"  "+dri_dy_num.toFixed(10)+" "+dri_dh_num.toFixed(4));
    */
  }

  return J;
}

/*
           1 1 1
1 1 1 1 1  1 1 1
1 1 1 1 1  1 1 1
1 1 1 1 1  1 1 1
           1 1 1
*/

//tested
function AxB(A,B){

  //A.length == B[0].length
  //A[0].length == B.length

  var m1 = A.length;
  var n1 = A[0].length;

  var m2 = B.length;
  var n2 = B[0].length;

  if(n1!=m2){
    console.log("M=AxB: cannot multiply matrices A_"+m1+"_"+n1+" x B_"+m2+"_"+n2);
    return [];
  }

  var R = [];

  for(var i=0;i<m1;i++){
    R[i] = [];
    for(var j=0;j<n2;j++){
      R[i][j] = 0;
      for(var k=0;k<n1;k++){
          R[i][j] += A[i][k]*B[k][j];
      }
    }
  }

  return R;

}

//tested
function Adet(A){

  var m = A.length;
  var n = A[0].length;

  if ((m!=3)||(n!=3)){
    console.log("Matrix inverting works only for 3x3 dimension");
  }

  var M = new x3dom.fields.SFMatrix4f(
        A[0][0],A[0][1],A[0][2],0,
        A[1][0],A[1][1],A[1][2],0,
        A[2][0],A[2][1],A[2][2],0,
        0,0,0,1
    );

  return M.det();

}

//tested
function Ainv(A){

  var m = A.length;
  var n = A[0].length;

  if ((m!=3)||(n!=3)){
    console.log("Matrix inverting works only for 3x3 dimension");
  }

  var M = new x3dom.fields.SFMatrix4f(
        A[0][0],A[0][1],A[0][2],0,
        A[1][0],A[1][1],A[1][2],0,
        A[2][0],A[2][1],A[2][2],0,
        0,0,0,1
    );
  var R = M.inverse();

  return [
    [R._00,R._01,R._02],
    [R._10,R._11,R._12],
    [R._20,R._21,R._22]
  ];
}

//tested
function At(A){
  var R = [];

  for(var i=0;i<A[0].length;i++){
    R[i] = [];
    for(var j=0;j<A.length;j++){
      R[i][j] = A[j][i];
    }
  }

  return R;
}

//tested
function AxV(A,V){

  var Vr = [];

  var m1 = A.length;
  var n1 = A[0].length;

  var m2 = V.length;
  var n2 = 1;

  if (n1!=m2){
    console.log("Matrix or vector dimension errors, too bad");
    return [];
  }

  for(var i=0;i<m1;i++){
    Vr[i] = 0;
    for(var j=0;j<m2;j++){
        Vr[i] += A[i][j]*V[j];
    }
  }

  return Vr;
}

function align_heading(){

    // find selected markers
    // pick the first one?
    // align?!
    console.log("heading");

    var map_markers = Map.marker._measureMarkers;
    var selected_markers = [];

    map_markers.forEach(function(c,i){
        if (selected_markers.length<2){
            if (c._selected){
                selected_markers.push(c);
            }
        }
    });

    if (selected_markers.length<2){
        console.log("select 2 markers");
        Scene.showMessage("messagewindow","error: select 2 markers","red");
    }



    console.log(selected_markers);

}

function align_roll(){

    console.log("roll");

}

function align_tilt(){

    console.log("tilt");

}

function test_Ainv(){

  var A = [
    [0,0,1],
    [1,0,0],
    [0,1,0]
  ];

  console.log(A);

  console.log(Ainv(A));

}

function test_AxV(){

  var A = [
    [1,2,3,4],
    [5,6,7,8],
    [9,10,11,12]
  ];

  var V1 = [
    13,
    14,
    15,
    16
  ];

  var V2 = [
    13,
    14,
    15
  ];

  console.log(AxV(A,V1));
  console.log(AxV(A,V2));

}

function test_At(){

  console.log("testing At: begin");

  var A = [
    [1,2,3,4],
    [5,6,7,8],
    [9,10,11,12]
  ];

  console.log(A);
  console.log(At(A));

  console.log("testing At: end");
}

function test_AxB(){

  console.log("testing AxB: begin");

  var A = [
    [1,2,3,4],
    [5,6,7,8],
    [9,10,11,12]
  ];

  var B = [
    [13,14,15],
    [16,17,18],
    [19,20,21],
    [22,23,24],
  ];

  var C = [
    [2,2],
    [1,1]
  ];

  //test1: 3x4 x 4x3 = 3x3
  console.log(AxB(A,B));
  //test2: fail test case
  console.log(AxB(A,C));

  console.log("testing AxB: end");
}

