function extra_models_init(){

  var emc = $("#extra_models-content");

  // get content
  $.ajax({
    url: [SETTINGS.basepath,SETTINGS.path,"extra.xml"].join("/"),
    success: function(response){

      var eml = ['<table>'];
      $(response).find("model").each(function(){
        var name = $(this).attr("name");
        var version = $(this).attr("version");
        eml.push([
          '<tr>',
          '  <td><input type=\'checkbox\' class=\'my-check-box donothide\' /></td>',
          '  <td class=\'extra_model_item\' version=\''+version+'\'>'+name+'</td>',
          '</tr>'
        ].join('\n'));
      });
      eml.push('</table>');

      emc.append($(eml.join('\n')));

      var load_extra_models_button = $('<button>',{
        id: 'load_extra_models_button',
        title: 'load checked, hide unchecked',
        class:'donothide'
      }).html('Load');

      emc.append('<br/>').append(load_extra_models_button);

      load_extra_models_button.on('click',function(){
        load_extra_models();
      });

    },
    error: function(response){
      emc.append($("<h2 style='color:red'>N/A</h2>"));
    }
  });


  $("#extra_models_button").on("click",function(){
      emc.show();
  });

  // changing a checkbox will not close menu
  emc.on('click',function(e){
      var test = $(e.target).hasClass("donothide");
      if (!test){
          emc.hide();
      }
  });

}

function manualposor_init(){

    $("#window-extrainfo").html([
      '<div>',
      ' <table id=\'mpr_table\'>',
      ' <tr>',
      '   <th colspan=\'4\'></th>',
      '   <th align=\'left\' colspan=\'3\'>position, m</th>',
      '   <th align=\'left\' colspan=\'3\'>orientation, &deg;</th>',
      ' </tr>',
      ' <tr>',
      '   <th colspan=\'1\'></th>',
      '   <th colspan=\'2\'><button title=\'reset radios (r1 & r2)\' id=\'mpr_reset_radios\'>reset</button></th>',
      '   <th colspan=\'1\'></th>',
      '   <th class=\'mpr_name\'>step, m :</th>',
      '   <th class=\'mpr_name\'><input id=\'mpr_step_m\' type=\'text\' class=\'mpr_steps\' value=\'0.001\'></th>',
      '   <th></th>',
      '   <th class=\'mpr_name\'>step, &deg; :</th>',
      '   <th class=\'mpr_name\'><input id=\'mpr_step_d\' type=\'text\' class=\'mpr_steps\' value=\'0.05\'></th>',
      ' </tr>',
      ' <tr>',
      '   <th>Model</th>',
      '   <th class=\'mpr_name\' title=\'glued\'>r1</th>',
      '   <th class=\'mpr_name\' title=\'unglued\'>r2</th>',
      '   <th class=\'mpr_name\' title=\'hide on shift key\'>hide</th>',
      '   <th class=\'mpr_name\'>x</th>',
      '   <th class=\'mpr_name\'>y</th>',
      '   <th class=\'mpr_name\'>z</th>',
      '   <th class=\'mpr_name\'>azimuth</th>',
      '   <th class=\'mpr_name\'>elevation</th>',
      '   <th class=\'mpr_name\'>roll</th>',
      ' </tr>',
      ' </table>',
      '</div>',
      '<div>',
      '  <div><button id=\'mpr_save\'>save</button></div>',
      '</div>',
    ].join('\n'));

    if (SETTINGS.manualposor){
        manualposor_refresh_content();
        $("#window-extrainfo").show();
    }else{
        $("#window-extrainfo").hide();
    }

    $("#manualposor").on('click',function(){
        if (SETTINGS.manualposor){
            manualposor_refresh_content();
            $("#window-extrainfo").show();
        }else{
            $("#window-extrainfo").hide();
        }
    });

    $("#window-extrainfo").on('mouseenter',function(){
      $(this).focus();
    });

    $("#window-extrainfo").on('mouseleave',function(){
      $(this).trigger('keyup');
      //$(this).focus();
    });

    // stop propagation to the scene
    $("#window-extrainfo").on('keydown',function(e){
      if(e.key=="Shift"){
        $(this).find(".mpr_modelname").each(function(){
          var modelname = $(this).html();
          var checkbox = $(this).parent().find(".mpr_hide");
          if (checkbox.prop("checked")){
            $("inline[name=x3d_"+modelname+"]").parent().parent().parent().attr("whichChoice",-1);
          }
        });
      }
      e.stopPropagation();
    });

    $("#window-extrainfo").on('keyup',function(e){
      $(this).find(".mpr_modelname").each(function(){
        var modelname = $(this).html();
        $("inline[name=x3d_"+modelname+"]").parent().parent().parent().attr("whichChoice",0);
      });
    });

    // save all models in the list
    $("#mpr_save").on('click',function(){
      $(".mpr_modelname").each(function(){

        var name = $(this).html();

        if (name!=SETTINGS.path){
          var output = generateKML([Data.extra_models["x3d_"+name]]);
          var filename = SETTINGS.basepath+"/"+name+"/"+name+".kml";
          console.log("Saving "+filename);
          //console.log(output);
          postKmlData(filename, output);
        }
      });
    });

    $("#mpr_reset_radios").on('click',function(){

      $(".mpr_r1").each(function(){
        $(this).prop("checked",false);
      });

      $(".mpr_r2").each(function(){
        $(this).prop("checked",false);
      });

    });

}

