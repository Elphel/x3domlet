
var theLastMovedMarker = null;

function x3dom_delta_markers(){

  // what's the last dragged marker? (over map?)
  // see leaflet_init.js
  var index = theLastMovedMarker;

  var marker = Data.markers[index];

  //console.log(marker.latitude+", "+marker.longitude);

  var Camera = Map.marker;

  var p_mark_ll = new L.LatLng(marker.latitude, marker.longitude);
  var p_cam_ll  = Camera._latlng;

  var p_w = x3dom_delta_map2scene(p_cam_ll, p_mark_ll);

  $("#deltasphere").remove();
  $("#deltalink").remove();

  var transl = [p_w.x,p_w.y,p_w.z].join(",");

  var html = [
    '<group id="deltasphere" class="deltasphere">',
    '  <switch whichChoice="0">',
    '    <transform translation="'+transl+'" >',
    '      <shape>',
    '        <appearance>',
    '          <material diffuseColor="green" transparency="0.5"></material>',
    '        </appearance>',
    '        <sphere radius="'+(x3dom_markersize()/2)+'"></sphere>',
    '      </shape>',
    '    </transform>',
    '  </switch>',
    '</group>'
  ].join('\n');

  var sphere_element = $(html);
  $('scene',Scene.element).append(sphere_element);

  //$(".my-markers").find("material").attr("transparency","0.5");

  var coords = [
    p_w.x+" "+p_w.y+" "+p_w.z,
    marker.x+" "+marker.y+" "+marker.z,
  ].join(" ");

  var html = [
    '<group id="deltalink" class="deltalink">',
    '  <switch whichChoice="0">',
    '    <transform>',
    '      <shape>',
    '        <appearance>',
    '          <material emissiveColor="white" transparency="0.0"></material>',
    '        </appearance>',
    '        <lineset vertexCount="2" solid="true" ccw="true" lit="true">',
    '          <coordinate point="'+coords+'"></coordinate>',
    '        </lineset>',
    '      </shape>',
    '    </transform>',
    '  </switch>',
    '</group>'
  ].join('\n');

  var sphere_element = $(html);
  $('scene',Scene.element).append(sphere_element);


}
