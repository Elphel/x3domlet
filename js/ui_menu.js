
function menu_init(){
    
    // init checkboxes
    for (var setting in SETTINGS){
        if (typeof SETTINGS[setting] === 'boolean'){
            if (SETTINGS[setting]){
                $("#"+setting).prop("checked",true);
            }else{
                $("#"+setting).prop("checked",false);
            }
        }else{
            //number?
            $("#"+setting).val(SETTINGS[setting]);
        }
    }
    
    // init options menu
    var menu = $("#menu-content");
    
    $("#menu_button").on("click",function(){
        menu.show();
    });
    
    // changing a checkbox will not close menu
    menu.on('click',function(e){
        var class1 = $(e.target).hasClass("my-check-box");
        var class2 = $(e.target).hasClass("input");
        if (!class1&&!class2){
            menu.hide();
        }
    });
    
    // change checkbox
    $(".my-check-box").on('click',function(e){
        
        var state = $(this).prop("checked");
        var id    = $(this).attr("id");
        
        if (state==true){
            SETTINGS[id] = true;
        }else{
            SETTINGS[id] = false;
        }

    });

    crosshair_init();

    shiftspeed_init();
}

function crosshair_init(){

    if (SETTINGS.crosshair){
        $(".crosshair").show();
    }

    $("#crosshair").on('click',function(){
        if (SETTINGS.crosshair){
            $(".crosshair").show();
        }else{
            $(".crosshair").hide();
        }
    });

}

function shiftspeed_init(){

    $('#shiftspeed').on('change',function(e){
        $("#navInfo").prop("speed",$(this).val());
        $(this).blur();
    });

    $('#shiftspeed').change();
}
