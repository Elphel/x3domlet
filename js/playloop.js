/*

  Copyright (C) 2017 Elphel Inc.

  License: GPL-3.0

  https://www.elphel.com

*/
/**
 * @file playloop.js
 * @brief play loop
 * @copyright Copyright (C) 2017 Elphel Inc.
 * @author Oleg <oleg@elphel.com>
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

var SETTINGS = {
    'path'   : "models/1497599073_599932/x3d605/1497599073_599932",
    'sufx' : "D0.0.jpeg",
    'n'      : 4,
    'interval' : 100,
    'order': [0,1,3,2]
}


function parseURL(){

    var parameters=location.href.replace(/\?/ig,"&").split("&");
    for (var i=0;i<parameters.length;i++) parameters[i]=parameters[i].split("=");
    for (var i=1;i<parameters.length;i++) {
        switch (parameters[i][0]) {
            case "path"    : SETTINGS.path     = parameters[i][1]; break;
            case "sufx"    : SETTINGS.sufx     = parameters[i][1]; break;
            case "n"       : SETTINGS.n        = parseInt(parameters[i][1]); break;
            case "interval": SETTINGS.interval = parseInt(parameters[i][1]); break;
        }
    }

}

var index = 0;
var interval;
var imgs = [];

$(function(){
  init();
});

function init(){

  parseURL();

  for (var i=0;i<SETTINGS.n;i++){
    imgs.push(SETTINGS.path+"-0"+(SETTINGS.order[i])+"-"+SETTINGS.sufx);
  }

  index = SETTINGS.order[0];

  init_rotator(document.getElementById('rotator'));

  init_controls(document.getElementById('rotator'));

  seti(index);

}

function init_rotator(elem){

  rotator = document.createElement("img");

  rotator.style.width = elem.offsetWidth+"px";

  elem.appendChild(rotator);

  $(rotator).draggable();

  $(rotator).on('mousewheel wheel',function(e){

    var dx = e.originalEvent.deltaX;
    var dy = e.originalEvent.deltaY;

    var x = e.originalEvent.pageX;//-$(this).offset().left;
    var y = e.originalEvent.pageY;//-$(this).offset().top;

    zoom(this,x,y,dy);

    e.preventDefault();
    e.stopPropagation();
    return false;

  });

  $(rotator).click('click',function(e){
    $("#ppb").click();
  });

}

function set_n(){
  index = (index+1)&0x3;
  seti(index);
}

function set_p(){
  index = (index-1)&0x3;
  seti(index);
}

function seti(i,src){
  rotator.src = imgs[i];
  if (src!="radio"){
    $("#flist-"+i).click();
  }else{
    index = i;
  }
}

function zoom(elem,x,y,dy){

  old_pos = $(elem).position();
  old_x = x-old_pos.left;
  old_y = y-old_pos.top;

  old_width = $(elem).width();
  old_height = $(elem).height();

  old_zoom = get_zoom(elem);

  old_zoom_rounded = Math.round(old_zoom*100)/100;
  old_zoom_rounded = Math.floor(old_zoom_rounded*20)/20;

  if (dy>0){
    new_zoom = old_zoom_rounded - 0.05;
  }else{
    new_zoom = old_zoom_rounded + 0.05;
  }

  if (new_zoom==0) new_zoom = 0.05;

  new_width = new_zoom * old_width / old_zoom;
  new_height = new_zoom * old_height / old_zoom;

  k = new_width/old_width;

  new_x = x-k*old_x;
  new_y = y-k*old_y;

  set_zoom(elem,new_y,new_x,new_width,new_height);

}

function set_zoom(elem,top,left,width,height){
  $(elem).css({
    top:top+"px",
    left:left+"px",
    width:width+"px",
    height:height+"px",
  });
}

function get_zoom(elem){

  return $(elem).width()/elem.naturalWidth;

}

var ic_play  = "js/images/ic_play_arrow_black_48dp_1x.png";
var ic_pause = "js/images/ic_pause_black_48dp_1x.png";
var ic_left  = "js/images/ic_navigate_before_black_48dp_1x.png";
var ic_right = "js/images/ic_navigate_next_black_48dp_1x.png";
var ic_file_dl = "js/images/ic_file_download_black_48dp_1x.png";

function init_controls(elem){

  //var panel = $("<div>",{id:"panel"});
  //$(elem).append(panel);

  var panel = $([
    '<div id="panel">',
    ' <table>',
    ' <tr>',
    '   <td></td>',
    '   <td></td>',
    '   <td></td>',
    '   <td></td>',
    ' </tr>',
    ' </table>',
    '</div>'
  ].join('\n'));

  $("body").append(panel);

  var play = $("<img>",{id:"ppb",title:"play"});
  $(play).attr("src",ic_play);
  $(play).attr("playing",false);

  $(play).on("click",function(){

    if ($(this).attr("playing")=='false'){
      $(play).attr("src",ic_pause);
      $(this).attr("playing",true);
      p_play();
    }else{
      $(play).attr("src",ic_play);
      $(this).attr("playing",false);
      p_stop();
    }

  });

  $($(panel).find("td")[0]).append(play);


  var prev = $("<img>",{id:"prev",class:"ctrl",title:"prev"});
  prev.attr("src",ic_left);

  prev.on("click",function(){
    set_p();
  });

  $($(panel).find("td")[0]).append(prev);


  var next = $("<img>",{id:"next",class:"ctrl",title:"next"});
  next.attr("src",ic_right);

  next.on("click",function(){
    set_n();
  });

  $($(panel).find("td")[0]).append(next);

  imgs.forEach(function(c,i){

    var name = c.substr(c.lastIndexOf("/")+1);

    //var rad = $("<input type='radio' class='radio' name='flist' title='"+name+"' />");

    var rad = $("<input>",{
      type:"radio",
      name: "flist",
      id: "flist-"+i,
      class:"radio",
      title: name
    });

    rad.attr("index",i);

    rad.on('click',function(){
      seti(parseInt($(this).attr("index")),"radio");
    });

    $($(panel).find("td")[1]).append(rad);

    var link = $("<a>",{
      href: c
    }).append($("<img>",{
      src: ic_file_dl,
      class: "dl",
      title: "Download "+name
    }));

    $($(panel).find("td")[3]).append(link);

  });

}

function p_play(){
  interval = setInterval('set_n()',SETTINGS.interval);
}

function p_stop(){
  clearInterval(interval);
  interval = null;
}

