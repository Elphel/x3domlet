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

      //mpr_marks_load();

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
      //'   <th class=\'mpr_name\' title=\'hide on shift key\'>hide</th>',
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
      '  <div><button id=\'mpr_save\'>save kmls</button></div>',
      '  <div><button id=\'mpr_save_marks\' title=\'save to file\' >save marks</button></div>',
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

    /*
    $("#window-extrainfo").on('mouseenter',function(){
      $(this).focus();
    });
    */

    /*
    $("#window-extrainfo").on('mouseleave',function(){
      $(this).trigger('keyup');
      //$(this).focus();
    });
    */

    /*
    $("#window-extrainfo").on('keydown',function(e){
      if(e.key=="Shift"){
        $(this).find(".mpr_modelname").each(function(){
          var modelname = $(this).html();
          // mpr_hide disabled

          //var checkbox = $(this).parent().find(".mpr_hide");
          //if (checkbox.prop("checked")){
          //  $("inline[name=x3d_"+modelname+"]").parent().parent().parent().attr("whichChoice",-1);
          //}

        });
      }
      e.stopPropagation();

    });
    */

    /*
    $("#window-extrainfo").on('keyup',function(e){
      $(this).find(".mpr_modelname").each(function(){
        var modelname = $(this).html();
        $("inline[name=x3d_"+modelname+"]").parent().parent().parent().attr("whichChoice",0);
      });
    });
    */

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

      MPR_PO = null;

      $("inline").each(function(){
        $(this).parent().parent().parent().attr("whichChoice",0);
      });

    });

    $("#mpr_save_marks").on('click',function(){

      //var str = mpr_markers_print();
      //console.log(str);

      var str = mpr_markers_to_xml();
      console.log(str);

      $.ajax({
        url: "store_marks.php?model="+SETTINGS.path,
        type: "POST",
        data: str,
        async: true,
        complete: function(response){
          var res = parseInt(response.responseText);
          if (res!=0){
            ui_showMessage("window-error","Error saving marks, code: "+res);
          }
        },
        contentType: "text/xml; charset=\"utf-8\""
      });

    });

}

