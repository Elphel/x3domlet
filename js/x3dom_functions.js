/*

  Copyright (C) 2017 Elphel Inc.

  License: GPLv3

  https://www.elphel.com

*/
/**
 * @file -
 * @brief -
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

function x3dom_getViewTranslation(elem){

    var m = elem.runtime.viewMatrix().inverse();
    var tr = m.e3();

    return tr;

}

/**
 * get position and orientation in the 3D scene defined by mouse's canvas x,y
 */
function x3dom_getXYPosOr(cnvx,cnvy,round){

    var elem = Scene.element;

    var x,y,z;
    var xc,yc,zc;

    var az,el,sk;
    var id;

    var dist_xyz = 1112;
    var dist_xz = 1113;

    var valid_distance;

    // camera coordinates, not correcting with zNear
    var campos = x3dom_getCameraPosOr();
    xc = campos.x;
    yc = campos.y;
    zc = campos.z;

    // shoot ray based on canvas coordinates
    // if hits a shape  > .pickPosition and .pickObject
    var shootRay = elem.runtime.shootRay(cnvx,cnvy);

    // check infinity shape
    if (shootRay.pickPosition != null){
      if ($(shootRay.pickObject).hasClass('INFINITY')){
        shootRay.pickPosition = null;
      }
    }

    if (shootRay.pickPosition != null){

        var index = Scene.highlighted_marker_index;

        // didn't hit a marker?
        if (index==null){
            // some marker being dragged but the mouse is not over it. If yes - update index
            if ((Scene.draggedTransformNode!=undefined)&&(Scene.draggedTransformNode!=null)){
                var sphere = Scene.draggedTransformNode.parent().parent();
                index = parseInt(sphere.attr("id").substr(7));
            }
        }

        // didn't hit marker
        if ((index==null)||(Data.markers[index]==undefined)){

            // needs zNear bug correction
            var xyz = zNear_bug_correction([shootRay.pickPosition.x,shootRay.pickPosition.y,shootRay.pickPosition.z]);
            x = xyz[0];
            y = xyz[1];
            z = xyz[2];

        }else{

            // zNear bug is already corrected
            x = Data.markers[index].x;
            y = Data.markers[index].y;
            z = Data.markers[index].z;

        }

        id = $(shootRay.pickObject).attr("id");

        valid_distance = true;

    }else{

        // returns a |1| viewing direction based on canvas coordinates
        var viewingRay = elem.runtime.getViewingRay(cnvx,cnvy);

        x = viewingRay.dir.x;
        y = viewingRay.dir.y;
        z = viewingRay.dir.z;

        valid_distance = false;

    }

    // to get XZ(horizontal) distance - convert to real world coordinates
    var R0 = Data.camera.Matrices.R0;
    var p_w = new x3dom.fields.SFVec3f(x-xc,y-yc,z-zc);
    var p_rw = R0.multMatrixVec(p_w);

    if (valid_distance){
        dist_xz  = Math.sqrt(Math.pow(p_rw.x,2)+Math.pow(p_rw.z,2));
        dist_xyz = Math.sqrt(Math.pow(p_rw.y,2)+Math.pow(dist_xz,2));
    }else{
        dist_xz = null;
        dist_xyz = null;
    }

    // azimuth, elevation and skew are relative to the camera location
    az = Math.atan2(p_rw.x,-p_rw.z)*180/Math.PI;
    az = (az+360)%360;
    el = Math.atan2(p_rw.y,Math.sqrt(p_rw.x*p_rw.x+p_rw.z*p_rw.z))*180/Math.PI;
    sk = 0;

    // fill out the output
    var result = {
        x: !round? x : x.toFixed(2),
        y: !round? y : y.toFixed(2),
        z: !round? z : z.toFixed(2),

        a: !round? az : az.toFixed(1),
        e: !round? el : el.toFixed(1),
        s: !round? sk : sk.toFixed(1)
    };

    if (dist_xz!=null){
        result.d_xz = !round? dist_xz : dist_xz.toFixed(1);
        result.d_xyz = !round? dist_xyz : dist_xyz.toFixed(1);
    }else{
        result.d_xz = dist_xz;
        result.d_xyz = dist_xyz;
    }

    result.id = id;
    result.index = index;

    return result;

}

/**
 * Get position and orientation of the observer (=viewer=camera)
 * in the 3D scene
 */