// Loading
function load_extra_models(){

  var load_array = [];

  $(".extra_model_item").each(function(){

    var is_checked = $(this).parent().find('input').prop("checked");

    if (is_checked){
      console.log("Loading "+$(this).html());
      load_extra_model($(this).html(),$(this).attr('version'));
    }else{
      console.log("Hiding "+$(this).html());
      hide_extra_model($(this).html());
    }

  });

}

function load_extra_model(name,version){

//get current kml
//get that model kml
//find relative orientation and apply to the group first

  //console.log($("inline[name=x3d_"+name+"]"));

  if ($("inline[name=x3d_"+name+"]").length==0){

    model_kml = SETTINGS.basepath+"/"+name+"/"+name+".kml";

    $.ajax({
      url: model_kml+"?"+Date.now(),
      success:function(response){

        parse_load_extra_model(name,version,response);

      },
      error:function(response){
        console.log("Too bad, file not found");
      }
    });

  }else{

    console.log("Model "+name+" is already loaded");

  }
}

function hide_extra_model(name){
  //donothing
  $("inline[name=x3d_"+name+"]").parent().parent().parent().parent().remove();
  manualposor_refresh_content();

}

function parse_load_extra_model(name,version,response){

  var latitude  = parseFloat($(response).find("Camera").find("latitude").text());
  var longitude = parseFloat($(response).find("Camera").find("longitude").text());
  var altitude  = parseFloat($(response).find("Camera").find("altitude").text());

  var heading = parseFloat($(response).find("Camera").find("heading").text());
  var tilt    = parseFloat($(response).find("Camera").find("tilt").text())-90;
  var roll    = parseFloat($(response).find("Camera").find("roll").text());

  // reset
  Data.extra_models["x3d_"+name] = {
      latitude: latitude,
      longitude: longitude,
      altitude: altitude,
      heading: heading,
      tilt: tilt+90,
      roll: roll,
      name        : $(response).find("name").text(),
      description : $(response).find("Camera").find("description").text(),
      visibility  : $(response).find("visibility").text(),
      href        : $(response).find("Icon").find("href").text()
  };

  // apply translation?!!!
  var p0 = new L.LatLng(Data.camera.kml.latitude,Data.camera.kml.longitude);
  var p1 = new L.LatLng(Data.extra_models["x3d_"+name].latitude,Data.extra_models["x3d_"+name].longitude);
  var p_w = x3dom_delta_map2scene(p0,p1);

  var tstring = [p_w.x,p_w.y,p_w.z].join(",");

  heading = heading*Math.PI/180;
  tilt = tilt*Math.PI/180;
  roll = roll*Math.PI/180;

  // Heading,Tilt,Roll
  var Mh = x3dom.fields.SFMatrix4f.rotationZ(heading);
  var Mt = x3dom.fields.SFMatrix4f.rotationY(tilt);
  var Mr = x3dom.fields.SFMatrix4f.rotationX(roll);

  // proper Euler rotation
  var R = Mh.mult(Mt).mult(Mr);
  //var R = Mr.mult(Mt).mult(Mh);
  // convert to proper Euler
  var T = x3dom_toYawPitchRoll();

  var R1 = T.inverse().mult(R).mult(T);
  var R0 = Data.camera.Matrices.R0;

  //var R_diff = R1.mult(R0.inverse());
  var R_diff = R0.inverse().mult(R1);

  var Q = new x3dom.fields.Quaternion(0, 0, 1, 0);
  Q.setValue(R_diff);
  var AA = Q.toAxisAngle();
  var rstring = AA[0].toString()+" "+AA[1];

  var x3delement = $("#x3d_id").find("scene");

  model_url = SETTINGS.basepath+"/"+name+"/"+version+"/"+name+".x3d";

  var mountshift = [SETTINGS.mountshift.x,SETTINGS.mountshift.y,SETTINGS.mountshift.z].join(',');

  var model = $([
      '<group>',
      '  <switch whichChoice=\'0\'>',
      '    <transform rotation=\''+rstring+'\' translation=\''+tstring+'\'>',
      '      <transform translation=\''+mountshift+'\'>',
      '        <inline name="x3d_'+name+'" namespacename="x3d_'+name+'" url="'+model_url+'"></inline>',
      '      </transform>',
      '    </transform>',
      '  </switch>',
      '</group>'
    ].join('\n'));

  x3delement.append(model);
  // add to loaded_models

  //update content
  manualposor_refresh_content();

}

