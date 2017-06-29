
function align_init(){

    $("#align_button").on("click",function(){
        align_heading();
    });

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
