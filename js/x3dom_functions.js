/**
 * output in units (meters)
 */
function x3dom_getViewTranslation(elem){

    var vp_mat = elem.runtime.viewMatrix().inverse();
    var vp_translation = vp_mat.e3();

    return vp_translation;
    
}

/**
 * output in degrees
 */
function x3dom_getViewDirection(elem){
    
    var vp_mat = elem.runtime.viewMatrix();
    
    var vMatInv  = vp_mat.inverse();
    var viewDir  = vMatInv.multMatrixVec(new x3dom.fields.SFVec3f(0.0, 0.0, -1.0));
    
    var angle = Math.atan2(viewDir.x,-viewDir.z)*180/Math.PI;
    
    return angle;
    
}

/**
 * get position and orientation in the 3D scene defined by mouse's canvas x,y 
 */
function x3dom_getXYPosOr(cnvx,cnvy,round){
    
    var elem = Scene.element;

    var x,y,z;
    var az,el,sk;
    var id;

    var dist_xyz = 1000;
    var dist_xz = 1000;

    var shootRay = elem.runtime.shootRay(cnvx,cnvy);
    
    if (shootRay.pickPosition != null){
        
        var index = Scene.highlighted_marker_index;    
        
        if ((index==null)||(Data.markers[index]==undefined)){
        
            x = shootRay.pickPosition.x;
            y = shootRay.pickPosition.y;
            z = shootRay.pickPosition.z;
            
        }else{
            
            x = Data.markers[index].x;
            y = Data.markers[index].y;
            z = Data.markers[index].z;
            
        }
        
        dist_xz  = Math.sqrt(x*x+z*z);
        dist_xyz = Math.sqrt(y*y+dist_xz*dist_xz);
        
        if (round){
            dist_xz.toFixed(2);
            dist_xyz.toFixed(2);
        }
        
        id = $(shootRay.pickObject).attr("id");
        
    }else{
        
        var viewingRay = elem.runtime.getViewingRay(cnvx,cnvy);
        
        x = viewingRay.dir.x;
        y = viewingRay.dir.y;
        z = viewingRay.dir.z;
        
        dist_xz = null;
        dist_xyz = null;
    }
    
    az = Math.atan2(x,-z)*180/Math.PI;
    az = (az+INIT_HEADING+360)%360;
    el = Math.atan2(y,Math.sqrt(x*x+z*z))*180/Math.PI;
    sk = 0;
    
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
    
    return result;

}

/**
 * Get position and orientation of the observer (=viewer=camera) 
 * in the 3D scene
 */
function x3dom_getCameraPosOr(round){
    
    var elem = Scene.element;
    
    var vm = elem.runtime.viewMatrix().inverse();
    
    var tr = vm.e3();
    
    var x = tr.x;
    var y = tr.y;
    var z = tr.z;
    
    var R = vm;
    
    var az = Math.atan2(R._02,R._22)*180/Math.PI;
    
    az = (az+INIT_HEADING+360)%360;
    
    var el = -Math.asin(R._12)*180/Math.PI;

    var sk = Math.atan2(R._10,R._11);
    
    if (!round){
        return {
            x: x,
            y: y,
            z: z,
            a: az,
            e: el,
            s: sk
        };
    }else{
        return {
            x: x.toFixed(2),
            y: y.toFixed(2),
            z: z.toFixed(2),
            a: az.toFixed(1),
            e: el.toFixed(1),
            s: sk.toFixed(1)
        };        
    }
    
}

function x3dom_setUpRight(){

    var mat = Scene.element.runtime.viewMatrix().inverse();
    
    var from = mat.e3();
    var at = from.subtract(mat.e2());

    var up = new x3dom.fields.SFVec3f(0, 1, 0);
    
    var s = mat.e2().cross(up).normalize();
    
    var newup = mat.e2().cross(s).normalize().negate();
    
    //at = from.add(v);
    
    mat = x3dom.fields.SFMatrix4f.lookAt(from, at, newup);
    //mat = mat.inverse();
    
    //var m1  = x3dom.fields.SFMatrix4f.translation(from);
    //var m1n = x3dom.fields.SFMatrix4f.translation(from.negate());
    
    //mat = m1.mult(mat).mult(m1n);
    
    var Q = new x3dom.fields.Quaternion(0,0,1,0);
    Q.setValue(mat);
    var AA = Q.toAxisAngle();

    var viewpoint = $(Scene.element).find("Viewpoint");
    viewpoint.attr("position",mat.e3().toString());
    viewpoint.attr("centerOfRotation",mat.e3().toString());
    viewpoint.attr("orientation",AA[0].toString()+" "+AA[1]);

}