// controls and adjustment

function manualposor_refresh_content(){

  //$(".mpr_content").remove();

  // find loaded models
  $("inline").each(function(){

    var name = $(this).attr("namespacename").substr(4);

    var entry_exists = false;
    //exit here
    $(".mpr_modelname").each(function(){
      if ($(this).html()==name){
        entry_exists = true;
      }
    });

    // exit if found entry in the table
    if (entry_exists) return;

    var tmpstr = "";

    if (name==SETTINGS.path){
      tmpstr = "(major)";
    }
    console.log("Model "+tmpstr+": "+name);

    // get rotation and translation
    var tra = $(this).parent().parent();
    //console.log($(tra).attr("translation")+' vs '+$(tra).attr("rotation"));
    // always defined
    // 0,0,0 vs 0,0,0,0

    var tra_rot = $(tra).attr("rotation").split(",");

    if (tra_rot.length==1){
        tra_rot = $(tra).attr("rotation").split(" ");
    }

    //TEST

    var q = x3dom.fields.Quaternion.parseAxisAngle($(tra).attr("rotation"));
    var m = q.toMatrix();
    // convert to real world
    var R0 = Data.camera.Matrices.R0;
    //m = m.mult(R0);
    m = R0.mult(m);

    var htr = x3dom_YawPitchRoll_nc_degs(m);
    console.log(htr);

    // pre A.
    // x3dom.fields.Quaternion.parseAxisAngle

    // A.
    //var quat = x3dom.fields.Quaternion.axisAngle(new x3dom.fields.SFVec3f(+m[1], +m[2], +m[3]), +m[4]);

    // B.
    //toMatrix

    //console.log(tra_rot);

    // tra_tra is local - convert to real world
    var tra_tra = $(tra).attr("translation").split(",");
    var tra_tra_rw = x3dom_scene_to_real(tra_tra[0],tra_tra[1],tra_tra[2]);

    $("#mpr_table").append($([
      '<tr class=\'mpr_content\'>',
      '  <td align=\'center\' class=\'mpr_name mpr_modelname\'>'+name+'</td>',
      '  <td><input type=\'radio\' class=\'mpr_r1\' name=\'r1\' value=\''+name+'\' id=\'r1_'+name+'\'></td>',
      '  <td><input type=\'radio\' class=\'mpr_r2\' name=\'r2\' value=\''+name+'\' id=\'r2_'+name+'\'></td>',
      '  <td><input type=\'checkbox\' class=\'mpr_hide\'></td>',
      '  <td><input type=\'text\' class=\'mpr_input mpr_tra mpr_x\' value=\''+tra_tra_rw.x.toFixed(3)+'\' \></td>',
      '  <td><input type=\'text\' class=\'mpr_input mpr_tra mpr_y\' value=\''+tra_tra_rw.y.toFixed(3)+'\' \></td>',
      '  <td><input type=\'text\' class=\'mpr_input mpr_tra mpr_z\' value=\''+tra_tra_rw.z.toFixed(3)+'\' \></td>',
      '  <td><input type=\'text\' class=\'mpr_input mpr_rot mpr_h\' value=\''+htr.yaw.toFixed(2)+'\' \></td>',
      '  <td><input type=\'text\' class=\'mpr_input mpr_rot mpr_t\' value=\''+htr.pitch.toFixed(2)+'\' \></td>',
      '  <td><input type=\'text\' class=\'mpr_input mpr_rot mpr_r\' value=\''+htr.roll.toFixed(2)+'\' \></td>',
      '</tr>',
    ].join("\n")));

  });

  // rebind all
  $(".mpr_r1[name=r1]").off('change').change(function(){
    console.log("Go "+this.value);
  });

  // remove entry if inline missing
  $(".mpr_modelname").each(function(){

    var name = $(this).html();
    var inline = $("inline[name=x3d_"+name+"]");
    if (inline.length==0){
      $(this).parent().remove();
      if (Data.extra_models["x3d_"+name]!==undefined){
        delete Data.extra_models["x3d_"+name];
      }
    }

  });

  // events - mousewheel
  $(".mpr_input").each(function(){

    //unbind existing
    this.removeEventListener("mousewheel",false);
    this.removeEventListener("change",false);

    this.onchange = function(event){
      manualposor_update(this);
    }

    //bind new
    this.onmousewheel = function(event){

      // not used
      shiftKey = (event.shiftKey==1);

      var delta = 0;
      if (!event) event = window.event; // IE
      if (event.wheelDelta) { //IE+Opera
        delta = event.wheelDelta/120;
        if (window.opera) {
          delta = -delta;
        }
      } else if (event.detail) { // Mozilla
        delta = -event.detail;
      }

      //add
      if (delta){

        var speed = 0;
        var preci = 0;

        // degrees?
        if($(this).hasClass("mpr_rot")){
          speed = parseFloat($("#mpr_step_d").val());
          preci = 2;
        }else{
          speed = parseFloat($("#mpr_step_m").val());
          preci = 3;
        }

        var tmpval = parseFloat($(this).val());
        newval = tmpval + (delta>0?speed:-speed);
        $(this).val(newval.toFixed(preci));

        manualposor_update(this);

      }

    }
  });

}

