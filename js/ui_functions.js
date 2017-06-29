// general

/*
 *
 */
function ui_showMessage(id,msg,bg){

    if (bg != undefined){
        $("#"+id).css({background:bg});
    }

    $("#"+id).show();

    $("#"+id).html($("<div>").html(msg).css({
        padding:"5px 10px"
    })).show();

}

function ui_hideMessage(id){

    $("#"+id).hide();

}

// scene (x3dom)

// map (leaflet)