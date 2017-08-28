var map;
var List;

var markers = [];

$(function(){

    //init();
    parseURL();
    init_maps();

    var url = 'list.php';

    if (SETTINGS.showall){
      url += "?showall";
    }

    $.ajax({

        url: url,
        success: function(response){

            List = response;
            parse_list(response);
            init_dragging();

        }

    });

});

var SETTINGS = {
  'showall':false
};

var Dragged = false;

function init_dragging(){

    var bigcounter = 0;
    $("#model_table img").on("load",function(){
      bigcounter++;
      if (bigcounter==markers.length){
        actual_dragging_init()
        $(".arow")[0].click();
      }
    });

}

function actual_dragging_init(){

    var list = document.getElementById('model_table');

    if (list.addEventListener) list.addEventListener('DOMMouseScroll', wheelEvent_list, false);
    list.onmousewheel = wheelEvent_list;

    $("#model_table").draggable({
        axis: "y",
        containment:[0,-$("#model_table").height(),0,$("#model_table").height()],
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
        }
    }
}

function parse_list(res){

    var index = 0;

    $(res).find("model").each(function(){

        var row = $("<tr class='arow'>");
        var name = $(this).attr("name");
        var thumb = $(this).attr("thumb");

        if (thumb.length!=""){
            srcpath ="models/"+name+"/thumb.jpeg";
        }else{
            srcpath ="js/images/thumb_na.jpeg";
        }

        row.append("<td class='acell' title='"+name+"' ><div><img src='"+srcpath+"'></img></div></td>");

        //row.append("<td class='acell' valign='top'>"+name+"</td>");

        var vlist = "";
        $(this).find("version").each(function(i,v){

            var comments = $(this).find("comments").text();

            var link_url = "viewer.html?path="+name+"&ver="+$(this).attr("name");
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
            marker.vlist = vlist;
            marker.lat = lat;
            marker.lng = lng;

            marker.on('click',function(){
              //console.log("clicked"+this.index);
              // find all markers under this marker
              $(".arow[index="+this.index+"]").click();
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

  var msg = "<div><img class='pimg' alt='n/a' src='models/"+marker[0].name+"/thumb.jpeg' index='"+marker[0].index+"' ></img></div>";

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

          map.panTo(new L.LatLng(lat, lng));

          if (markers[index]!=undefined){
            // find all markers under this marker
            var tmp = popup_message(markers[index]);
            markers[index][0]._popup.setContent(tmp);
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
              $(".pimg").attr("src","models/"+markers[j][0].name+"/thumb.jpeg");

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

  map = L.map('leaflet_map',{
    layers:[googleSat],
    zoomControl:false,
  }).setView([40.7233861, -111.9328843], 12);

  new L.Control.Zoom({ position: 'topright' }).addTo(map);

  var baseMaps = {
    "Esri world imagery": Esri_WorldImagery,
    "Google": googleSat,
    "Open Street Map": OSMTiles
  };

  //Esri_WorldImagery.addTo(map);
  //googleSat.addTo(map);

  //custom control:
  //http://www.coffeegnome.net/control-button-leaflet/

  L.control.layers(baseMaps).addTo(map);

}

function wheelEvent_list(event){
      shiftKey= (event.shiftKey==1);
      var delta = 0;
      if (!event) event = window.event; // IE
      if (event.wheelDelta) { //IE+Opera
	      delta = event.wheelDelta/120;
	      if (window.opera) delta = -delta;
      } else if (event.detail) { // Mozilla
	      delta = -event.detail;
      }
      if (delta)
	      handleWheel_list(event,delta,shiftKey);
      if (event.preventDefault)
	      event.preventDefault();
      event.returnValue = false;
}

function handleWheel_list(event,delta,move) {
      var tmp = $("#model_table").position().top;

      var tmp2 = +tmp+20*delta;

      //if (tmp2 > 0) tmp2=0;
      //if (tmp2 < -$("#model_table").height() ) tmp2=-$("#model_table").height();

      $("#model_table").css({top:tmp2+'px'});

}