function manualposor_update(elem){

  var tmp_pp = $(elem).parent().parent();
  var tmpname = tmp_pp.find(".mpr_name").html();
  var tmptransform = $("inline[name=x3d_"+tmpname+"]").parent().parent();

  var dp_rw = {
    x: parseFloat(tmp_pp.find(".mpr_x").val()),
    y: parseFloat(tmp_pp.find(".mpr_y").val()),
    z: parseFloat(tmp_pp.find(".mpr_z").val())
  };

  var distance = Math.sqrt(dp_rw.x*dp_rw.x+dp_rw.z*dp_rw.z);
  var angle = 180/Math.PI*Math.atan2(dp_rw.x,-dp_rw.z);

  var dp_r = x3dom_real_to_scene(dp_rw.x,dp_rw.y,dp_rw.z);
  var new_tra = [dp_r.x,dp_r.y,dp_r.z].join(",");

  var heading = tmp_pp.find(".mpr_h").val()*Math.PI/180;
  var tilt = tmp_pp.find(".mpr_t").val()*Math.PI/180;
  var roll = tmp_pp.find(".mpr_r").val()*Math.PI/180;

  var heading = tmp_pp.find(".mpr_h").val()*Math.PI/180;
  var tilt = tmp_pp.find(".mpr_t").val()*Math.PI/180;
  var roll = tmp_pp.find(".mpr_r").val()*Math.PI/180;

  // update object
  var initial_coordinates = [Data.camera.latitude,Data.camera.longitude];
  var p0 = new L.LatLng(initial_coordinates[0],initial_coordinates[1]);//Camera._latlng;
  var p1 = p0.CoordinatesOf(angle,distance);

  if (tmpname!=SETTINGS.path){

    Data.extra_models["x3d_"+tmpname].latitude = p1.lat.toFixed(8);
    Data.extra_models["x3d_"+tmpname].longitude = p1.lng.toFixed(8);

    Data.extra_models["x3d_"+tmpname].heading = (parseFloat(tmp_pp.find(".mpr_h").val())+360)%360;
    Data.extra_models["x3d_"+tmpname].tilt    = parseFloat(tmp_pp.find(".mpr_t").val())+90;
    Data.extra_models["x3d_"+tmpname].roll    = tmp_pp.find(".mpr_r").val();

  }
  // Heading,Tilt,Roll
  var Mh = x3dom.fields.SFMatrix4f.rotationZ(heading);
  var Mt = x3dom.fields.SFMatrix4f.rotationY(tilt);
  var Mr = x3dom.fields.SFMatrix4f.rotationX(roll);

  // proper Euler rotation
  var R = Mh.mult(Mt).mult(Mr);
  //var R = Mr.mult(Mt).mult(Mh);
  // convert to proper Euler
  var T = x3dom_toYawPitchRoll();

  var R1 = T.inverse().mult(R).mult(T);
  var R0 = Data.camera.Matrices.R0;

  //var R_diff = R1.mult(R0.inverse());
  var R_diff = R0.inverse().mult(R1);
  //var R_diff = R1;

  var Q = new x3dom.fields.Quaternion(0, 0, 1, 0);
  Q.setValue(R_diff);
  var AA = Q.toAxisAngle();
  var new_rot = AA[0].toString()+" "+AA[1];

  tmptransform.attr("rotation",new_rot);
  tmptransform.attr("translation",new_tra);

}

function manualposor_rotate_glued(){

  $(".mpr_r1[name=r1]:checked").each(function(){

    var modelname = $(this).val();
    var tmptransform = $("inline[name=x3d_"+modelname+"]").parent().parent();

    var vm = Scene.element.runtime.viewMatrix().inverse();


  });

}




















