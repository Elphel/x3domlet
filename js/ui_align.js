
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

function x3dom_align_0(){

  //get all points
  //console.log("Base");
  //console.log(Data.camera);
  //console.log("Markers");
  //console.log(Data.markers);

  var base = Data.camera;
  // base.x
  // base.y
  // base.z
  // base.latitude
  // base.longitude

  for(var i=0;i<Data.markers.length;i++){

    var mark = Data.markers[i];

    // map azimuth
    var p1_ll = new L.LatLng(base.latitude,base.longitude);
    var p2_ll = new L.LatLng(mark.align.latitude,mark.align.longitude);

    var azimuth_map = getAzimuth(p1_ll,p2_ll);

    //var da = x3dom_getDistAngle(mark.align.x,mark.align.y,mark.align.z);
    //var azimuth_3d = da[1];

    var v = new x3dom.fields.SFVec3f(mark.align.x-base.x,mark.align.y-base.y,mark.align.z-base.z);
    var azimuth_3d = Math.atan2(v.x,-v.z)*180/Math.PI;

    console.log(azimuth_map+" - "+azimuth_3d+" = "+(azimuth_map-azimuth_3d));

  }

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
