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
        var test = $(e.target).hasClass("donothide");
        
        if (!test){
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
    
    marker_size_color_init();
    
    reset_view_init();
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

function marker_size_color_init(){
    
    $('#markersize').on('change',function(e){
        SETTINGS.markersize = $(this).val();
    });
    $('#markersize').change();

    $('#markercolor').on('change',function(e){
        SETTINGS.markercolor = $(this).val();
    });
    $('#markercolor').change();
    
}

function reset_view_init(){
    
    $("#reset_view").on('click',function(){
        x3d_initial_camera_placement();
        x3d_mouseMove();
        Scene.resize();
    });
    
}