
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
}

function parse_load_extra_model(name,version,response){

  var latitude  = parseFloat($(response).find("Camera").find("latitude").text());
  var longitude = parseFloat($(response).find("Camera").find("longitude").text());
  var altitude  = parseFloat($(response).find("Camera").find("altitude").text());

  var heading = parseFloat($(response).find("Camera").find("heading").text());
  var tilt    = parseFloat($(response).find("Camera").find("tilt").text())-90;
  var roll    = parseFloat($(response).find("Camera").find("roll").text());

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

  var R_diff = R1.mult(R0.inverse());

  var Q = new x3dom.fields.Quaternion(0, 0, 1, 0);
  Q.setValue(R_diff);
  var AA = Q.toAxisAngle();
  var rstring = AA[0].toString()+" "+AA[1];

  var x3delement = $("#x3d_id").find("scene");

  model_url = SETTINGS.basepath+"/"+name+"/"+version+"/"+name+".x3d";

  var model = $([
      '<group>',
      '  <transform rotation=\''+rstring+'\'>',
      '    <inline name="x3d_'+name+'" namespacename="x3d_'+name+'" url="'+model_url+'"></inline>',
      '  </transform>',
      '</group>'
    ].join('\n'));

  x3delement.append(model);

}