function mpr_marks_load(){

  $.ajax({
    url: [SETTINGS.basepath,SETTINGS.path,"marks.xml"].join("/"),
    success: function(response){

      $(response).find("record").each(function(){

        var uid = $(this).attr("uid");
        var marks = $(this).find("mark");

        var name1 = $(marks[0]).attr("model");
        var p1    = $(marks[0]).attr("position").split(",");
        var p1l   = new x3dom.fields.SFVec3f(p1[0],p1[1],p1[2]);

        var name2 = $(marks[1]).attr("model");
        var p2    = $(marks[1]).attr("position").split(",");
        var p2l   = new x3dom.fields.SFVec3f(p2[0],p2[1],p2[2]);

        // local position is constant
        Data.mpr.markers.push({
          uid: uid,
          m1:{
            name: name1,
            position: p1l
          },
          m2:{
            name: name2,
            position: p2l
          }
        });

      });

      MPR_MARKS_LOADED = true;

    },
    error: function(response){
      MPR_MARKS_LOADED = true;
    }
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

  // now there are mpr_marks
  for(var i=0;i<Data.mpr.markers.length;i++){
    var mark = Data.mpr.markers[i];
    //check if already placed
    if ($('.mprmarker[uid='+mark.uid+']').length==0){
      var inline1 = $('inline[name=x3d_'+mark.m1.name+']');
      var inline2 = $('inline[name=x3d_'+mark.m2.name+']');
      // now check if both models are loaded
      if((inline1.length!=0)&&(inline2.length!=0)){

        // place now
        var p1 = mark.m1.position;
        var p2 = mark.m2.position;

        var d = x3dom_3d_distance(p1.x,p1.y,p1.z,true);
        var size = 1*SETTINGS.markersize_k*d;
        var color = x3dom_autocolor();

        var uid = mark.uid;

        var p1l = p1;
        var p2l = p2;

        var target1 = inline1;
        var target2 = inline2;

        var name1 = mark.m1.name;
        var name2 = mark.m2.name;

        var d = x3dom_3d_distance(p1.x,p1.y,p1.z,true);
        var size = 1*SETTINGS.markersize_k*d;

        new MPRMarker({target:target1.parent(), uid:uid, model:name1, position:p1l, size: size, color: color});
        new MPRMarker({target:target2.parent(), uid:uid, model:name2, position:p2l, size: size, color: color});

      }
    }

  }

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
      '  <td><input type=\'radio\' class=\'mpr_r1\' name=\'r1\' value=\''+name+'\'></td>',
      '  <td><input type=\'radio\' class=\'mpr_r2\' name=\'r2\' value=\''+name+'\'></td>',
      //'  <td><input type=\'checkbox\' class=\'mpr_hide\'></td>',
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
  $(".mpr_r1[name=r1]").off('change').on('change',function(){
    manualposor_init_mode();
  });

  $(".mpr_r2[name=r2]").off('change').on('change',function(){
    manualposor_init_mode();
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

  manualposor_init_mode();

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

var MPR_PO;

function manualposor_rotate_glued(){

  var r1 = $(".mpr_r1[name=r1]:checked");

  if (r1.length!=0){

    //console.log(MPR_PO);

    // update inputs

    var modelname = r1.val();

    var tmptransform = $("inline[name=x3d_"+modelname+"]").parent().parent();
    var vm = Scene.element.runtime.viewMatrix().inverse();

    var dR = vm.mult(MPR_PO.viewmatrix.inverse());

    var q = x3dom.fields.Quaternion.parseAxisAngle(MPR_PO.rotation);
    var m = q.toMatrix();
    m = dR.mult(m);
    q.setValue(m);
    var AA = q.toAxisAngle();
    var new_rot = AA[0].toString()+" "+AA[1];

    var tra1 = MPR_PO.translation.split(",");
    tra1 = new x3dom.fields.SFVec3f(tra1[0],tra1[1],tra1[2]);

    var rv1 = MPR_PO.viewmatrix.e3();
    var rv2 = vm.e3();

    var tra2 = rv2.add(dR.multMatrixVec(tra1.subtract(rv1)));

    //console.log("check 2: "+tra2.toString());

    //var new_tra = dR.multMatrixVec(tra);
    new_tra = [tra2.x,tra2.y,tra2.z].join(",");

    //console.log(new_tra);

    tmptransform.attr("rotation",new_rot);
    //tmptransform.attr("translation",new_tra);
    tmptransform.attr("translation",new_tra);

  }

}

function manualposor_init_mode(){

  console.log("mpr mode refresh");

  // hide all
  $(".mpr_r1").each(function(){
    var modelname = $(this).val();
    $("inline[name=x3d_"+modelname+"]").parent().parent().parent().attr("whichChoice",-1);
  });

  //show selected only
  var r1 = $(".mpr_r1[name=r1]:checked");
  var r2 = $(".mpr_r2[name=r2]:checked");

  if (r1.length!=0){

    var in_t_t = $("inline[name=x3d_"+r1.val()+"]").parent().parent()
    in_t_t.parent().attr("whichChoice",0);

    var vm = Scene.element.runtime.viewMatrix().inverse();

    // remember transform
    MPR_PO = {
      rotation: in_t_t.attr('rotation'),
      translation: in_t_t.attr('translation'),
      viewmatrix: vm
    }
  }

  if (r2.length!=0){
    $("inline[name=x3d_"+r2.val()+"]").parent().parent().parent().attr("whichChoice",0);
  }

  // show all
  if ((r1.length==0)&&(r2.length==0)){
    $(".mpr_r1").each(function(){
      var modelname = $(this).val();
      $("inline[name=x3d_"+modelname+"]").parent().parent().parent().attr("whichChoice",0);
    });
  }

}

var MPR_BS = false;

function manualposor_blink(){

  var r1 = $(".mpr_r1[name=r1]:checked");
  var r2 = $(".mpr_r2[name=r2]:checked");

  MPR_BS = !MPR_BS;

  if (MPR_BS){
    if (r2.length!=0){
      $("inline[name=x3d_"+r2.val()+"]").parent().parent().parent().attr("whichChoice",-1);
    }
  }else{
    if (r1.length!=0){
      $("inline[name=x3d_"+r1.val()+"]").parent().parent().parent().attr("whichChoice",-1);
    }
  }
}

function manualposor_unblink(){

  var r1 = $(".mpr_r1[name=r1]:checked");
  var r2 = $(".mpr_r2[name=r2]:checked");

  if (r1.length!=0){
    $("inline[name=x3d_"+r1.val()+"]").parent().parent().parent().attr("whichChoice",0);
  }

  if (r2.length!=0){
    $("inline[name=x3d_"+r2.val()+"]").parent().parent().parent().attr("whichChoice",0);
  }

}

function manualposor_init_shootrays(x,y){

  MPR.counter = 1;
  MPR.x = x;
  MPR.y = y;

}


function manualposor_shootrays(){

  var r1 = $(".mpr_r1[name=r1]:checked");
  var r2 = $(".mpr_r2[name=r2]:checked");

  if (r1.length==0||r2.length==0){
    MPR.counter = 0;
    return;
  }

  // need to delete
  if (MPR.counter==1){

    $("inline[name=x3d_"+r2.val()+"]").parent().parent().parent().attr("whichChoice",-1);

  }else if (MPR.counter==2){

    MPR.ray1 = x3dom_shootRay_fixed(MPR.x,MPR.y);
    if(MPR.ray1==-1){
      MPR.counter=0;
      ui_showMessage("window-error","ray didn't hit a model (models must overlap)");
    }else{
      $("inline[name=x3d_"+r1.val()+"]").parent().parent().parent().attr("whichChoice",-1);
    }

  }else if (MPR.counter==3){

    MPR.ray2 = x3dom_shootRay_fixed(MPR.x,MPR.y);
    MPR.counter=0;

    // register and place marker pair
    if(MPR.ray2!=-1){
      manualposor_newMarksPair(MPR.ray1,MPR.ray2);
    }else{
      ui_showMessage("window-error","ray didn't hit a model (models must overlap)");
    }

  }

  // force enterFrame event
  if(MPR.counter!=0){

    setTimeout(function(){
      $("inline[name=x3d_"+r1.val()+"]").parent().parent().parent().attr("whichChoice",0);
      $("inline[name=x3d_"+r2.val()+"]").parent().parent().parent().attr("whichChoice",0);
    },10);

    MPR.counter++;

  }

}

// register and place marker pair
function manualposor_newMarksPair(ray1,ray2){

  console.log("new pair");

  // already with x3d_
  var name1 = ray1.pickObject.id.split("__")[0].substr(4);
  var name2 = ray2.pickObject.id.split("__")[0].substr(4);

  // uid matches uid in global array
  var uid = "s"+Date.now();

  var p1 = ray1.pickPosition;
  var p2 = ray2.pickPosition;

  // force relative size (relative to p1 point)
  var d = x3dom_3d_distance(p1.x,p1.y,p1.z,true);
  var size = 1*SETTINGS.markersize_k*d;
  var color = x3dom_autocolor();

  var target1 = $("inline[name=x3d_"+name1+"]");
  var m = x3dom_getTransorm_from_2_parents(target1);
  var p1l = m.inverse().multMatrixVec(p1);

  var target2 = $("inline[name=x3d_"+name2+"]");
  m = x3dom_getTransorm_from_2_parents(target2);
  var p2l = m.inverse().multMatrixVec(p2);

  new MPRMarker({target:target1.parent(), uid:uid, model:name1, position:p1l, size: size, color: color});
  new MPRMarker({target:target2.parent(), uid:uid, model:name2, position:p2l, size: size, color: color});

  // local position is constant
  Data.mpr.markers.push({
    uid: uid,
    m1:{
      name: name1,
      position: p1l
    },
    m2:{
      name: name2,
      position: p2l
    }
  });

}

var MPRMarker = function(options){

  this.uid      = options.uid;
  this.target   = options.target;
  this.name     = options.name;
  // position
  this.p     = options.position;
  this.color = options.color;

  this.size = options.size;

  this.size_str  = [this.size,this.size,this.size].join(",");

  this.init();

}

MPRMarker.prototype.init = function(){

  var html = $([
    '<group>',
    '  <switch whichChoice="0">',
    //'    <transform translation="'+(this.p.x-this.size/2)+' '+(this.p.y-this.size/2)+' '+(this.p.z-this.size/2)+'" rotation="0 0 0 0">',
    '    <transform translation="'+(this.p.x)+' '+(this.p.y)+' '+(this.p.z)+'" rotation="0 0 0 0">',
    '      <shape class="mprmarker" uid="'+this.uid+'">',
    '        <appearance>',
    '          <material diffuseColor="'+this.color+'" transparency="0.0" myColor="'+this.color+'"></material>',
    '        </appearance>',
    '        <box DEF="box" size="'+this.size_str+'" />',
    '      </shape>',
    '    </transform>',
    '  </switch>',
    '</group>'
  ].join('\n'));

  $(this.target).append(html);

  html.find("shape").on('click',function(){
    var uid = $(this).attr("uid");
    $(".mprmarker[uid="+uid+"]").each(function(){
      $(this).parent().parent().parent().remove();
    });

    // remove from Data.mpr.markers
    mpr_marker_remove_by_uid(uid);

  });

}

function mpr_marker_remove_by_uid(uid){
    var c;
    for(var i=0;i<Data.mpr.markers.length;i++){
      c = Data.mpr.markers[i];
      if(c.uid==uid){
        Data.mpr.markers.splice(i,1);
        break;
      }
    }
}

function mpr_markers_print(){

  var str = [];

  for(var i=0;i<Data.mpr.markers.length;i++){

    var rec = Data.mpr.markers[i];

    str[i] = [
      '\n{',
      '  uid: \''+rec.uid+'\',',
      '  m1: {',
      '        name: \''+rec.m1.name+'\',',
      '        position: { x: '+rec.m1.position.x+', y: '+rec.m1.position.y+', z: '+rec.m1.position.z+' }',
      '      },',
      '  m2: {',
      '        name: \''+rec.m2.name+'\',',
      '        position: { x: '+rec.m2.position.x+', y: '+rec.m2.position.y+', z: '+rec.m2.position.z+' }',
      '      }',
      '}'
    ].join("\n");

  }

  str = "["+str.join(",")+"\n]";

  return str;

}

function mpr_markers_to_xml(){

  var str = [];

  for(var i=0;i<Data.mpr.markers.length;i++){

    var rec = Data.mpr.markers[i];

    str[i] = [
      '  <record uid=\''+rec.uid+'\'>',
      '    <mark model=\''+rec.m1.name+'\' position=\''+rec.m1.position.x+','+rec.m1.position.y+','+rec.m1.position.z+'\'></mark>',
      '    <mark model=\''+rec.m2.name+'\' position=\''+rec.m2.position.x+','+rec.m2.position.y+','+rec.m2.position.z+'\'></mark>',
      '  </record>'
    ].join("\n");

  }

  str = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<Document>',
    str.join('\n'),
    '</Document>'
  ].join('\n');

  return str;

}





