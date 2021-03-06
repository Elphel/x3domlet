var map;
var List;

var markers = [];

var selected;

var map_autofit = true;

var BLOCK_MOVEEND = false;

var mbxtoken = "";

$(function(){

    //init();
    $.ajax({
      url: "mapbox_token.txt",
      success: function(token){
        mbxtoken = token;
        init();
      },
      error: function(response){
        init();
      }
    });

});

function init(){

  parseURL();
  init_maps();
  init_help();

  var url = 'list.php?rating='+SETTINGS.rating+'&basepath='+SETTINGS.basepath;

  if (SETTINGS.showall){
    url += "?showall";
  }

  $.ajax({
    url: url,
    success: function(response){
      List = response;
      if (map_autofit) fit_map(response);
      parse_list(response);
      init_dragging();
      map.fire('moveend');
    }
  });
}

var SETTINGS = {
  'rating':5,
  'showall':false,
  'lat': 44.92980751,
  'lng': -118.25683594,
  'zoom': 7,
  'model': undefined,
  'basepath': 'models/all'
};

var Dragged = false;

function fit_map(xml){

  var coords = [];

  $(xml).find("Camera").each(function(){
    coords.push([$(this).find("latitude").text(),$(this).find("longitude").text()]);
  });

  map.fitBounds(coords);
}

function init_dragging(){

    var bigcounter = 0;

    $("#model_table img").on("load",function(){

      bigcounter++;

      if (bigcounter==markers.length){
        actual_dragging_init();
        if (SETTINGS.model!==undefined){

          find_preselected_index();
          $(".arow")[selected].click();
          place_selected_thumbnail();

        }else{
          // if not defined then do not click at '0' - this will allow to place view properly
        }

        //$(".arow")[0].click();
      }
    });

}

function find_preselected_index(){

  markers.forEach(function(c,i){
    if (c[0].name==SETTINGS.model){
      selected = i;
    }
  });

  if (selected === undefined){
    selected = 0;
  }

}

function place_selected_thumbnail(){

  var inviscounter = 0;

  markers.forEach(function(c,i){

    if (!$(".arow[index="+i+"]").is(":visible")) {
      inviscounter++;
    }

    //if(c[0].name==SETTINGS.model){
    if (i==selected){
      //$(".arow")[i].click();
      $("#model_table").css({
        top: -106*(i-inviscounter)+"px"
      });
    }
  });


}

function actual_dragging_init(){

    var list = document.getElementById('model_table');

    if (list.addEventListener) list.addEventListener('DOMMouseScroll', wheelEvent_list, false);
    list.onmousewheel = wheelEvent_list;

    var h = markers.length*100;

    $("#model_table").draggable({
        axis: "y",
        containment:[0,-h,0,h],
        drag: function(){
            Dragged = true;
        }
    });

}

// no comments
function parseURL(){
    var parameters=location.href.replace(/\?/ig,"&").split("&");
    for (var i=0;i<parameters.length;i++) parameters[i]=parameters[i].split("=");
    for (var i=1;i<parameters.length;i++) {
        switch (parameters[i][0]) {
            case "showall": SETTINGS.showall = true; break;
            case "rating":  SETTINGS.rating  = parseInt(parameters[i][1]); break;
            case "lat":     SETTINGS.lat  = parseFloat(parameters[i][1]); map_autofit = false; break;
            case "lng":     SETTINGS.lng  = parseFloat(parameters[i][1]); map_autofit = false; break;
            case "zoom":    SETTINGS.zoom = parseFloat(parameters[i][1]); break;
            // selected model
            case "model":    SETTINGS.model = parameters[i][1]; break;
            case "basepath": SETTINGS.basepath = parameters[i][1]; break;
        }
    }
}