function x3dom_getCameraPosOr(round){

    var elem = Scene.element;

    var m = elem.runtime.viewMatrix().inverse();

    var tr = m.e3();

    var R0 = Data.camera.Matrices.R0;

    //var T0 = x3dom_toYawPitchRoll();
    m = R0.mult(m);

    //m = x3dom_TxMxTi(m);

    var ypr = x3dom_YawPitchRoll_nc(m);

    ypr.yaw = (180/Math.PI*ypr.yaw+360)%360;
    ypr.pitch *= 180/Math.PI;
    ypr.roll *= 180/Math.PI;

    //x3dom_matrix_test();

    var x = tr.x;
    var y = tr.y;
    var z = tr.z;

    if (!round){
        return {
            x: x,
            y: y,
            z: z,
            a: ypr.yaw,
            e: ypr.pitch,
            s: ypr.roll
        };
    }else{
        return {
            x: x.toFixed(2),
            y: y.toFixed(2),
            z: z.toFixed(2),
            a: ypr.yaw.toFixed(1),
            e: ypr.pitch.toFixed(1),
            s: ypr.roll.toFixed(1)
        };
    }

}

/**
 * Fix a bug with zNear in x3dom 1.7.2
 */
function zNear_bug_correction(xyz){

  var zNear = Scene.element.runtime.viewpoint().getNear();

  var x = xyz[0];
  var y = xyz[1];
  var z = xyz[2];

  var z1 = z + zNear;
  var zratio = z1/z;

  x = zratio*x;
  y = zratio*y;
  z = z1;

  return [x,y,z];
  //return xyz;

}

// this upright is for world coordinates, not the camera's
// the up vector should be taken from the initial camera orientation in kml.
function x3dom_setUpRight(){

    var mat = Scene.element.runtime.viewMatrix().inverse();

    var from = mat.e3();
    var at = from.subtract(mat.e2());
    var up = Data.camera.Matrices.Up0;

    var s = mat.e2().cross(up).normalize();

    var newup = mat.e2().cross(s).normalize().negate();

    mat = x3dom.fields.SFMatrix4f.lookAt(from, at, newup);

    x3dom_setViewpoint(mat);

}

/*
 * rotation by delta angle around camera's current Up vector
 */
function x3dom_rotation(dangle){

    var mat = Scene.element.runtime.viewMatrix();

    mat = mat.inverse();

    var from = mat.e3();
    var at = from.subtract(mat.e2());
    var up = mat.e1();

    var q0 = x3dom.fields.Quaternion.axisAngle(up, -dangle);
    var m0 = q0.toMatrix();

    var m1  = x3dom.fields.SFMatrix4f.translation(from);
    var m1n = x3dom.fields.SFMatrix4f.translation(from.negate());

    var mres = m1.mult(m0).mult(m1n);

    newat = mres.multMatrixPnt(at);

    newmat = x3dom.fields.SFMatrix4f.lookAt(from, newat, up);

    x3dom_setViewpoint(newmat);

}

/*
 * translate camera in x3dom space
 */
function x3dom_translation(dx,dy,dz){

    var delta = new x3dom.fields.SFVec3f(dx,dy,dz);

    var mat = Scene.element.runtime.viewMatrix().inverse();

    var from = mat.e3();
    var at = from.subtract(mat.e2());
    var up = mat.e1();

    var newfrom = from.add(delta);
    var newat = newfrom.subtract(mat.e2());

    var newmat = x3dom.fields.SFMatrix4f.lookAt(newfrom, newat, up);

    x3dom_setViewpoint(newmat);

}

function x3dom_altelev(alt,elev){

    //x3dom_matrix_test();

    var mat = Scene.element.runtime.viewMatrix().inverse();
    var R0 = Data.camera.Matrices.R0;
    //var T = x3dom_toYawPitchRoll();
    var from = mat.e3();
    from.y = alt;


    var mat = R0.mult(mat);
    var ypr = x3dom_YawPitchRoll_nc(mat);
    var ypr2 = x3dom_YawPitchRoll_nc_degs(mat);
    //console.log("Check1");
    //console.log(ypr2);

    var az = ypr.yaw;
    var el = elev;
    var sk = ypr.roll;

    var Mh = x3dom.fields.SFMatrix4f.rotationZ(az);
    var Mt = x3dom.fields.SFMatrix4f.rotationY(el);
    var Mr = x3dom.fields.SFMatrix4f.rotationX(sk);

    var R = Mh.mult(Mt).mult(Mr);

    //var R_rw = T.inverse().mult(R).mult(T);
    var R_rw = x3dom_TixMxT(R);
    var R_w = R0.inverse().mult(R_rw);

    var ypr2 = x3dom_YawPitchRoll_nc_degs(R_rw);
    //console.log("Check2");
    //console.log(ypr2);

    var matt  = x3dom.fields.SFMatrix4f.translation(from);

    var newmat = matt.mult(R_w);

    x3dom_setViewpoint(newmat);

}

