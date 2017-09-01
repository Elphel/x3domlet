/*

  Copyright (C) 2017 Elphel Inc.

  SPDX-License-Identifier: GPL-3.0+

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

    controls_showhide();

    // init options menu
    var menu = $("#menu-content");

    $("#menu_button").on("click",function(){
        menu.show();
    });

    $("#exit_button").on("click",function(){
      var origin = window.location.origin;
      var path = window.location.pathname;
      path = path.substr(0,path.lastIndexOf("/"));
      window.location.href = origin+path+"?model="+SETTINGS.path+"&rating="+SETTINGS.rating;
    });

    $("#download_button").on("click",function(){
        window.location.href = "download.php?file="+SETTINGS.files.x3d;
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

    $("#window-error").on('click',function(){
      $(this).hide();
    });

    crosshair_init();
    shiftspeed_init();
    marker_size_color_init();
    reset_view_init();
    remove_markers_init();
    align_init();
    work_with_kml_init();
    save_rating_init();
    editmode_init();

    $("#global_coordinates").on('click',function(){
      ui_hideMessage("window-markinfo");
    });
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
        reset_to_initial_position();
    });

    $("#reset_view_t").on('click',function(){
        reset_to_initial_position("t");
    });

}

function remove_markers_init(){

    $("#remove_markers").on('click',function(){
        remove_markers();
    });

}

function work_with_kml_init(){

    $("#savekml").on('click',function(){
        var output = generateKML([Data.camera.kml]);
        postKmlData(SETTINGS.files.kml, output);

    });

    $("#restorekml").on('click',function(){
        $("#reset_view").click();
    });

}

function save_rating_init(){

  $.ajax({
    url: "store_rating.php?model="+SETTINGS.path,
    complete: function(response){
      var value = parseInt(response.responseText);

      // this check defines if the page is public or private
      if (isNaN(value)){
        value = 5;
        // add elements ids
        SETTINGS.forcehide.push("#model_rating_tr");
        SETTINGS.forcehide.push("#kml_tr");

      }else{

        SETTINGS.forceshow.push(".experimental");

      }

      $("#model_rating").val(value);
      // bind onchange
      $("#model_rating").on('change',function(){
        $.ajax({
          url: "store_rating.php?model="+SETTINGS.path+"&rating="+$(this).val(),
          complete:function(response){
            var res = parseInt(response.responseText);
            if (res==0){
              $("#rstatus").css({color:"rgba(70,200,70,1)"}).html("stored");
              $("#rstatus").show(0).delay(1000).fadeOut(250);
            }else{
                var msg = "no access";
                if ((res==-1)||(res==-2)) msg = "no access";
                if (res==-3) msg = "no access";
                $("#rstatus").css({color:"rgba(200,70,70,1)"}).html("fail: "+msg);
                $("#rstatus").show(0).delay(1000).fadeOut(250);
            }
          }
        })
      });
    }
  });

}

function editmode_init(){

  // the id is buried in the leaflet plugin
  $("#location_control").addClass("edit");

  $("#edit").on('change',function(){
    SETTINGS.edit = $(this).prop("checked");
    controls_showhide();
  });

  $("#import_coordinates_button").on('click',function(){

    if ($("#model_name").val()==""){
      $("#imstatus").css({color:"rgba(200,70,70,1)"}).html("empty field");
      $("#imstatus").show(0).delay(1000).fadeOut(250);
    }else{

      var kmlfile = SETTINGS.basepath+"/"+$("#model_name").val()+"/"+$("#model_name").val()+".kml";

      $.ajax({
        url: kmlfile+"?"+Date.now(),
        success:function(response){

          $("#imstatus").css({color:"rgba(70,200,70,1)"}).html("ok");
          $("#imstatus").show(0).delay(1000).fadeOut(250);

          var latitude  = parseFloat($(response).find("Camera").find("latitude").text());
          var longitude = parseFloat($(response).find("Camera").find("longitude").text());
          var altitude  = parseFloat($(response).find("Camera").find("altitude").text());

          Data.camera.latitude = latitude;
          Data.camera.longitude = longitude;
          Data.camera.altitude = altitude;

          Data.camera.kml.latitude = latitude;
          Data.camera.kml.longitude = longitude;
          Data.camera.kml.altitude = altitude;

          //reset
          Map.marker.setHeading(Data.camera.heading);
          Map.marker.setBasePoint(new L.LatLng(latitude,longitude));
          Map.marker._syncMeasureMarkersToBasePoint();
          Map._map.panTo(new L.LatLng(latitude,longitude));

          x3d_initial_camera_placement("t");


        },
        error:function(response){
          $("#imstatus").css({color:"rgba(200,70,70,1)"}).html("file not found");
          $("#imstatus").show(0).delay(1000).fadeOut(250);
        }
      });
    }

  });

}

function controls_showhide(){

    if (!SETTINGS.experimental){
      $(".experimental").hide();
      SETTINGS.forceshow.forEach(function(c,i){$(c).show();});
    }else{
      $(".experimental").show();
      SETTINGS.forcehide.forEach(function(c,i){$(c).hide();});
    }

    if (!SETTINGS.edit){
      $(".edit").hide();
      SETTINGS.forceshow.forEach(function(c,i){$(c).show();});
    }else{
      $(".edit").show();
      SETTINGS.forcehide.forEach(function(c,i){$(c).hide();});
      align_position();
    }

}