function update_links(){

  // a. update links for selected only?
  // b. update all - won't take long

  // List
  $('.arow').each(function(){

    var arow = this;

    $(List).find('model[name="'+$(arow).attr("title")+'"]').each(function(){

      var name = $(this).attr("name");
      var group = $(this).attr("group");

      var vlist = "";
      var latest_version = "";
      $(this).find("version").each(function(i,v){
          var comments = $(this).find("comments").text();

          var center = map.getCenter();
          var zoom = map.getZoom();


          //var link_url = "viewer.html?path="+name+"&ver="+$(this).attr("name")+"&rating="+SETTINGS.rating;
          //link_url += "&basepath="+SETTINGS.basepath;
          //link_url += "&lat="+center.lat.toFixed(8)+"&lng="+center.lng.toFixed(8)+"&zoom="+zoom;

          var link_url = [
            "viewer.html",
            "?basepath="+SETTINGS.basepath,
            "&group="+group,
            "&path="+name,
            "&ver="+$(this).attr("name"),
            "&rating="+SETTINGS.rating,
            "&lat="+center.lat.toFixed(8),
            "&lng="+center.lng.toFixed(8),
            "&zoom="+zoom
          ].join("");


          var link = "<a title='"+comments+"' href='"+link_url+"'>"+$(this).attr("name")+"</a>,&nbsp;";
          vlist += link;
          latest_version = $(this).attr("name");
      });
      vlist = vlist.slice(0,-7);

      $(arow).attr("vlist",vlist);
      markers[$(arow).attr("index")][0].vlist = vlist;
      markers[$(arow).attr("index")][0].latest_version = latest_version;
      var tmp = popup_message(markers[$(arow).attr("index")]);
      markers[$(arow).attr("index")][0]._popup.setContent(tmp);
    });

  });

}

function parse_list(res){

    var index = 0;

    $(res).find("model").each(function(m_index,m_item){

        var row = $("<tr class='arow'>");
        var name = $(this).attr("name");
        var group = $(this).attr("group");
        var thumb = $(this).attr("thumb");

        if (thumb.length!=""){
            srcpath = SETTINGS.basepath+"/"+group+"/"+name+"/thumb.jpeg";
        }else{
            srcpath ="js/images/thumb_na.jpeg";
        }

        row.append("<td class='acell' title='"+name+"' ><div><img src='"+srcpath+"'></img></div></td>");
        row.attr('title',name);

        //row.append("<td class='acell' valign='top'>"+name+"</td>");

        var vlist = "";
        $(this).find("version").each(function(i,v){

            var comments = $(this).find("comments").text();

            var link_url = "viewer.html?path="+name+"&ver="+$(this).attr("name")+"&rating="+SETTINGS.rating;
            link_url += "&basepath="+SETTINGS.basepath;

            var center = map.getCenter();
            var zoom = map.getZoom();

            link_url += "&lat="+center.lat.toFixed(8)+"&lng="+center.lng.toFixed(8)+"&zoom="+zoom;

            var link = "<a title='"+comments+"' href='"+link_url+"'>"+$(this).attr("name")+"</a>,&nbsp;";

            vlist += link;

        });

        vlist = vlist.slice(0,-7);

        //row.append("<td class='acell' valign='top'><div>"+vlist+"</div></td>");

        row.attr("index",index);
        row.attr("vlist",vlist);

        register_row_events(row);

        $("#model_table").append(row);



        //place markers
        var subindex = 0;
        $(this).find("Camera").each(function(){

            var lat = $(this).find("latitude").text();
            var lng = $(this).find("longitude").text();

            var marker = L.marker([lat, lng]).addTo(map);
            marker.bindPopup(name+": "+vlist,{direction:"top"});

            marker.index = index;
            marker.name = name;
            marker.group = group;
            marker.vlist = vlist;
            marker.lat = lat;
            marker.lng = lng;

            marker.on('click',function(){
              //console.log("clicked"+this.index);
              // find all markers under this marker
              $(".arow[index="+this.index+"]").click();
              //place_selected_thumbnail();
            });

            if (markers[index]==undefined) {
              markers[index] = [];
            }
            markers[index][subindex] = marker;
            subindex++;
        });


        index++;
    });

}