function x3dom_rotation(delta_a){
    
    /* 
     * Printing values:
     * 
     *   var mat = Scene.element.runtime.viewMatrix().inverse();
     *   var rotation = new x3dom.fields.Quaternion(0, 0, 1, 0);
     *   rotation.setValue(mat);
     *   var translation = mat.e3();
     * 
     */
    
    var mat = Scene.element.runtime.viewMatrix();

    mat = mat.inverse();
    //console.log(mat.toString());

    var from = mat.e3();
    var at = from.subtract(mat.e2());
    var up = mat.e1();
    
    var q0 = x3dom.fields.Quaternion.axisAngle(up, -delta_a);
    var m0 = q0.toMatrix();
    
    var m1  = x3dom.fields.SFMatrix4f.translation(from);
    var m1n = x3dom.fields.SFMatrix4f.translation(from.negate());
    
    var mres = m1.mult(m0).mult(m1n);
    
    newat = mres.multMatrixPnt(at);
    
    newmat = x3dom.fields.SFMatrix4f.lookAt(from, newat, up);
        
    var Q = new x3dom.fields.Quaternion(0,0,1,0);
    //Q.setValue(newmat.inverse());
    Q.setValue(newmat);
    var AA = Q.toAxisAngle();
    
    var viewpoint = $(Scene.element).find("Viewpoint");
    viewpoint.attr("orientation",AA[0].toString()+" "+AA[1]);
    viewpoint.attr("position",from.toString());
    viewpoint.attr("centerOfRotation",from.toString());
    
}

// horizontal?
function x3dom_translation(dx,dy,dz){
    
    var mat = Scene.element.runtime.viewMatrix().inverse();
    var tr = mat.e3();

    var x = tr.x+dx;
    var y = tr.y+dy;
    var z = tr.z+dz;

    var viewpoint = $(Scene.element).find("Viewpoint");
    viewpoint.attr("position",x+" "+y+" "+z);
    viewpoint.attr("centerOfRotation",x+" "+y+" "+z);

}

function x3dom_altelev(alt,elev){

    //x3dom_matrix_test();

    var mat = Scene.element.runtime.viewMatrix().inverse();

    var from = mat.e3();
    from.y = alt;

    var az = Math.atan2(mat._02,mat._22);
    var el = elev;
    var sk = Math.atan2(mat._10,mat._11);

    var matx = x3dom.fields.SFMatrix4f.rotationX(el);
    var maty = x3dom.fields.SFMatrix4f.rotationY(az);
    var matz = x3dom.fields.SFMatrix4f.rotationZ(sk);
    var matt  = x3dom.fields.SFMatrix4f.translation(from);

    var newmat = matt.mult(maty).mult(matx).mult(matz);

    var Q = new x3dom.fields.Quaternion(0,0,1,0);
    Q.setValue(newmat);
    var AA = Q.toAxisAngle();

    var viewpoint = $(Scene.element).find("Viewpoint");
    viewpoint.attr("position",newmat.e3().toString());
    viewpoint.attr("centerOfRotation",newmat.e3().toString());
    viewpoint.attr("orientation",AA[0].toString()+" "+AA[1]);
    
}

function x3dom_matrix_test(){
    
    var viewpoint = $(Scene.element).find("Viewpoint");
    
    console.log("Viewpoint DOM element");
    console.log("position: "+viewpoint.attr("position"));
    console.log("orientation: "+viewpoint.attr("orientation"));
    
    var mat = Scene.element.runtime.viewMatrix().inverse();
    
    console.log("inversed viewMatrix");
    console.log(mat.toString());    
    
    var from = mat.e3();
    var at = from.subtract(mat.e2());
    var up = mat.e1();
    
    console.log("matrix from from-at-up");
    
    var newmat = x3dom.fields.SFMatrix4f.lookAt(from, at, up);
    
    console.log(newmat.toString());
    
    var R = mat;
    var az = Math.atan2(R._02,R._22)*180/Math.PI;
    //az = (az+INIT_HEADING+360)%360;
    //az = (az+360)%360;
    var el = -Math.asin(R._12)*180/Math.PI;
    var sk = Math.atan2(R._10,R._11);
    
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
    
}

/**
 * Get World to Camera coordinates tranform matrix
 * what's native getWCtoCCMatrix()?
 */
function x3dom_W2C(){
    return new x3dom.fields.SFMatrix4f(
        0, 0, 1, 0,
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 0, 1,
    );
}

function x3dom_C2W(){
    return x3dom_W2C().inverse();
}