/**
 * back and forth conversions for tests
 */
function x3dom_matrix_test(){

    console.log("begin==================================");

    var viewpoint = $(Scene.element).find("Viewpoint");

    console.log("Viewpoint DOM element");
    console.log("position: "+viewpoint.attr("position"));
    console.log("orientation: "+viewpoint.attr("orientation"));

    /*
     * 1. view matrix:
     *      - from world to camera
     *          - cols - world basis in camera coords
     * 2. view matrix inverted:
     *      - from camera to world
     *          - cols - camera basis in world coords
     *      - rotation matrix by def, order is not conv:
     *          - yx'z" vs zy'x"
     */

    var mat = Scene.element.runtime.viewMatrix();

    console.log("1. View Matrix from runtime");
    console.log(mat.toString());

    var mat_i = mat.inverse();

    console.log("2. Inverted View Matrix");
    console.log(mat_i.toString());

    var from = mat_i.e3();
    var at   = from.subtract(mat_i.e2());
    var up   = mat_i.e1();

    console.log("3. From-At-Up");

    var mat_fau = x3dom.fields.SFMatrix4f.lookAt(from, at, up);

    console.log(mat_fau.toString());

    var T = x3dom_toYawPitchRoll();

    var mat_eul = T.mult(mat_i).mult(T.inverse());
    var eangles = x3dom_YawPitchRoll_degs(mat_eul);

    console.log(eangles);

    var R = mat;
    var az = Math.atan2(R._02,R._22)*180/Math.PI;
    var el = -Math.asin(R._12)*180/Math.PI;
    var sk = Math.atan2(R._10,R._11)*180/Math.PI;

    console.log("Angles:");
    console.log("az="+az+" el="+el+" sk="+sk);


    console.log("matrix from angles");

    var matx = x3dom.fields.SFMatrix4f.rotationX(el*Math.PI/180);
    var maty = x3dom.fields.SFMatrix4f.rotationY(az*Math.PI/180);
    var matz = x3dom.fields.SFMatrix4f.rotationZ(sk*Math.PI/180);

    var m1  = x3dom.fields.SFMatrix4f.translation(from);
    var m1n = x3dom.fields.SFMatrix4f.translation(from.negate());

    var newmat = maty.mult(matx).mult(matz);

    console.log(newmat.toString());

    console.log("end==================================");
}

/**
 * Transform to calculate conventional Euler angles for z-y'-x" = z-y-z
 * unrelated: what's x3dom's native getWCtoCCMatrix()? canvas-to-world?
 */

function x3dom_toYawPitchRoll(){
    return new x3dom.fields.SFMatrix4f(
        0, 0,-1, 0,
        1, 0, 0, 0,
        0,-1, 0, 0,
        0, 0, 0, 1
    );
}

/*
 * For Yaw Pitch Roll
 */
function x3dom_TixMxT(m){
    return new x3dom.fields.SFMatrix4f(
        m._11,-m._12,-m._10, m._03,
       -m._21, m._22, m._20, m._13,
       -m._01, m._02, m._00, m._23,
        m._30, m._31, m._32, m._33
    );
}

/*
 * For Yaw Pitch Roll
 */
function x3dom_TxMxTi(m){
    return new x3dom.fields.SFMatrix4f(
        m._22,-m._20, m._21, m._03,
       -m._02, m._00,-m._01, m._13,
        m._12,-m._10, m._11, m._23,
        m._30, m._31, m._32, m._33
    );
}

function x3dom_YawPitchRoll(m){

    var yaw = Math.atan2(m._10,m._00);
    var pitch = -Math.asin(m._20);
    var roll = Math.atan2(m._21,m._22);

    return {
        yaw: yaw,
        pitch: pitch,
        roll: roll
    };
}

function x3dom_YawPitchRoll_degs(m){

    var a = x3dom_YawPitchRoll(m);

    return {
        yaw: a.yaw*180/Math.PI,
        pitch: a.pitch*180/Math.PI,
        roll: a.roll*180/Math.PI
    };
}

/*
 * from not converted matrix
 */