function popup_message(marker){

  var center = map.getCenter();
  var zoom = map.getZoom();

  var link_url = [
    "viewer.html",
    "?basepath="+SETTINGS.basepath,
    "&group="+marker[0].group,
    "&path="+marker[0].name,
    "&ver="+marker[0].latest_version,
    "&rating="+SETTINGS.rating,
    "&lat="+center.lat.toFixed(8),
    "&lng="+center.lng.toFixed(8),
    "&zoom="+zoom
  ].join("");

  var msg = "<div><a href='"+link_url+"'><img class='pimg' alt='n/a' src='"+SETTINGS.basepath+"/"+marker[0].group+"/"+marker[0].name+"/thumb.jpeg' index='"+marker[0].index+"' ></img></a></div>";

  markers.forEach(function(c,i){
    if (marker[0].lat==c[0].lat){
      if (marker[0].lng==c[0].lng){
        msg += "<div class='plist' index='"+c[0].index+"' >"+c[0].name+": "+c[0].vlist+"</div>\n";
      }
    }
  });

  return msg;
}

function register_row_events(elem){

    $(elem).on("dblclick",function(e){

      console.log("double click");
      // put double click actions here

      var index = $(this).attr("index");
      var list = $(List).find("model");
      var item = list[index];
      var lat = $($(item).find("latitude")[0]).text();
      var lng = $($(item).find("longitude")[0]).text();
      map.panTo(new L.LatLng(lat, lng));
      $(this).click();

    });

    $(elem).on("click",function(e){

        if (!Dragged){

          $(".arow").css({
              background: "black"
          });
          //center map;
          $(this).css({
              background: "rgba(100,200,255,1)"
          });

          var index = $(this).attr("index");
          var vlist = $(this).attr("vlist");
          var name = $(this).find("td").attr("title");
          var list = $(List).find("model");
          var item = list[index];

          var lat = $($(item).find("latitude")[0]).text();
          var lng = $($(item).find("longitude")[0]).text();

          BLOCK_MOVEEND = true;

          if (markers[index]!=undefined){

            selected = index;

            // find all markers under this marker
            var tmp = popup_message(markers[index]);
            markers[index][0]._popup.setContent(tmp);
            // autopan make popup always visible
            markers[index][0]._popup.options.autoPan = false;
            markers[index][0].openPopup();

            $(".plist").each(function(i,c){
              if (parseInt($(c).attr("index"))==index){
                $(c).css({
                  background: "rgba(220,220,230,1)"
                });
                $(c).addClass('plist_selected');
              }
            });

            $(".plist").on("mouseover",function(){

              $(".plist").each(function(i,c){
                if (!$(c).hasClass('plist_selected')){
                  $(c).css({background: "white"});
                }else{
                  $(c).css({background: "rgba(220,220,230,1)"});
                }
              });

              /*
              $(".plist").css({
                background: "white"
              });
              */

              $(this).css({
                background: "rgba(230,230,230,1)"
              });

              var j = $(this).attr("index");
              $(".pimg").attr("src",SETTINGS.basepath+"/"+markers[j][0].group+"/"+markers[j][0].name+"/thumb.jpeg");

            });

            $(".plist").on("mouseout",function(){
              $(".plist").each(function(i,c){
                if (!$(c).hasClass('plist_selected')){
                  $(c).css({background: "white"});
                }else{
                  $(c).css({background: "rgba(220,220,230,1)"});
                }
              });
            });

          }

        }
        Dragged = false;

    });

}

