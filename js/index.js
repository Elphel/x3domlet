var map;
var List;

var markers = [];

$(function(){

    //init();
    
    init_maps();
    
    $.ajax({
        
        url: "list.php",
        success: function(response){

            List = response;
            parse_list(response);
            $(".arow")[0].click();
            
        }
        
    });
    
});

function parse_list(res){
    
    var index = 0;
    
    $(res).find("model").each(function(){

        var row = $("<tr class='arow'>");
        var name = $(this).attr("name");
        var thumb = $(this).attr("thumb");

        if (thumb.length!=""){
            row.append("<td class='acell' valign='top'><img alt='n/a' src='models/"+name+"/thumb.jpeg'></img></td>");
        }else{
            row.append("<td class='acell' valign='top' align='center'>&ndash;</td>");
        }

        row.append("<td class='acell' valign='top'>"+name+"</td>");

        var vlist = "";
        $(this).find("version").each(function(i,v){
            
            var comments = $(this).find("comments").text();
            
            var link_url = "test.html?path="+name+"&ver="+$(this).attr("name");
            var link = "<a title='"+comments+"' href='"+link_url+"'>"+$(this).attr("name")+"</a>,&nbsp;";
            
            vlist += link;

        });
        
        vlist = vlist.slice(0,-7);
        
        row.append("<td class='acell' valign='top'><div>"+vlist+"</div></td>");
        
        row.attr("index",index);
        
        register_row_events(row);
        
        $("#model_table").append(row);
        
        //place markers
        $(this).find("Camera").each(function(){
            
            var lat = $(this).find("latitude").text();
            var lng = $(this).find("longitude").text();
            
            if (markers[lat+lng]==undefined){

                var marker = L.marker([lat, lng]).addTo(map);
                marker.bindPopup(name+": "+vlist,{
                    direction:"top",
                });
            
                markers[lat+lng] = marker;
                
            }else{
                
                console.log(markers[lat+lng]);
                
                var content = markers[lat+lng]._popup.getContent();
                markers[lat+lng]._popup.setContent(content+"<br/>"+name+": "+vlist);

            }
            
        });
        
        
        index++;
    });
    
}

function register_row_events(elem){
    
    $(elem).on("click",function(){

        $(".arow").css({
            background: "white"
        });
        //center map;
        $(this).css({
            background: "rgba(100,200,255,0.7)"
        });
        
        var index = $(this).attr("index");
        var list = $(List).find("model");
        var item = list[index];
        
        var lat = $($(item).find("latitude")[0]).text();
        var lng = $($(item).find("longitude")[0]).text();
        
        map.panTo(new L.LatLng(lat, lng));
        
        if (markers[lat+lng]!=undefined){
            markers[lat+lng].openPopup();
        }
        
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
      attribution: 'Many thanks to Google for our happy childhood',
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