function x3dom_YawPitchRoll_nc(m){

    var yaw = -Math.atan2(m._02,m._22);
    var pitch = -Math.asin(m._12);
    var roll = -Math.atan2(m._10,m._11);

    return {
        yaw: yaw,
        pitch: pitch,
        roll: roll
    };

}

function x3dom_YawPitchRoll_nc_degs(m){

    var a = x3dom_YawPitchRoll_nc(m);

    return {
        yaw: a.yaw*180/Math.PI,
        pitch: a.pitch*180/Math.PI,
        roll: a.roll*180/Math.PI
    };

}

/*
function x3dom_YawPitchRoll_2_degs(m){

    var pitch = Math.PI+Math.asin(m._20);
    var roll = Math.atan2(m._21/Math.cos(pitch),m._22/Math.cos(pitch));
    var yaw = Math.atan2(m._10/Math.cos(pitch),m._00/Math.cos(pitch));

    return {
        yaw: yaw*180/Math.PI,
        pitch: pitch*180/Math.PI,
        roll: roll*180/Math.PI
    };
}
*/
function x3dom_delta_map2scene(p0,p1){

    var pi = new L.LatLng(p0.lat,p1.lng);

    var dx = p0.distanceTo(pi);
    var dy = 0;
    var dz = p1.distanceTo(pi);

    var dp_rw = new x3dom.fields.SFVec3f(dx,dy,dz);

    if (p1.lng<p0.lng) dp_rw.x = -dp_rw.x;
    if (p1.lat>p0.lat) dp_rw.z = -dp_rw.z;

    var M0 = Data.camera.Matrices.R0.inverse();
    var dp_w = M0.multMatrixVec(dp_rw);

    return dp_w;

}

// x,y,z - x3dom internal coords
function x3dom_getDistAngle(x,y,z){

    var R0 = Data.camera.Matrices.R0;
    var p_w = new x3dom.fields.SFVec3f(x,y,z);
    var p_rw = R0.multMatrixVec(p_w);

    var d = Math.sqrt(p_rw.x*p_rw.x+p_rw.z*p_rw.z);
    var a = Math.atan2(p_rw.x,-p_rw.z)*180/Math.PI;

    return Array(d,a);

}

function x3dom_update_map(){

    var Camera = Map.marker;

    // real world ypr from viewmatrix

    var mat = Scene.element.runtime.viewMatrix().inverse();
    var R0 = Data.camera.Matrices.R0;
    //var T = x3dom_toYawPitchRoll();

    var p_w = mat.e3();
    var dp_w = mat.e3();

    //var m_rw = T.mult(R0).mult(mat).mult(T.inverse());

    // R0 - rw -> w
    mat = R0.mult(mat);

    var ypr = x3dom_YawPitchRoll_nc_degs(mat);

    var heading = ypr.yaw;

    Map.marker.setHeading(heading);

    // real world angle distance of some point

    if (Scene.old_view_translation != null){
        dp_w = dp_w.subtract(Scene.old_view_translation);
    }

    // from w to rw
    dp_rw = R0.multMatrixVec(dp_w);

    var distance = Math.sqrt(dp_rw.x*dp_rw.x+dp_rw.z*dp_rw.z);

    var angle = 0;

    if (dp_rw.z!=0){
        angle = 180/Math.PI*Math.atan2(dp_rw.x,-dp_rw.z);
    }

    //angle = angle + heading;

    var initial_coordinates = [Data.camera.latitude,Data.camera.longitude];

    var p0 = new L.LatLng(initial_coordinates[0],initial_coordinates[1]);//Camera._latlng;
    var p1 = p0.CoordinatesOf(angle,distance);

    Map.marker.setBasePoint(p1);
    Map.marker._syncMeasureMarkersToBasePoint();

    Data.camera.latitude = p1.lat;
    Data.camera.longitude = p1.lng;
    Data.camera.heading = heading;

    Scene.old_view_translation = p_w;

}

// uses globals
function x3dom_setViewpoint(m){

    //console.log("Setting a viewpoint");

    var Q = new x3dom.fields.Quaternion(0, 0, 1, 0);
    Q.setValue(m);
    var AA = Q.toAxisAngle();

    var viewpoint = $(Scene.element).find("Viewpoint");
    viewpoint.attr("orientation",AA[0].toString()+" "+AA[1]);
    viewpoint.attr("position",m.e3().toString());
    viewpoint.attr("centerOfRotation",m.e3().toString());

    // update every time
    Data.camera.Matrices.RC_w = m;

}