// maps
function init_maps(){

  // https: also suppported.
  var Esri_WorldImagery = L.tileLayer(
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    {
      maxZoom: 21,
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
    }
  );

  var googleSat = L.tileLayer(
    'https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
    {
      maxZoom: 21,
      attribution: 'Google Imagery',
      subdomains:['mt0','mt1','mt2','mt3'],
    }
  );

  var OSMTiles = L.tileLayer('http://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
    {
      maxZoom: 21,
      attribution: 'Map data and images &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>'
    }
  );

  var mapboxattr = '<a href="https://www.mapbox.com/about/maps/" target="_blank">© Mapbox</a> <a href="https://openstreetmap.org/about/" target="_blank">© OpenStreetMap</a>';

  var mbxurl1   = "https://api.mapbox.com/v4/mapbox.satellite/{z}/{x}/{y}@2x.png?access_token="+mbxtoken;
  var mbxurl2   = "https://api.mapbox.com/v4/mapbox.pencil/{z}/{x}/{y}@2x.png?access_token="+mbxtoken;

  var MBXTiles1 = L.tileLayer(mbxurl1,
    {
      maxZoom: 21,
      attribution: mapboxattr
    }
  );

  var MBXTiles2 = L.tileLayer(mbxurl2,
    {
      maxZoom: 21,
      attribution: mapboxattr
    }
  );

  if (mbxtoken==""){
    selected_layer = googleSat;

    var baseMaps = {
      "Esri world imagery": Esri_WorldImagery,
      "Google": googleSat,
      "Open Street Map": OSMTiles
    };

  }else{
    selected_layer = MBXTiles1;

    var baseMaps = {
      "Mapbox 1": MBXTiles1,
      "Mapbox 2": MBXTiles2,
      "Esri world imagery": Esri_WorldImagery,
      "Google": googleSat,
      "Open Street Map": OSMTiles
    };

  }

  map = L.map('leaflet_map',{
    layers:[selected_layer],
    zoomControl:false,
  }).setView([SETTINGS.lat, SETTINGS.lng], SETTINGS.zoom);

  new L.Control.Zoom({ position: 'topright' }).addTo(map);

  //Esri_WorldImagery.addTo(map);
  //googleSat.addTo(map);

  //custom control:
  //http://www.coffeegnome.net/control-button-leaflet/

  L.control.layers(baseMaps).addTo(map);

  map.on('moveend', function() {

    var bounds = map.getBounds();

    $(".arow").each(function(i,c){

      var index = $(this).attr("index");

      if (
        (markers[index][0].lat>bounds._northEast.lat)||
        (markers[index][0].lat<bounds._southWest.lat)||
        (markers[index][0].lng>bounds._northEast.lng)||
        (markers[index][0].lng<bounds._southWest.lng)
      ){
        $(this).hide();
      }else{
        $(this).show();
      }

    });

    //place_selected_thumbnail();

    var center = map.getCenter();
    var zoom = map.getZoom();

    window.history.pushState("", "x3d models index", "?lat="+center.lat.toFixed(8)+"&lng="+center.lng.toFixed(8)+"&zoom="+zoom+"&rating="+SETTINGS.rating+"&basepath="+SETTINGS.basepath);

    update_links();

    if (!BLOCK_MOVEEND){

      $("#model_table").css({
        top: "0px"
      });

    }else{
      BLOCK_MOVEEND = false;
    }

  });

  /*
   * moveend is called after zoomend anyways
   */
  /*
  map.on('zoomend', function() {
     console.log("zoomend "+map.getBounds());
  });
  */

}

function init_help(){

  var help = $("#help_content");
  help.hide();

  $("#help_button").on('click',function(){
    help.show();
  });

  help.on('click',function(){
    help.hide();
  });

}

function wheelEvent_list(event){
      shiftKey= (event.shiftKey==1);
      var delta = 0;
      if (!event) event = window.event; // IE
      if (event.wheelDelta) { //IE+Opera
        delta = event.wheelDelta/120;
	if (window.opera) delta = -delta;
      }else if (event.detail) { // Mozilla
        delta = -event.detail;
      }
      if (delta){
        handleWheel_list(event,delta,shiftKey);
      }
      if (event.preventDefault){
        event.preventDefault();
      }
      event.returnValue = false;
}

function handleWheel_list(event,delta,move) {
      var tmp = $("#model_table").position().top;

      var tmp2 = +tmp+20*delta;

      //if (tmp2 > 0) tmp2=0;
      //if (tmp2 < -$("#model_table").height() ) tmp2=-$("#model_table").height();

      $("#model_table").css({top:tmp2+'px'});

}

